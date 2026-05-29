const db = require('../config/db');

/**
 * Obtiene todas las SIMs con sus descripciones
 */
exports.getAll = async () => {
    const [rows] = await db.query(`
        SELECT 
            s.id_sim, s.num_linea, s.num_sim, s.cod_pin, s.cod_puk,
            ts.descripcion AS tipo_sim, o.descripcion AS operador,
            e.descripcion AS estado, p.descripcion AS plan,
            c.descripcion AS capacidad, r.descripcion AS responsable,
            d.descripcion AS destino, u.descripcion AS ubicacion
        FROM sim s
        LEFT JOIN tiposim ts ON s.id_tiposim = ts.id_tiposim
        LEFT JOIN operadores o ON s.id_operador = o.id_operador
        LEFT JOIN estados e ON s.id_estado = e.id_estado
        LEFT JOIN planes p ON s.id_plan = p.id_plan
        LEFT JOIN capacidades c ON s.id_capacidad = c.id_capacidad
        LEFT JOIN responsables r ON s.id_responsable = r.id_responsable
        LEFT JOIN destinos d ON s.id_destino = d.id_destino
        LEFT JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
        WHERE s.deleted_at IS NULL
        ORDER BY s.created_at DESC
    `);
    return rows;
};

exports.getById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM sim WHERE id_sim = ? AND deleted_at IS NULL',
        [id]
    );
    const sim = rows[0];
    if (sim) {
        const [ips] = await db.query('SELECT ip FROM ip WHERE id_sim = ?', [id]);
        sim.ips = ips.map(row => row.ip);
        const [apns] = await db.query('SELECT apn FROM apn WHERE id_sim = ?', [id]);
        sim.apns = apns.map(row => row.apn);
    }
    return sim;
};

exports.buscarPorSim = async (num_sim) => {
    const [rows] = await db.query(
        'SELECT * FROM sim WHERE num_sim = ? AND deleted_at IS NULL',
        [num_sim]
    );
    return rows[0];
};

/**
 * CREAR: Registra el estado inicial
 */
exports.crear = async (data) => {
    const {
        numeroSim, numeroLinea, operadorId, estadoId, planId,
        capacidadId, responsableId, destinoId, ubicacionId,
        tipoSimId, pin, puk, observacion, ip, apn, id_user 
    } = data;

    const finalPin = (pin && pin.toString().trim() !== '') ? pin : '0';
    const finalPuk = (puk && puk.toString().trim() !== '') ? puk : '0';
    const finalObs = (observacion && observacion.trim() !== '') ? observacion : 'AGPE';

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(`
            INSERT INTO sim (
                num_sim, num_linea, cod_pin, cod_puk, id_tiposim,
                id_operador, id_estado, id_plan, id_capacidad,
                id_responsable, id_destino, id_ubicacion, observacion, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [numeroSim, numeroLinea, finalPin, finalPuk, tipoSimId, operadorId, estadoId, planId, capacidadId, responsableId, destinoId, ubicacionId, finalObs]);

        const simId = result.insertId;
        const ipsTexto = (Array.isArray(ip) && ip.length > 0) ? ip.join(', ') : 'SIN IP';
        const apnsTexto = (Array.isArray(apn) && apn.length > 0) ? apn.join(', ') : 'SIN APN';

        await connection.query(`
            INSERT INTO modificaciones (
                id_sim, razon, id_user, created_at,
                num_sim, num_linea, cod_pin, cod_puk, id_tiposim, 
                id_operador, id_estado, id_plan, id_capacidad, 
                id_responsable, id_destino, id_ubicacion, ips, apns
            ) VALUES (?, 'REGISTRO INICIAL DEL ÍTEM', ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [simId, id_user || 1, numeroSim, numeroLinea, finalPin, finalPuk, tipoSimId, operadorId, estadoId, planId, capacidadId, responsableId, destinoId, ubicacionId, ipsTexto, apnsTexto]);

        if (ip && ip.length > 0) {
            for (const item of ip) await connection.query('INSERT INTO ip (id_sim, ip) VALUES (?, ?)', [simId, item]);
        }
        if (apn && apn.length > 0) {
            for (const item of apn) await connection.query('INSERT INTO apn (id_sim, apn) VALUES (?, ?)', [simId, item]);
        }

        await connection.commit();
        return { id: simId, ...data };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * ACTUALIZAR: Guarda lo NUEVO en el historial (Recomendado)
 */
exports.actualizar = async (id, data) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. ACTUALIZAR LA TABLA SIM (EL PRESENTE)
        await connection.query(`
            UPDATE sim SET 
                num_sim = ?, num_linea = ?, cod_pin = ?, cod_puk = ?, 
                id_tiposim = ?, id_operador = ?, id_estado = ?, id_plan = ?, 
                id_capacidad = ?, id_responsable = ?, id_destino = ?, 
                id_ubicacion = ?, updated_at = NOW()
            WHERE id_sim = ?
        `, [
            data.numeroSim, data.numeroLinea, data.pin, data.puk, 
            data.tipoSimId, data.operadorId, data.estadoId, data.planId, 
            data.capacidadId, data.responsableId, data.destinoId, 
            data.ubicacionId, id
        ]);

        // 2. PREPARAR TEXTOS PARA EL HISTORIAL
        const ipsTexto = (Array.isArray(data.ip) && data.ip.length > 0) ? data.ip.join(', ') : 'SIN IP';
        const apnsTexto = (Array.isArray(data.apn) && data.apn.length > 0) ? data.apn.join(', ') : 'SIN APN';

        // 3. GUARDAR EL CAMBIO EN EL HISTORIAL (LA FOTO DE CÓMO QUEDÓ)
        await connection.query(`
            INSERT INTO modificaciones (
                id_sim, razon, id_user, created_at,
                num_sim, num_linea, cod_pin, cod_puk, id_tiposim, 
                id_operador, id_estado, id_plan, id_capacidad, 
                id_responsable, id_destino, id_ubicacion, ips, apns
            ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, data.razonModificacion, data.id_user || 1,
            data.numeroSim, data.numeroLinea, data.pin, data.puk, 
            data.tipoSimId, data.operadorId, data.estadoId, data.planId, 
            data.capacidadId, data.responsableId, data.destinoId, 
            data.ubicacionId, ipsTexto, apnsTexto
        ]);

        // Sincronizar tablas auxiliares
        await connection.query('DELETE FROM ip WHERE id_sim = ?', [id]);
        if (Array.isArray(data.ip)) {
            for (const item of data.ip) await connection.query('INSERT INTO ip (id_sim, ip) VALUES (?, ?)', [id, item]);
        }
        await connection.query('DELETE FROM apn WHERE id_sim = ?', [id]);
        if (Array.isArray(data.apn)) {
            for (const item of data.apn) await connection.query('INSERT INTO apn (id_sim, apn) VALUES (?, ?)', [id, item]);
        }

        await connection.commit();
        return { id, ...data };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.eliminar = async (id) => {
    return await db.query(`
        UPDATE sim 
        SET deleted_at = NOW(), 
            id_estado = (SELECT id_estado FROM estados WHERE descripcion LIKE '%Desactivada%' LIMIT 1) 
        WHERE id_sim = ?
    `, [id]);
};

exports.getHistorial = async (id) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                m.razon, m.ips, m.apns, m.created_at, 
                u.nombres, u.apellidos, 
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
        console.error("❌ Error en la consulta de historial:", error.message);
        throw error;
    }
};