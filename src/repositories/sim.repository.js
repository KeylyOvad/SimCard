const db = require('../config/db');

// Valida si el argumento es un arreglo y contiene elementos
const isValidArray = (arr) => Array.isArray(arr) && arr.length > 0;

// Obtiene todas las tarjetas sim activas con sus respectivas relaciones y datos agrupados
exports.getAll = async () => {
    const [rows] = await db.query(`
        SELECT 
            s.id_sim, s.num_linea, s.num_sim, s.cod_pin, s.cod_puk,
            ts.descripcion AS tipo_sim,
            o.descripcion AS operador,
            e.descripcion AS estado,
            p.descripcion AS plan,
            c.descripcion AS capacidad,
            r.descripcion AS responsable,
            d.descripcion AS destino,
            u.descripcion AS ubicacion,
            IFNULL(GROUP_CONCAT(DISTINCT i.ip SEPARATOR ', '), 'SIN IP') AS ips,
            IFNULL(GROUP_CONCAT(DISTINCT a.apn SEPARATOR ', '), 'SIN APN') AS apns
        FROM sim s
        LEFT JOIN tiposim ts ON s.id_tiposim = ts.id_tiposim
        LEFT JOIN operadores o ON s.id_operador = o.id_operador
        LEFT JOIN estados e ON s.id_estado = e.id_estado
        LEFT JOIN planes p ON s.id_plan = p.id_plan
        LEFT JOIN capacidades c ON s.id_capacidad = c.id_capacidad
        LEFT JOIN responsables r ON s.id_responsable = r.id_responsable
        LEFT JOIN destinos d ON s.id_destino = d.id_destino
        LEFT JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
        LEFT JOIN ip i ON s.id_sim = i.id_sim
        LEFT JOIN apn a ON s.id_sim = a.id_sim
        WHERE s.deleted_at IS NULL
        GROUP BY s.id_sim
        ORDER BY s.created_at DESC
    `);
    return rows;
};

// Obtiene una tarjeta sim por su id e integra sus listados de ip y apn correspondientes
exports.getById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM sim WHERE id_sim = ? AND deleted_at IS NULL',
        [id]
    );
    const sim = rows[0];
    if (!sim) return null;

    const [ips] = await db.query('SELECT ip FROM ip WHERE id_sim = ?', [id]);
    const [apns] = await db.query('SELECT apn FROM apn WHERE id_sim = ?', [id]);

    sim.ips = ips.map(i => i.ip);
    sim.apns = apns.map(a => a.apn);
    return sim;
};

// Busca un registro de tarjeta sim activo utilizando el numero de sim
exports.buscarPorSim = async (num_sim) => {
    const [rows] = await db.query(
        'SELECT * FROM sim WHERE num_sim = ? AND deleted_at IS NULL',
        [num_sim]
    );
    return rows[0] || null;
};

