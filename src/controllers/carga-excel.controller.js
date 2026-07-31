const XLSX = require('xlsx');
const mssql = require('mssql');
const SimRepository = require('../repositories/sim.repository');
const db = require('../config/db'); 

// Lista blanca 
const TABLAS_PERMITIDAS = {
    operadores: 'id_operador',
    estados: 'id_estado',
    planes: 'id_plan',
    capacidades: 'id_capacidad',
    responsables: 'id_responsable',
    destinos: 'id_destino',
    ubicaciones: 'id_ubicacion',
    tiposim: 'id_tiposim'
};

function sanitizarTexto(cadena) {
    if (cadena === null || cadena === undefined) return '';
    return String(cadena).trim();
}


async function obtenerPool() {
    if (typeof db.getConnection === 'function') {
        return await db.getConnection();
    }
    return await db.poolPromise;
}

// Carga de identificadores usando la lista blanca
async function cargarIdsValidos(tabla, columnaId) {
    if (!TABLAS_PERMITIDAS[tabla] || TABLAS_PERMITIDAS[tabla] !== columnaId) {
        throw new Error(`Acceso no autorizado a la tabla o columna: ${tabla}.${columnaId}`);
    }
    
    const pool = await obtenerPool();
    const query = `SELECT [${columnaId}] AS id FROM [${tabla}]`;
    const result = await pool.request().query(query);
    
    return new Set(result.recordset.map(r => Number(r.id)));
}

// Carga la lista completa de direcciones IP para validar duplicados
async function cargarIpsExistentes() {
    try {
        const pool = await obtenerPool();
        const result = await pool.request().query(`SELECT [ip] FROM [ip]`);
        return new Set(result.recordset.map(r => String(r.ip).trim()));
    } catch (e) {
        console.warn('⚠️ Error al cargar histórico de IPs:', e.message);
        return new Set();
    }
}

