const XLSX = require('xlsx');
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
    if (!cadena) return '';
    return String(cadena)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

// Carga de identificadores usando la lista blanca
async function cargarIdsValidos(tabla, columnaId) {
    if (!TABLAS_PERMITIDAS[tabla] || TABLAS_PERMITIDAS[tabla] !== columnaId) {
        throw new Error(`Acceso no autorizado a la tabla o columna: ${tabla}.${columnaId}`);
    }
    const [rows] = await db.query(`SELECT ?? AS id FROM ??`, [columnaId, tabla]);
    return new Set(rows.map(r => Number(r.id)));
}

// Carga la lista completa de direcciones IP para validar duplicados
async function cargarIpsExistentes() {
    try {
        const [rows] = await db.query(`SELECT ip FROM ip`);
        return new Set(rows.map(r => String(r.ip).trim()));
    } catch (e) {
        console.warn('⚠️ Error al cargar historico de IPs:', e.message);
        return new Set();
    }
}

const importarExcel = async (req, res) => {
    try {
        // Validacion de la presencia del archivo adjunto
        if (!req.file) {
            return res.status(400).json({ message: 'No se envio ningun archivo' });
        }

        // Validacion del usuario autenticado en la sesion
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
        const data = XLSX.utils.sheet_to_json(sheet, { defval: null });

        if (!data.length) {
            return res.status(400).json({ message: 'El archivo esta vacio' });
        }

        // Control de volumen de datos 
        const MAX_FILAS = 5000;
        if (data.length > MAX_FILAS) {
            return res.status(400).json({ message: `El archivo supera el limite de ${MAX_FILAS} filas` });
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
            console.error('❌ Error cargando catalogos:', catErr.message);
            return res.status(500).json({ message: 'Error interno al inicializar validadores' });
        }

        const filasValidas = [];
        const errores       = [];
        const simsEnExcel   = new Set();
        const ipsEnExcel    = new Set();

        // Iteracion principal sobre cada registro del archivo
        data.forEach((row, index) => {
            const fila = index + 2; // Compensacion por el encabezado en Excel

            const numSim   = row.NUM_SIM   != null ? String(row.NUM_SIM).trim()   : null;
            const numLinea = row.NUM_LINEA != null ? String(row.NUM_LINEA).trim() : null;

            // Ignorar filas totalmente vacias dentro de la hoja
            const estaVacia = Object.values(row).every(valor => valor === null || valor === undefined || String(valor).trim() === '');
            if (estaVacia || (!numSim && !numLinea)) {
                return;
            }

            const problemas = [];

            // Validaciones de campos obligatorios basicos
            if (!numSim) problemas.push('El campo NUM_SIM esta vacio o ausente.');
            if (!numLinea) problemas.push('El campo NUM_LINEA esta vacio o ausente.');

            // Validacion de claves foraneas contra los catalogos cargados
            if (row.ID_OPERADOR == null || String(row.ID_OPERADOR).trim() === '') {
                problemas.push('El campo ID_OPERADOR es obligatorio.');
            } else {
                const operador = Number(row.ID_OPERADOR);
                if (isNaN(operador)) problemas.push(`ID_OPERADOR debe ser un numero ("${row.ID_OPERADOR}")`);
                else if (!idsOperador.has(operador)) problemas.push(`El ID de Operador (${operador}) no existe`);
            }

            if (row.ID_ESTADO == null || String(row.ID_ESTADO).trim() === '') {
                problemas.push('El campo ID_ESTADO es obligatorio.');
            } else {
                const estado = Number(row.ID_ESTADO);
                if (isNaN(estado)) problemas.push(`ID_ESTADO debe ser un numero ("${row.ID_ESTADO}")`);
                else if (!idsEstado.has(estado)) problemas.push(`El ID de Estado (${estado}) no existe`);
            }

            if (row.ID_PLAN == null || String(row.ID_PLAN).trim() === '') {
                problemas.push('El campo ID_PLAN es obligatorio.');
            } else {
                const plan = Number(row.ID_PLAN);
                if (isNaN(plan)) problemas.push(`ID_PLAN debe ser un numero ("${row.ID_PLAN}")`);
                else if (!idsPlan.has(plan)) problemas.push(`El ID de Plan (${plan}) no existe`);
            }

            if (row.ID_CAPACIDAD == null || String(row.ID_CAPACIDAD).trim() === '') {
                problemas.push('El campo ID_CAPACIDAD es obligatorio.');
            } else {
                const capacidad = Number(row.ID_CAPACIDAD);
                if (isNaN(capacidad)) problemas.push(`ID_CAPACIDAD debe ser un numero ("${row.ID_CAPACIDAD}")`);
                else if (!idsCapacidad.has(capacidad)) problemas.push(`El ID de Capacidad (${capacidad}) no existe`);
            }

            if (row.ID_RESPONSABLE == null || String(row.ID_RESPONSABLE).trim() === '') {
                problemas.push('El campo ID_RESPONSABLE es obligatorio.');
            } else {
                const responsable = Number(row.ID_RESPONSABLE);
                if (isNaN(responsable)) problemas.push(`ID_RESPONSABLE debe ser un numero ("${row.ID_RESPONSABLE}")`);
                else if (!idsResponsable.has(responsable)) problemas.push(`El ID de Responsable (${responsable}) no existe`);
            }

            if (row.ID_DESTINO == null || String(row.ID_DESTINO).trim() === '') {
                problemas.push('El campo ID_DESTINO es obligatorio.');
            } else {
                const destino = Number(row.ID_DESTINO);
                if (isNaN(destino)) problemas.push(`ID_DESTINO debe ser un numero ("${row.ID_DESTINO}")`);
                else if (!idsDestino.has(destino)) problemas.push(`El ID de Destino (${destino}) no existe`);
            }

            if (row.ID_UBICACION == null || String(row.ID_UBICACION).trim() === '') {
                problemas.push('El campo ID_UBICACION es obligatorio.');
            } else {
                const ubicacion = Number(row.ID_UBICACION);
                if (isNaN(ubicacion)) problemas.push(`ID_UBICACION debe ser un numero ("${row.ID_UBICACION}")`);
                else if (!idsUbicacion.has(ubicacion)) problemas.push(`El ID de Ubicacion (${ubicacion}) no existe`);
            }

            if (row.ID_TIPOSIM == null || String(row.ID_TIPOSIM).trim() === '') {
                problemas.push('El campo ID_TIPOSIM es obligatorio.');
            } else {
                const tipoSim = Number(row.ID_TIPOSIM);
                if (isNaN(tipoSim)) problemas.push(`ID_TIPOSIM debe ser un numero ("${row.ID_TIPOSIM}")`);
                else if (!idsTipoSim.has(tipoSim)) problemas.push(`El ID de Tipo SIM (${tipoSim}) no existe`);
            }

            // Validaciones de formato para codigos de seguridad PIN y PUK
            const pinStr = row.COD_PIN != null ? String(row.COD_PIN).trim() : '';
            const pukStr = row.COD_PUK != null ? String(row.COD_PUK).trim() : '';

            if (pinStr !== '' && pinStr !== '0' && pinStr.length !== 4) {
                problemas.push(`El PIN debe tener exactamente 4 digitos.`);
            }

            if (pukStr !== '' && pukStr !== '0' && pukStr.length !== 8) {
                problemas.push(`El PUK debe tener exactamente 8 digitos.`);
            }

            // Procesamiento de direcciones IP separadas por coma
            const celdaIp = row.IP != null ? String(row.IP).replace(/\s+/g, '') : '';
            const ipsFila = celdaIp ? celdaIp.split(',').filter(s => s.length > 0) : [];

            ipsFila.forEach(ip => {
                if (ipsRegistradasEnBD.has(ip)) {
                    problemas.push(`La IP "${ip}" ya esta asignada en la Base de Datos.`);
                }
                if (ipsEnExcel.has(ip)) {
                    problemas.push(`La IP "${ip}" esta duplicada en este Excel.`);
                }
            });

            // Compatibilidad para la columna APN
            const celdaApn = row.ID_APN != null ? row.ID_APN : (row.APN != null ? row.APN : null);

            if (numSim && simsEnExcel.has(numSim)) {
                problemas.push(`El numero de SIM ${numSim} esta repetido en el archivo`);
            }

            if (problemas.length > 0) {
                errores.push({ fila, numSim: numSim || '—', problemas });
                return;
            }

            // Registrar valores unicos procesados localmente en este lote
            simsEnExcel.add(numSim);
            ipsFila.forEach(ip => ipsEnExcel.add(ip));

            // Asignacion de valores por defecto cuando no vienen especificados
            const pinFinal = (pinStr === '' || pinStr === '0') ? '0000' : pinStr;
            const pukFinal = (pukStr === '' || pukStr === '0') ? '00000000' : pukStr;
            
            // Sanitizacion de texto antes de la construccion del objeto final
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

        // Consulta en base de datos para verificar tarjetas SIM registradas previamente
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

        // Filtrado final separando registros insertables de los duplicados
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
        const LOTE = 100;

        // Insercion por bloques para evitar saturar el grupo de conexiones a la base de datos
        for (let i = 0; i < paraInsertar.length; i += LOTE) {
            const lote = paraInsertar.slice(i, i + LOTE);
            
            await Promise.all(
                lote.map(async ({ fila, sim }) => {
                    try {
                        await SimRepository.crear(sim);
                        guardadas++;
                    } catch (err) {
                        // Registro detallado en los logs del servidor
                        console.error(`❌ Error al insertar fila ${fila}:`, err);
                        // Mensaje de respuesta seguro para el cliente
                        errores.push({
                            fila,
                            numSim: sim.numeroSim,
                            problemas: ['Error al intentar guardar el registro en el sistema']
                        });
                    }
                })
            );
        }

        // Ordenar errores por numero de fila para ofrecer un reporte ordenado
        errores.sort((a, b) => a.fila - b.fila);

        return res.json({
            total:     paraInsertar.length + errores.length,
            guardadas,
            omitidas: errores.length,
            errores,  
        });

    } catch (error) {
        console.error('❌ Error inesperado en importarExcel:', error);
        return res.status(500).json({ message: 'Error critico interno del servidor al procesar el Excel' });
    }
};

module.exports = {
    importarExcel
};