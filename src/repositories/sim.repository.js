const db = require('../config/db');

// Valida si el argumento es un arreglo válido con elementos
const isValidArray = (arr) => Array.isArray(arr) && arr.length > 0;

// Obtiene todas las tarjetas SIM activas
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

// Obtiene una tarjeta SIM por ID
exports.getById = async (id) => {
    const simId = Number(id);
    const [rows] = await db.query(
        'SELECT * FROM sim WHERE id_sim = ? AND deleted_at IS NULL',
        [simId]
    );
    const sim = rows[0];
    if (!sim) return null;

    const [ips] = await db.query('SELECT ip FROM ip WHERE id_sim = ?', [simId]);
    const [apns] = await db.query('SELECT apn FROM apn WHERE id_sim = ?', [simId]);

    sim.ips = ips.map(i => i.ip);
    sim.apns = apns.map(a => a.apn);
    return sim;
};

// Busca un registro de tarjeta SIM activo por número de SIM
exports.buscarPorSim = async (num_sim) => {
    const [rows] = await db.query(
        'SELECT * FROM sim WHERE num_sim = ? AND deleted_at IS NULL',
        [String(num_sim).trim()]
    );
    return rows[0] || null;
};

// Registra una nueva tarjeta SIM
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

    if (!id_user) {
        throw new Error("El ID de usuario es obligatorio para registrar la auditoría.");
    }

    tipoSimId = tipoSimId || data.id_tiposim;
    operadorId = operadorId || data.id_operador;
    planId = planId || data.id_plan;
    capacidadId = capacidadId || data.id_capacidad;
    estadoId = estadoId || data.id_estado;
    responsableId = responsableId || data.id_responsable;
    ubicacionId = ubicacionId || data.id_ubicacion;
    destinoId = destinoId || data.id_destino;

    observacion = (observacion !== null && observacion !== undefined) ? String(observacion).trim() : '';

    const entradaApn = data.apn || data.ID_APN || data.nombreApn || [];

    const ipsUnicas = isValidArray(ip)
        ? Array.from(new Set(ip.map(i => String(i).trim()))).filter(Boolean)
        : [];
    
    const apnsProcesados = isValidArray(entradaApn)
        ? Array.from(new Set(entradaApn.map(a => String(a).trim()))).filter(Boolean)
        : (entradaApn && String(entradaApn).trim() !== '' ? [String(entradaApn).trim()] : []);

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Bloqueo de lectura (FOR UPDATE) para prevenir race conditions
        for (const itemIp of ipsUnicas) {
            const [existeIp] = await connection.query(`
                SELECT i.ip FROM ip i
                INNER JOIN sim s ON i.id_sim = s.id_sim
                WHERE TRIM(i.ip) = TRIM(?) AND s.deleted_at IS NULL LIMIT 1 FOR UPDATE
            `, [itemIp]);
            
            if (existeIp.length > 0) {
                throw new Error(`La IP ${itemIp} ya está asignada a otra tarjeta activa.`);
            }
        }

        // Inserta datos principales
        const [result] = await connection.query(`
            INSERT INTO sim (
                num_sim, num_linea, cod_pin, cod_puk, id_tiposim,
                id_operador, id_estado, id_plan, id_capacidad,
                id_responsable, id_destino, id_ubicacion,
                observacion, id_user, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            String(numeroSim || data.NUM_SIM).trim(),
            String(numeroLinea || data.NUM_LINEA).trim(),
            pin != null && String(pin).trim() !== '' ? String(pin).trim() : '0000',
            puk != null && String(puk).trim() !== '' ? String(puk).trim() : '00000000',
            Number(tipoSimId),
            Number(operadorId),
            Number(estadoId),
            Number(planId),
            Number(capacidadId),
            Number(responsableId),
            Number(destinoId),
            Number(ubicacionId),
            observacion,
            Number(id_user)
        ]);

        const simId = result.insertId;
        const ipsTexto = ipsUnicas.length > 0 ? ipsUnicas.join(', ') : 'SIN IP';
        const apnsTexto = apnsProcesados.length > 0 ? apnsProcesados.join(', ') : 'SIN APN';

        // Registra en modificaciones
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
            Number(id_user),
            String(numeroSim || data.NUM_SIM).trim(),
            String(numeroLinea || data.NUM_LINEA).trim(),
            pin != null && String(pin).trim() !== '' ? String(pin).trim() : '0000',
            puk != null && String(puk).trim() !== '' ? String(puk).trim() : '00000000',
            Number(tipoSimId),
            Number(operadorId),
            Number(estadoId),
            Number(planId),
            Number(capacidadId),
            Number(responsableId),
            Number(destinoId),
            Number(ubicacionId),
            ipsTexto,
            apnsTexto,
            observacion
        ]);

        // Inserción de IPs
        for (const item of ipsUnicas) {
            await connection.query(
                'INSERT INTO ip (id_sim, ip) VALUES (?, ?)',
                [simId, item]
            );
        }

        // Inserción de APNs
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

// Actualiza una tarjeta SIM existente
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

    if (!id_user) {
        throw new Error("El ID de usuario es obligatorio para registrar la auditoría.");
    }

    const simIdNum = Number(id);
    observacion = (observacion !== null && observacion !== undefined) ? String(observacion).trim() : '';

    const ipsUnicas = isValidArray(data.ip)
        ? Array.from(new Set(data.ip.map(i => String(i).trim()))).filter(Boolean)
        : [];
        
    const entradaApn = data.apn || data.ID_APN || data.nombreApn || [];
    const apnsProcesados = isValidArray(entradaApn)
        ? Array.from(new Set(entradaApn.map(a => String(a).trim()))).filter(Boolean)
        : (entradaApn && String(entradaApn).trim() !== '' ? [String(entradaApn).trim()] : []);

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT * FROM sim WHERE id_sim = ? FOR UPDATE',
            [simIdNum]
        );
        const vieja = rows[0];
        if (!vieja) throw new Error("SIM no encontrada");

        // Bloqueo y verificación de IPs
        for (const itemIp of ipsUnicas) {
            const [existeIp] = await connection.query(`
                SELECT i.ip FROM ip i
                INNER JOIN sim s ON i.id_sim = s.id_sim
                WHERE TRIM(i.ip) = TRIM(?) AND i.id_sim != ? AND s.deleted_at IS NULL LIMIT 1 FOR UPDATE
            `, [itemIp, simIdNum]);
            
            if (existeIp.length > 0) {
                throw new Error(`La IP ${itemIp} ya está asignada a otra tarjeta activa.`);
            }
        }

        // Actualiza el registro principal
        await connection.query(`
            UPDATE sim SET
                num_sim = ?, num_linea = ?, cod_pin = ?, cod_puk = ?,
                id_tiposim = ?, id_operador = ?, id_estado = ?, id_plan = ?,
                id_capacidad = ?, id_responsable = ?, id_destino = ?,
                id_ubicacion = ?, observacion = ?, updated_at = NOW()
            WHERE id_sim = ?
        `, [
            String(numeroSim).trim(),
            String(numeroLinea).trim(),
            pin != null && String(pin).trim() !== '' ? String(pin).trim() : '0000',
            puk != null && String(puk).trim() !== '' ? String(puk).trim() : '00000000',
            Number(tipoSimId),
            Number(operadorId),
            Number(estadoId),
            Number(planId),
            Number(capacidadId),
            Number(responsableId),
            Number(destinoId),
            Number(ubicacionId),
            observacion,
            simIdNum
        ]);

        const ipsTexto = ipsUnicas.length > 0 ? ipsUnicas.join(', ') : 'SIN IP';
        const apnsTexto = apnsProcesados.length > 0 ? apnsProcesados.join(', ') : 'SIN APN';

        // Registra modificación
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
            simIdNum,
            String(razonModificacion).trim(),
            Number(id_user),
            String(numeroSim).trim(),
            String(numeroLinea).trim(),
            pin != null && String(pin).trim() !== '' ? String(pin).trim() : '0000',
            puk != null && String(puk).trim() !== '' ? String(puk).trim() : '00000000',
            Number(tipoSimId),
            Number(operadorId),
            Number(estadoId),
            Number(planId),
            Number(capacidadId),
            Number(responsableId),
            Number(destinoId),
            Number(ubicacionId),
            ipsTexto,
            apnsTexto,
            observacion
        ]);

        // Reescritura de relaciones
        await connection.query('DELETE FROM ip WHERE id_sim = ?', [simIdNum]);
        await connection.query('DELETE FROM apn WHERE id_sim = ?', [simIdNum]);

        for (const item of ipsUnicas) {
            await connection.query('INSERT INTO ip (id_sim, ip) VALUES (?, ?)', [simIdNum, item]);
        }

        for (const item of apnsProcesados) {
            await connection.query('INSERT INTO apn (id_sim, apn) VALUES (?, ?)', [simIdNum, item]);
        }

        await connection.commit();
        return { id: simIdNum, ...data, observacion, ip: ipsUnicas, apn: apnsProcesados };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Borrado lógico
exports.eliminar = async (id) => {
    const [result] = await db.query(`
        UPDATE sim
        SET deleted_at = NOW(),
            id_estado = (
                SELECT id_estado
                FROM estados
                WHERE TRIM(LOWER(descripcion)) = 'desactivada'
                LIMIT 1
            )
        WHERE id_sim = ?
    `, [Number(id)]);

    return result.affectedRows > 0;
};

// Historial completo
exports.getHistorial = async (id) => {
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
    `, [Number(id)]);

    return rows;
};