// Registra una nueva tarjeta sim, valida duplicidad de ip y guarda el historial en una transaccion
exports.crear = async (data) => {
    let {
        numeroSim,
        numeroLinea,
        tipoSimId,
        operadorId,
        planId,
        capacidadId,
        estadoId,
        responsableId,
        ubicacionId,
        destinoId,
        pin,
        puk,
        observacion,
        ip,
        id_user
    } = data;

    // Mapeo de auxilio en caso de que las llaves vengan con formato de base de datos desde la carga masiva
    if (!tipoSimId && data.id_tiposim) tipoSimId = data.id_tiposim;
    if (!operadorId && data.id_operador) operadorId = data.id_operador;
    if (!planId && data.id_plan) planId = data.id_plan;
    if (!capacidadId && data.id_capacidad) capacidadId = data.id_capacidad;
    if (!estadoId && data.id_estado) estadoId = data.id_estado;
    if (!responsableId && data.id_responsable) responsableId = data.id_responsable;
    if (!ubicacionId && data.id_ubicacion) ubicacionId = data.id_ubicacion;
    if (!destinoId && data.id_destino) destinoId = data.id_destino;

    // Protegemos observacion para que nunca viaje como null absoluto si la BD no lo permite
    observacion = (observacion !== null && observacion !== undefined) ? String(observacion).trim() : '';

    const entradaApn = data.apn || data.ID_APN || data.nombreApn || [];

    const ipsUnicas = isValidArray(ip) 
        ? Array.from(new Set(ip.map(i => String(i).trim()))).filter(i => i !== '') 
        : [];
    
    const apnsProcesados = isValidArray(entradaApn) 
        ? entradaApn.map(a => String(a).trim()).filter(a => a !== '') 
        : (entradaApn && String(entradaApn).trim() !== '' ? [String(entradaApn).trim()] : []);

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Verifica que ninguna IP a registrar este asignada a otra tarjeta SIM activa
        for (const itemIp of ipsUnicas) {
            const [existeIp] = await connection.query(`
                SELECT i.ip FROM ip i 
                INNER JOIN sim s ON i.id_sim = s.id_sim 
                WHERE i.ip = ? AND s.deleted_at IS NULL LIMIT 1
            `, [itemIp]);
            
            if (existeIp.length > 0) {
                throw new Error(`La IP ${itemIp} ya está asignada a otra tarjeta activa.`);
            }
        }

        // Inserta los datos principales de la tarjeta SIM
        const [result] = await connection.query(`
            INSERT INTO sim (
                num_sim, num_linea, cod_pin, cod_puk, id_tiposim,
                id_operador, id_estado, id_plan, id_capacidad,
                id_responsable, id_destino, id_ubicacion,
                observacion, id_user, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            String(numeroSim || data.NUM_SIM),
            String(numeroLinea || data.NUM_LINEA),
            pin != null && String(pin).trim() !== '' ? String(pin) : '0',
            puk != null && String(puk).trim() !== '' ? String(puk) : '0',
            tipoSimId,
            operadorId,
            estadoId,
            planId,
            capacidadId,
            responsableId,
            destinoId,
            ubicacionId,
            observacion, 
            id_user || 1
        ]);

        const simId = result.insertId;
        const ipsTexto = ipsUnicas.length > 0 ? ipsUnicas.join(', ') : 'SIN IP';
        const apnsTexto = apnsProcesados.length > 0 ? apnsProcesados.join(', ') : 'SIN APN';

        // Registra el estado inicial de la tarjeta en la tabla de modificaciones
        await connection.query(`
            INSERT INTO modificaciones (
                id_sim, razon, id_user, created_at,
                num_sim, num_linea, cod_pin, cod_puk,
                id_tiposim, id_operador, id_estado,
                id_plan, id_capacidad, id_responsable,
                id_destino, id_ubicacion, ips, apns,
                observacion
            ) VALUES (?, 'REGISTRO INICIAL DEL ÍTEM', ?, NOW(),
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            simId,
            id_user || 1,
            String(numeroSim || data.NUM_SIM),
            String(numeroLinea || data.NUM_LINEA),
            pin != null && String(pin).trim() !== '' ? String(pin) : '0',
            puk != null && String(puk).trim() !== '' ? String(puk) : '0',
            tipoSimId,
            operadorId,
            estadoId,
            planId,
            capacidadId,
            responsableId,
            destinoId,
            ubicacionId,
            ipsTexto,
            apnsTexto,
            observacion
        ]);

        // Inserta las ip asociadas a la tarjeta sim
        for (const item of ipsUnicas) {
            await connection.query(
                'INSERT INTO ip (id_sim, ip) VALUES (?, ?)',
                [simId, item]
            );
        }

        // Inserta los apn asociados a la tarjeta sim
        for (const item of apnsProcesados) {
            await connection.query(
                'INSERT INTO apn (id_sim, apn) VALUES (?, ?)',
                [simId, item]
            );
        }

        await connection.commit();
        return { id: simId, ...data, observacion, ip: ipsUnicas, apn: apnsProcesados };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Actualiza una tarjeta sim existente, reescribe ip y apn y guarda el motivo del cambio
exports.actualizar = async (id, data) => {
    let {
        numeroSim,
        numeroLinea,
        tipoSimId,
        operadorId,
        planId,
        capacidadId,
        estadoId,
        responsableId,
        ubicacionId,
        destinoId,
        pin,
        puk,
        observacion,
        razonModificacion,
        id_user
    } = data;

    // Protegemos observacion para evitar nulos en actualizaciones masivas o individuales
    observacion = (observacion !== null && observacion !== undefined) ? String(observacion).trim() : '';

    const ipsUnicas = isValidArray(data.ip) 
        ? Array.from(new Set(data.ip.map(i => String(i).trim()))).filter(i => i !== '') 
        : [];
        
    const entradaApn = data.apn || data.ID_APN || data.nombreApn || [];
    const apnsProcesados = isValidArray(entradaApn) 
        ? entradaApn.map(a => String(a).trim()).filter(a => a !== '') 
        : (entradaApn && String(entradaApn).trim() !== '' ? [String(entradaApn).trim()] : []);

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Valida la existentente de la tarjeta sim a actualizar
        const [rows] = await connection.query(
            'SELECT * FROM sim WHERE id_sim = ?',
            [id]
        );
        const vieja = rows[0];
        if (!vieja) throw new Error("SIM no encontrada");

        // Verifica duplicados de ip excluyendo el id de la tarjeta sim actual
        for (const itemIp of ipsUnicas) {
            const [existeIp] = await connection.query(`
                SELECT i.ip FROM ip i 
                INNER JOIN sim s ON i.id_sim = s.id_sim 
                WHERE i.ip = ? AND i.id_sim != ? AND s.deleted_at IS NULL LIMIT 1
            `, [itemIp, id]);
            
            if (existeIp.length > 0) {
                throw new Error(`La IP ${itemIp} ya está asignada a otra tarjeta activa.`);
            }
        }

        // Aplica los cambios sobre el registro principal de la tarjeta sim
        await connection.query(`
            UPDATE sim SET 
                num_sim = ?, num_linea = ?, cod_pin = ?, cod_puk = ?, 
                id_tiposim = ?, id_operador = ?, id_estado = ?, id_plan = ?, 
                id_capacidad = ?, id_responsable = ?, id_destino = ?, 
                id_ubicacion = ?, observacion = ?, updated_at = NOW()
            WHERE id_sim = ?
        `, [
            String(numeroSim),
            String(numeroLinea),
            pin != null && String(pin).trim() !== '' ? String(pin) : '0',
            puk != null && String(puk).trim() !== '' ? String(puk) : '0',
            tipoSimId,
            operadorId,
            estadoId,
            planId,
            capacidadId,
            responsableId,
            destinoId,
            ubicacionId,
            observacion,
            id
        ]);

        const ipsTexto = ipsUnicas.length > 0 ? ipsUnicas.join(', ') : 'SIN IP';
        const apnsTexto = apnsProcesados.length > 0 ? apnsProcesados.join(', ') : 'SIN APN';

        // Guarda el registro de modificacion detallando los nuevos valores establecidos junto con la observacion técnica
        await connection.query(`
            INSERT INTO modificaciones (
                id_sim, razon, id_user, created_at,
                num_sim, num_linea, cod_pin, cod_puk,
                id_tiposim, id_operador, id_estado,
                id_plan, id_capacidad, id_responsable,
                id_destino, id_ubicacion, ips, apns,
                observacion
            ) VALUES (?, ?, ?, NOW(),
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            razonModificacion,
            id_user || 1,
            String(numeroSim),
            String(numeroLinea),
            pin != null && String(pin).trim() !== '' ? String(pin) : '0',
            puk != null && String(puk).trim() !== '' ? String(puk) : '0',
            tipoSimId,
            operadorId,
            estadoId,
            planId,
            capacidadId,
            responsableId,
            destinoId,
            ubicacionId,
            ipsTexto,
            apnsTexto,
            observacion
        ]);

        // Remueve las relaciones de ip y apn anteriores para reescribirlas
        await connection.query('DELETE FROM ip WHERE id_sim = ?', [id]);
        await connection.query('DELETE FROM apn WHERE id_sim = ?', [id]);

        // Inserta un nuevo conjunto de ip asociadas
        for (const item of ipsUnicas) {
            await connection.query(
                'INSERT INTO ip (id_sim, ip) VALUES (?, ?)',
                [id, item]
            );
        }

        // Inserta un nuevo conjunto de apn asociados
        for (const item of apnsProcesados) {
            await connection.query(
                'INSERT INTO apn (id_sim, apn) VALUES (?, ?)',
                [id, item]
            );
        }

        await connection.commit();
        return { id, ...data, observacion, ip: ipsUnicas, apn: apnsProcesados };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Realiza una eliminacion logica de la sim y actualiza su estado a Desactivada de forma automatica
exports.eliminar = async (id) => {
    const [result] = await db.query(`
        UPDATE sim 
        SET deleted_at = NOW(),
            id_estado = (
                SELECT id_estado
                FROM estados
                WHERE descripcion LIKE '%Desactivada%'
                LIMIT 1
            )
        WHERE id_sim = ?
    `, [id]);

    return result.affectedRows > 0;
};

// Obtiene la bitacora de modificaciones e historial de cambios completo de una tarjeta sim incluyendo la observacion
exports.getHistorial = async (id) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                m.razon, m.ips, m.apns, m.created_at, m.observacion,
                IFNULL(u.nombres, 'SISTEMA') AS nombres, 
                IFNULL(u.apellidos, '(CARGA MASIVA)') AS apellidos, 
                m.num_sim, m.num_linea, m.cod_pin AS pin, m.cod_puk AS puk,
                ts.descripcion AS tipo_sim, 
                o.descripcion AS operador,
                p.descripcion AS plan, 
                c.descripcion AS capacidad,
                e.descripcion AS estado, 
                r.descripcion AS responsable,
                loc.descripcion AS ubicacion, 
                d.descripcion AS destino
            FROM modificaciones m
            LEFT JOIN usuarios u ON m.id_user = u.id_usuario
            LEFT JOIN tiposim ts ON m.id_tiposim = ts.id_tiposim
            LEFT JOIN operadores o ON m.id_operador = o.id_operador
            LEFT JOIN planes p ON m.id_plan = p.id_plan
            LEFT JOIN capacidades c ON m.id_capacidad = c.id_capacidad
            LEFT JOIN estados e ON m.id_estado = e.id_estado
            LEFT JOIN responsables r ON m.id_responsable = r.id_responsable
            LEFT JOIN ubicaciones loc ON m.id_ubicacion = loc.id_ubicacion
            LEFT JOIN destinos d ON m.id_destino = d.id_destino
            WHERE m.id_sim = ?
            ORDER BY m.created_at DESC
        `, [id]);

        return rows;

    } catch (error) {
        console.error("❌ Error en historial:", error.message);
        throw error;
    }
};