const importarExcel = async (req, res) => {
    try {
        // Validacion de la presencia del archivo adjunto
        if (!req.file) {
            return res.status(400).json({ message: 'No se envió ningún archivo' });
        }

        // Validacion del usuario autenticado
        const usuarioIdReal = req.user?.id;
        if (!usuarioIdReal) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

        // Lectura del libro limitando las filas a procesar 
        const workbook = XLSX.read(req.file.buffer, { 
            type: 'buffer',
            sheetRows: 5005 
        });

        if (!workbook.SheetNames.length) {
            return res.status(400).json({ message: 'El archivo Excel no contiene hojas' });
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false }); 

        if (!data.length) {
            return res.status(400).json({ message: 'El archivo está vacío' });
        }

        // Control de volumen de datos 
        const MAX_FILAS = 5000;
        if (data.length > MAX_FILAS) {
            return res.status(400).json({ message: `El archivo supera el límite de ${MAX_FILAS} filas` });
        }

        // Carga en paralelo de todos los catalogos requeridos
        let idsOperador, idsEstado, idsPlan, idsCapacidad, idsResponsable, idsDestino, idsUbicacion, idsTipoSim, ipsRegistradasEnBD;
        try {
            [
                idsOperador,
                idsEstado,
                idsPlan,
                idsCapacidad,
                idsResponsable,
                idsDestino,
                idsUbicacion,
                idsTipoSim,
                ipsRegistradasEnBD
            ] = await Promise.all([
                cargarIdsValidos('operadores',   'id_operador'),
                cargarIdsValidos('estados',      'id_estado'),
                cargarIdsValidos('planes',       'id_plan'),
                cargarIdsValidos('capacidades',  'id_capacidad'),
                cargarIdsValidos('responsables', 'id_responsable'),
                cargarIdsValidos('destinos',     'id_destino'),
                cargarIdsValidos('ubicaciones',  'id_ubicacion'),
                cargarIdsValidos('tiposim',      'id_tiposim'),
                cargarIpsExistentes()
            ]);
        } catch (catErr) {
            console.error('❌ Error cargando catálogos:', catErr.message);
            return res.status(500).json({ message: 'Error interno al inicializar validadores' });
        }

        const filasValidas = [];
        const errores       = [];
        const simsEnExcel   = new Set();
        const ipsEnExcel    = new Set();

        // Iteracion principal sobre cada registro del archivo
        data.forEach((row, index) => {
            const fila = index + 2; 

            // Limpieza conservando todos los caracteres
            const numSim   = row.NUM_SIM   != null ? String(row.NUM_SIM).trim()   : null;
            const numLinea = row.NUM_LINEA != null ? String(row.NUM_LINEA).trim() : null;

            // Ignorar filas completamente vacias
            const estaVacia = Object.values(row).every(valor => valor === null || valor === undefined || String(valor).trim() === '');
            if (estaVacia || (!numSim && !numLinea)) {
                return;
            }

            const problemas = [];

            // Validación de campos obligatorios
            if (!numSim) {
                problemas.push('El campo NUM_SIM está vacío o ausente.');
            }

            if (!numLinea) {
                problemas.push('El campo NUM_LINEA está vacío o ausente.');
            }

            // Validar claves foraneas
            const validarFK = (valor, campo, setValido) => {
                if (valor == null || String(valor).trim() === '') {
                    problemas.push(`El campo ${campo} es obligatorio.`);
                } else {
                    const num = Number(valor);
                    if (isNaN(num)) problemas.push(`${campo} debe ser un número ("${valor}")`);
                    else if (!setValido.has(num)) problemas.push(`El ID (${num}) en ${campo} no existe`);
                }
            };

            validarFK(row.ID_OPERADOR,    'ID_OPERADOR',    idsOperador);
            validarFK(row.ID_ESTADO,      'ID_ESTADO',      idsEstado);
            validarFK(row.ID_PLAN,        'ID_PLAN',        idsPlan);
            validarFK(row.ID_CAPACIDAD,   'ID_CAPACIDAD',   idsCapacidad);
            validarFK(row.ID_RESPONSABLE, 'ID_RESPONSABLE', idsResponsable);
            validarFK(row.ID_DESTINO,     'ID_DESTINO',     idsDestino);
            validarFK(row.ID_UBICACION,   'ID_UBICACION',   idsUbicacion);
            validarFK(row.ID_TIPOSIM,     'ID_TIPOSIM',     idsTipoSim);

            // Validacion de PIN y PUK
            let pinStr = row.COD_PIN != null ? String(row.COD_PIN).trim() : '';
            let pukStr = row.COD_PUK != null ? String(row.COD_PUK).trim() : '';

            if (pinStr !== '' && pinStr !== '0') {
                pinStr = pinStr.padStart(4, '0');
                if (!/^\d{4}$/.test(pinStr)) {
                    problemas.push(`El PIN debe contener exactamente 4 dígitos (recibido: "${pinStr}").`);
                }
            }

            if (pukStr !== '' && pukStr !== '0') {
                pukStr = pukStr.padStart(8, '0');
                if (!/^\d{8}$/.test(pukStr)) {
                    problemas.push(`El PUK debe contener exactamente 8 dígitos (recibido: "${pukStr}").`);
                }
            }

            // Validaciones de IP
            const celdaIp = row.IP != null ? String(row.IP).replace(/\s+/g, '') : '';
            const ipsFila = celdaIp ? celdaIp.split(',').filter(s => s.length > 0) : [];

            ipsFila.forEach(ip => {
                if (ipsRegistradasEnBD.has(ip)) {
                    problemas.push(`La IP "${ip}" ya está asignada en la Base de Datos.`);
                }
                if (ipsEnExcel.has(ip)) {
                    problemas.push(`La IP "${ip}" está duplicada en este Excel.`);
                }
            });

            const celdaApn = row.ID_APN != null ? row.ID_APN : (row.APN != null ? row.APN : null);

            if (numSim && simsEnExcel.has(numSim)) {
                problemas.push(`El número de SIM ${numSim} está repetido en el archivo`);
            }

            // Si hay problemas, agregar al listado de errores y omitir de insercion
            if (problemas.length > 0) {
                errores.push({ fila, numSim: numSim || '—', problemas });
                return;
            }

            simsEnExcel.add(numSim);
            ipsFila.forEach(ip => ipsEnExcel.add(ip));

            const pinFinal = (pinStr === '' || pinStr === '0') ? '0000' : pinStr;
            const pukFinal = (pukStr === '' || pukStr === '0') ? '00000000' : pukStr;
            const observacionFinal = sanitizarTexto(row.OBSERVACION);

            filasValidas.push({
                fila,
                sim: {
                    numeroSim:     sanitizarTexto(numSim),
                    numeroLinea:   sanitizarTexto(numLinea),
                    operadorId:    Number(row.ID_OPERADOR),
                    estadoId:      Number(row.ID_ESTADO),
                    planId:        Number(row.ID_PLAN),
                    capacidadId:   Number(row.ID_CAPACIDAD),
                    responsableId: Number(row.ID_RESPONSABLE),
                    destinoId:     Number(row.ID_DESTINO),
                    ubicacionId:   Number(row.ID_UBICACION),
                    tipoSimId:     Number(row.ID_TIPOSIM),
                    pin:           pinFinal,
                    puk:           pukFinal,
                    observacion:   observacionFinal,
                    ip:            ipsFila.map(ip => sanitizarTexto(ip)),
                    apn:           celdaApn ? String(celdaApn).split(',').map(s => sanitizarTexto(s)).filter(s => s.length > 0) : [],
                    id_user:       usuarioIdReal,
                }
            });
        });

        // Verificacion masiva de SIMs registradas previamente
        let existentesEnBD = [];
        if (filasValidas.length > 0) {
            try {
                existentesEnBD = await SimRepository.buscarSimsMasivo(
                    filasValidas.map(f => f.sim.numeroSim)
                );
            } catch (dbErr) {
                console.error('❌ Error consultando duplicados en BD:', dbErr.message);
                return res.status(500).json({ message: 'Error de base de datos al validar duplicados' });
            }
        }
        
        const setExistentes = new Set(existentesEnBD.map(s => String(s.num_sim)));

        const paraInsertar = [];
        for (const item of filasValidas) {
            if (setExistentes.has(item.sim.numeroSim)) {
                errores.push({
                    fila: item.fila,
                    numSim: item.sim.numeroSim,
                    problemas: [`La tarjeta SIM Nro. ${item.sim.numeroSim} ya existe en el sistema`]
                });
            } else {
                paraInsertar.push(item);
            }
        }

        let guardadas = 0;

        // Insercion 
        if (paraInsertar.length > 0) {
            const pool = await obtenerPool();
            const transaction = new mssql.Transaction(pool);

            try {
                await transaction.begin();

                for (const { sim } of paraInsertar) {
                    await SimRepository.crear(sim, transaction);
                    guardadas++;
                }

                await transaction.commit();
            } catch (transErr) {
                console.error('⚠️ Transacción abortada. Realizando Rollback...', transErr.message);
                
                try {
                    await transaction.rollback();
                } catch (rbErr) {
                    console.error('Error al hacer rollback:', rbErr.message);
                }

                return res.status(500).json({ 
                    message: 'Ocurrió un error al guardar los datos en la base de datos.',
                    error: transErr.message 
                });
            }
        }

        errores.sort((a, b) => a.fila - b.fila);

        // Respuesta final
        return res.json({
            total: paraInsertar.length + errores.length,
            guardadas,
            omitidas: errores.length,
            errores,  
        });

    } catch (error) {
        console.error('❌ Error inesperado en importarExcel:', error);
        return res.status(500).json({ message: 'Error crítico interno del servidor al procesar el Excel' });
    }
};

module.exports = {
    importarExcel
};