// Búsqueda masiva segura previniendo Injection / Type confusion en arreglos
exports.buscarSimsMasivo = async (listaNums) => {
    if (!Array.isArray(listaNums) || !listaNums.length) return [];
    
    // Normalización estricta: asegurar que todos los elementos sean cadenas simples
    const loteLimitado = listaNums
        .filter(item => typeof item === 'string' || typeof item === 'number')
        .map(item => String(item).trim())
        .filter(Boolean)
        .slice(0, 500);

    if (loteLimitado.length === 0) return [];

    const placeholders = loteLimitado.map(() => '?').join(',');

    const [rows] = await db.query(
        `SELECT num_sim FROM sim WHERE num_sim IN (${placeholders}) AND deleted_at IS NULL`,
        loteLimitado
    );
    return rows;
};

// Valida si una IP está registrada al crear
exports.validarIpDuplicadaCrear = async (ip) => {
    const [rows] = await db.query(`
        SELECT i.id_sim, s.num_linea
        FROM ip i
        INNER JOIN sim s ON i.id_sim = s.id_sim
        WHERE TRIM(i.ip) = TRIM(?) AND s.deleted_at IS NULL
        LIMIT 1
    `, [String(ip).trim()]);
    return rows.length > 0 ? rows[0] : null;
};