// Busca de forma masiva los numeros de sim existentes entre una lista de parametros dada
exports.buscarSimsMasivo = async (listaNums) => {
    if (!listaNums.length) return [];
    const placeholders = listaNums.map(() => '?').join(',');
    const [rows] = await db.query(
        `SELECT num_sim FROM sim WHERE num_sim IN (${placeholders}) AND deleted_at IS NULL`,
        listaNums
    );
    return rows;
};

// Valida si una ip ya esta registrada y activa antes de empezar con una creacion
exports.validarIpDuplicadaCrear = async (ip) => {
    const [rows] = await db.query(`
        SELECT i.id_sim, s.num_linea 
            FROM ip i
            INNER JOIN sim s ON i.id_sim = s.id_sim
            WHERE i.ip = ? AND s.deleted_at IS NULL
            LIMIT 1
    `, [ip]);
    return rows.length > 0 ? rows[0] : null;
};

// Valida si una ip ya esta registrada por otra tarjeta activa antes de proceder con una actualizacion
exports.validarIpDuplicadaActualizar = async (ip, id_sim) => {
    const [rows] = await db.query(`
        SELECT i.id_sim, s.num_linea 
            FROM ip i
            INNER JOIN sim s ON i.id_sim = s.id_sim
            WHERE i.ip = ? AND i.id_sim != ? AND s.deleted_at IS NULL
            LIMIT 1
    `, [ip, id_sim]);
    return rows.length > 0 ? rows[0] : null;
};