// Valida si una IP pertenece a otra tarjeta activa al actualizar
exports.validarIpDuplicadaActualizar = async (ip, id_sim) => {
    const [rows] = await db.query(`
        SELECT i.id_sim, s.num_linea
        FROM ip i
        INNER JOIN sim s ON i.id_sim = s.id_sim
        WHERE TRIM(i.ip) = TRIM(?) 
          AND i.id_sim != ? 
          AND s.deleted_at IS NULL
        LIMIT 1
    `, [String(ip).trim(), Number(id_sim)]);
    return rows.length > 0 ? rows[0] : null;
};

// Valida duplicidad de SIM o Línea al crear
exports.validarSimOLineaDuplicadaCrear = async (num_sim, num_linea) => {
    const [rows] = await db.query(`
        SELECT num_sim, num_linea
        FROM sim
        WHERE (num_sim = ? OR num_linea = ?) AND deleted_at IS NULL
        LIMIT 1
    `, [String(num_sim).trim(), String(num_linea).trim()]);

    return rows.length > 0 ? rows[0] : null;
};

// Valida duplicidad de SIM o Línea en otras tarjetas al actualizar
exports.validarSimOLineaDuplicadaActualizar = async (num_sim, num_linea, id_sim) => {
    const [rows] = await db.query(`
        SELECT num_sim, num_linea
        FROM sim
        WHERE (num_sim = ? OR num_linea = ?) AND id_sim != ? AND deleted_at IS NULL
        LIMIT 1
    `, [String(num_sim).trim(), String(num_linea).trim(), Number(id_sim)]);

    return rows.length > 0 ? rows[0] : null;
};
