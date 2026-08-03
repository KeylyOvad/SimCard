const { sql, poolPromise } = require('../config/db');


const isValidArray = (arr) => Array.isArray(arr) && arr.length > 0;


const toNullableInt = (val) => {
    const parsed = Number(val);
    return isNaN(parsed) || val === null || val === undefined ? null : parsed;
};

// Obtiene todas las tarjetas SIM activas
exports.getAll = async () => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        WITH cte_ips AS (
            SELECT id_sim, STRING_AGG(ip, ', ') AS ips
            FROM (SELECT DISTINCT id_sim, ip FROM ip) x
            GROUP BY id_sim
        ),
        cte_apns AS (
            SELECT id_sim, STRING_AGG(apn, ', ') AS apns
            FROM (SELECT DISTINCT id_sim, apn FROM apn) y
            GROUP BY id_sim
        )
        SELECT
            s.id_sim, s.num_linea, s.num_sim, s.cod_pin, s.cod_puk, s.created_at,
            ts.descripcion AS tipo_sim,
            o.descripcion AS operador,
            e.descripcion AS estado,
            p.descripcion AS [plan],
            c.descripcion AS capacidad,
            r.descripcion AS responsable,
            d.descripcion AS destino,
            u.descripcion AS ubicacion,
            ISNULL(i.ips, 'SIN IP') AS ips,
            ISNULL(a.apns, 'SIN APN') AS apns
        FROM sim s
        LEFT JOIN tiposim ts ON s.id_tiposim = ts.id_tiposim
        LEFT JOIN operadores o ON s.id_operador = o.id_operador
        LEFT JOIN estados e ON s.id_estado = e.id_estado
        LEFT JOIN planes p ON s.id_plan = p.id_plan
        LEFT JOIN capacidades c ON s.id_capacidad = c.id_capacidad
        LEFT JOIN responsables r ON s.id_responsable = r.id_responsable
        LEFT JOIN destinos d ON s.id_destino = d.id_destino
        LEFT JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
        LEFT JOIN cte_ips i ON s.id_sim = i.id_sim
        LEFT JOIN cte_apns a ON s.id_sim = a.id_sim
        WHERE s.deleted_at IS NULL
        ORDER BY s.created_at DESC
    `);
    return result.recordset;
};

// Obtiene una tarjeta SIM por ID
exports.getById = async (id) => {
    const pool = await poolPromise;
    const simId = Number(id);

    const resultSim = await pool.request()
        .input('id_sim', sql.Int, simId)
        .query('SELECT * FROM sim WHERE id_sim = @id_sim AND deleted_at IS NULL');
    
    const sim = resultSim.recordset[0];
    if (!sim) return null;

    const resultIps = await pool.request()
        .input('id_sim', sql.Int, simId)
        .query('SELECT ip FROM ip WHERE id_sim = @id_sim');

    const resultApns = await pool.request()
        .input('id_sim', sql.Int, simId)
        .query('SELECT apn FROM apn WHERE id_sim = @id_sim');

    sim.ips = resultIps.recordset.map(i => i.ip);
    sim.apns = resultApns.recordset.map(a => a.apn);
    return sim;
};

// Busca un registro de tarjeta SIM activo por numero de SIM
exports.buscarPorSim = async (num_sim) => {
    const pool = await poolPromise;
    const cleanNumSim = num_sim != null ? String(num_sim).trim() : '';

    const result = await pool.request()
        .input('num_sim', sql.VarChar, cleanNumSim)
        .query('SELECT * FROM sim WHERE num_sim = @num_sim AND deleted_at IS NULL');
        
    return result.recordset[0] || null;
};

// Registra una nueva tarjeta SIM
exports.crear = async (data) => {
    let {
        numeroSim, numeroLinea, tipoSimId, operadorId, planId,
        capacidadId, estadoId, responsableId, ubicacionId, destinoId,
        pin, puk, observacion, ip, id_user
    } = data;

    if (!id_user) {
        throw new Error("El ID de usuario es obligatorio para registrar la auditoría.");
    }

    tipoSimId = toNullableInt(tipoSimId || data.id_tiposim);
    operadorId = toNullableInt(operadorId || data.id_operador);
    planId = toNullableInt(planId || data.id_plan);
    capacidadId = toNullableInt(capacidadId || data.id_capacidad);
    estadoId = toNullableInt(estadoId || data.id_estado);
    responsableId = toNullableInt(responsableId || data.id_responsable);
    ubicacionId = toNullableInt(ubicacionId || data.id_ubicacion);
    destinoId = toNullableInt(destinoId || data.id_destino);

    observacion = (observacion !== null && observacion !== undefined) ? String(observacion).trim() : '';

    const entradaApn = data.apn || data.ID_APN || data.nombreApn || [];

    const ipsUnicas = isValidArray(ip)
        ? Array.from(new Set(ip.map(i => String(i).trim()))).filter(Boolean)
        : [];
        
    const apnsProcesados = isValidArray(entradaApn)
        ? Array.from(new Set(entradaApn.map(a => String(a).trim()))).filter(Boolean)
        : (entradaApn && String(entradaApn).trim() !== '' ? [String(entradaApn).trim()] : []);

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Validar IPs duplicadas en una sola consulta
        if (ipsUnicas.length > 0) {
            const reqCheckIp = new sql.Request(transaction);
            const inParams = ipsUnicas.map((item, idx) => {
                reqCheckIp.input(`ip_val_${idx}`, sql.VarChar, item);
                return `@ip_val_${idx}`;
            }).filter(Boolean).join(',');

            if (inParams.length > 0) {
                const checkIp = await reqCheckIp.query(`
                    SELECT TOP 1 i.ip FROM ip i WITH (UPDLOCK, HOLDLOCK)
                    INNER JOIN sim s ON i.id_sim = s.id_sim
                    WHERE i.ip IN (${inParams}) AND s.deleted_at IS NULL
                `);

                if (checkIp.recordset.length > 0) {
                    throw new Error(`La IP ${checkIp.recordset[0].ip} ya está asignada a otra tarjeta activa.`);
                }
            }
        }

        const numSimClean = String(numeroSim || data.NUM_SIM || '').trim();
        const numLineaClean = String(numeroLinea || data.NUM_LINEA || '').trim();
        const pinClean = pin != null && String(pin).trim() !== '' ? String(pin).trim() : '0000';
        const pukClean = puk != null && String(puk).trim() !== '' ? String(puk).trim() : '00000000';

        // Insertar SIM principal (Se usa GETUTCDATE)
        const requestSim = new sql.Request(transaction);
        const insertSim = await requestSim
            .input('num_sim', sql.VarChar, numSimClean)
            .input('num_linea', sql.VarChar, numLineaClean)
            .input('cod_pin', sql.VarChar, pinClean)
            .input('cod_puk', sql.VarChar, pukClean)
            .input('id_tiposim', sql.Int, tipoSimId)
            .input('id_operador', sql.Int, operadorId)
            .input('id_estado', sql.Int, estadoId)
            .input('id_plan', sql.Int, planId)
            .input('id_capacidad', sql.Int, capacidadId)
            .input('id_responsable', sql.Int, responsableId)
            .input('id_destino', sql.Int, destinoId)
            .input('id_ubicacion', sql.Int, ubicacionId)
            .input('observacion', sql.VarChar, observacion)
            .input('id_user', sql.Int, Number(id_user))
            .query(`
                INSERT INTO sim (
                    num_sim, num_linea, cod_pin, cod_puk, id_tiposim,
                    id_operador, id_estado, id_plan, id_capacidad,
                    id_responsable, id_destino, id_ubicacion,
                    observacion, id_user, created_at
                ) VALUES (
                    @num_sim, @num_linea, @cod_pin, @cod_puk, @id_tiposim,
                    @id_operador, @id_estado, @id_plan, @id_capacidad,
                    @id_responsable, @id_destino, @id_ubicacion,
                    @observacion, @id_user, GETUTCDATE()
                );
                SELECT SCOPE_IDENTITY() AS insertId;
            `);

        const simId = insertSim.recordset[0].insertId;
        const ipsTexto = ipsUnicas.length > 0 ? ipsUnicas.join(', ') : 'SIN IP';
        const apnsTexto = apnsProcesados.length > 0 ? apnsProcesados.join(', ') : 'SIN APN';

        // Insertar Historial de Modificacion (Se usa GETUTCDATE)
        const requestModif = new sql.Request(transaction);
        await requestModif
            .input('id_sim', sql.Int, simId)
            .input('id_user', sql.Int, Number(id_user))
            .input('num_sim', sql.VarChar, numSimClean)
            .input('num_linea', sql.VarChar, numLineaClean)
            .input('cod_pin', sql.VarChar, pinClean)
            .input('cod_puk', sql.VarChar, pukClean)
            .input('id_tiposim', sql.Int, tipoSimId)
            .input('id_operador', sql.Int, operadorId)
            .input('id_estado', sql.Int, estadoId)
            .input('id_plan', sql.Int, planId)
            .input('id_capacidad', sql.Int, capacidadId)
            .input('id_responsable', sql.Int, responsableId)
            .input('id_destino', sql.Int, destinoId)
            .input('id_ubicacion', sql.Int, ubicacionId)
            .input('ips', sql.VarChar, ipsTexto)
            .input('apns', sql.VarChar, apnsTexto)
            .input('observacion', sql.VarChar, observacion)
            .query(`
                INSERT INTO modificaciones (
                    id_sim, razon, id_user, created_at,
                    num_sim, num_linea, cod_pin, cod_puk,
                    id_tiposim, id_operador, id_estado,
                    id_plan, id_capacidad, id_responsable,
                    id_destino, id_ubicacion, ips, apns, observacion
                ) VALUES (
                    @id_sim, 'REGISTRO INICIAL DEL ÍTEM', @id_user, GETUTCDATE(),
                    @num_sim, @num_linea, @cod_pin, @cod_puk,
                    @id_tiposim, @id_operador, @id_estado,
                    @id_plan, @id_capacidad, @id_responsable,
                    @id_destino, @id_ubicacion, @ips, @apns, @observacion
                )
            `);

        // Insertar IPs masivamente
        if (ipsUnicas.length > 0) {
            const reqIp = new sql.Request(transaction);
            reqIp.input('id_sim', sql.Int, simId);
            const valuesIp = ipsUnicas.map((item, idx) => {
                reqIp.input(`ip_${idx}`, sql.VarChar, item);
                return `(@id_sim, @ip_${idx})`;
            }).filter(Boolean).join(', ');

            if (valuesIp.length > 0) {
                await reqIp.query(`INSERT INTO ip (id_sim, ip) VALUES ${valuesIp}`);
            }
        }

        // Insertar APNs masivamente
        if (apnsProcesados.length > 0) {
            const reqApn = new sql.Request(transaction);
            reqApn.input('id_sim', sql.Int, simId);
            const valuesApn = apnsProcesados.map((item, idx) => {
                reqApn.input(`apn_${idx}`, sql.VarChar, item);
                return `(@id_sim, @apn_${idx})`;
            }).filter(Boolean).join(', ');

            if (valuesApn.length > 0) {
                await reqApn.query(`INSERT INTO apn (id_sim, apn) VALUES ${valuesApn}`);
            }
        }

        await transaction.commit();
        return { id: simId, ...data, observacion, ip: ipsUnicas, apn: apnsProcesados };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Actualiza una tarjeta SIM existente
exports.actualizar = async (id, data) => {
    let {
        numeroSim, numeroLinea, tipoSimId, operadorId, planId,
        capacidadId, estadoId, responsableId, ubicacionId, destinoId,
        pin, puk, observacion, razonModificacion, id_user
    } = data;

    if (!id_user) {
        throw new Error("El ID de usuario es obligatorio para registrar la auditoría.");
    }

    const simIdNum = Number(id);
    observacion = (observacion !== null && observacion !== undefined) ? String(observacion).trim() : '';

    tipoSimId = toNullableInt(tipoSimId || data.id_tiposim);
    operadorId = toNullableInt(operadorId || data.id_operador);
    planId = toNullableInt(planId || data.id_plan);
    capacidadId = toNullableInt(capacidadId || data.id_capacidad);
    estadoId = toNullableInt(estadoId || data.id_estado);
    responsableId = toNullableInt(responsableId || data.id_responsable);
    ubicacionId = toNullableInt(ubicacionId || data.id_ubicacion);
    destinoId = toNullableInt(destinoId || data.id_destino);

    const ipsUnicas = isValidArray(data.ip)
        ? Array.from(new Set(data.ip.map(i => String(i).trim()))).filter(Boolean)
        : [];
        
    const entradaApn = data.apn || data.ID_APN || data.nombreApn || [];
    const apnsProcesados = isValidArray(entradaApn)
        ? Array.from(new Set(entradaApn.map(a => String(a).trim()))).filter(Boolean)
        : (entradaApn && String(entradaApn).trim() !== '' ? [String(entradaApn).trim()] : []);

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Validar existencia con bloqueo UPDLOCK
        const reqCheck = new sql.Request(transaction);
        const checkSim = await reqCheck
            .input('id_sim', sql.Int, simIdNum)
            .query('SELECT * FROM sim WITH (UPDLOCK, HOLDLOCK) WHERE id_sim = @id_sim');
            
        if (checkSim.recordset.length === 0) throw new Error("SIM no encontrada");

        // Verificación de IPs en un solo query
        if (ipsUnicas.length > 0) {
            const reqCheckIp = new sql.Request(transaction);
            reqCheckIp.input('id_sim', sql.Int, simIdNum);
            const inParams = ipsUnicas.map((item, idx) => {
                reqCheckIp.input(`ip_val_${idx}`, sql.VarChar, item);
                return `@ip_val_${idx}`;
            }).filter(Boolean).join(',');

            if (inParams.length > 0) {
                const existeIp = await reqCheckIp.query(`
                    SELECT TOP 1 i.ip FROM ip i WITH (UPDLOCK, HOLDLOCK)
                    INNER JOIN sim s ON i.id_sim = s.id_sim
                    WHERE i.ip IN (${inParams}) AND i.id_sim != @id_sim AND s.deleted_at IS NULL
                `);

                if (existeIp.recordset.length > 0) {
                    throw new Error(`La IP ${existeIp.recordset[0].ip} ya está asignada a otra tarjeta activa.`);
                }
            }
        }

        const numSimClean = String(numeroSim || '').trim();
        const numLineaClean = String(numeroLinea || '').trim();
        const pinClean = pin != null && String(pin).trim() !== '' ? String(pin).trim() : '0000';
        const pukClean = puk != null && String(puk).trim() !== '' ? String(puk).trim() : '00000000';

        // Update principal (Se usa GETUTCDATE)
        const reqUpdate = new sql.Request(transaction);
        await reqUpdate
            .input('num_sim', sql.VarChar, numSimClean)
            .input('num_linea', sql.VarChar, numLineaClean)
            .input('cod_pin', sql.VarChar, pinClean)
            .input('cod_puk', sql.VarChar, pukClean)
            .input('id_tiposim', sql.Int, tipoSimId)
            .input('id_operador', sql.Int, operadorId)
            .input('id_estado', sql.Int, estadoId)
            .input('id_plan', sql.Int, planId)
            .input('id_capacidad', sql.Int, capacidadId)
            .input('id_responsable', sql.Int, responsableId)
            .input('id_destino', sql.Int, destinoId)
            .input('id_ubicacion', sql.Int, ubicacionId)
            .input('observacion', sql.VarChar, observacion)
            .input('id_sim', sql.Int, simIdNum)
            .query(`
                UPDATE sim SET
                    num_sim = @num_sim, num_linea = @num_linea, cod_pin = @cod_pin, cod_puk = @cod_puk,
                    id_tiposim = @id_tiposim, id_operador = @id_operador, id_estado = @id_estado, id_plan = @id_plan,
                    id_capacidad = @id_capacidad, id_responsable = @id_responsable, id_destino = @id_destino,
                    id_ubicacion = @id_ubicacion, observacion = @observacion, updated_at = GETUTCDATE()
                WHERE id_sim = @id_sim
            `);

        const ipsTexto = ipsUnicas.length > 0 ? ipsUnicas.join(', ') : 'SIN IP';
        const apnsTexto = apnsProcesados.length > 0 ? apnsProcesados.join(', ') : 'SIN APN';

        // Modificacion (Se usa GETUTCDATE)
        const reqMod = new sql.Request(transaction);
        await reqMod
            .input('id_sim', sql.Int, simIdNum)
            .input('razon', sql.VarChar, String(razonModificacion || 'ACTUALIZACIÓN DE REGISTRO').trim())
            .input('id_user', sql.Int, Number(id_user))
            .input('num_sim', sql.VarChar, numSimClean)
            .input('num_linea', sql.VarChar, numLineaClean)
            .input('cod_pin', sql.VarChar, pinClean)
            .input('cod_puk', sql.VarChar, pukClean)
            .input('id_tiposim', sql.Int, tipoSimId)
            .input('id_operador', sql.Int, operadorId)
            .input('id_estado', sql.Int, estadoId)
            .input('id_plan', sql.Int, planId)
            .input('id_capacidad', sql.Int, capacidadId)
            .input('id_responsable', sql.Int, responsableId)
            .input('id_destino', sql.Int, destinoId)
            .input('id_ubicacion', sql.Int, ubicacionId)
            .input('ips', sql.VarChar, ipsTexto)
            .input('apns', sql.VarChar, apnsTexto)
            .input('observacion', sql.VarChar, observacion)
            .query(`
                INSERT INTO modificaciones (
                    id_sim, razon, id_user, created_at,
                    num_sim, num_linea, cod_pin, cod_puk,
                    id_tiposim, id_operador, id_estado,
                    id_plan, id_capacidad, id_responsable,
                    id_destino, id_ubicacion, ips, apns, observacion
                ) VALUES (
                    @id_sim, @razon, @id_user, GETUTCDATE(),
                    @num_sim, @num_linea, @cod_pin, @cod_puk,
                    @id_tiposim, @id_operador, @id_estado,
                    @id_plan, @id_capacidad, @id_responsable,
                    @id_destino, @id_ubicacion, @ips, @apns, @observacion
                )
            `);

        // Reescritura masiva de IPs y APNs
        const reqDel = new sql.Request(transaction);
        await reqDel.input('id_sim', sql.Int, simIdNum).query('DELETE FROM ip WHERE id_sim = @id_sim; DELETE FROM apn WHERE id_sim = @id_sim;');

        if (ipsUnicas.length > 0) {
            const reqInsIp = new sql.Request(transaction);
            reqInsIp.input('id_sim', sql.Int, simIdNum);
            const valuesIp = ipsUnicas.map((item, idx) => {
                reqInsIp.input(`ip_${idx}`, sql.VarChar, item);
                return `(@id_sim, @ip_${idx})`;
            }).filter(Boolean).join(', ');

            if (valuesIp.length > 0) {
                await reqInsIp.query(`INSERT INTO ip (id_sim, ip) VALUES ${valuesIp}`);
            }
        }

        if (apnsProcesados.length > 0) {
            const reqInsApn = new sql.Request(transaction);
            reqInsApn.input('id_sim', sql.Int, simIdNum);
            const valuesApn = apnsProcesados.map((item, idx) => {
                reqInsApn.input(`apn_${idx}`, sql.VarChar, item);
                return `(@id_sim, @apn_${idx})`;
            }).filter(Boolean).join(', ');

            if (valuesApn.length > 0) {
                await reqInsApn.query(`INSERT INTO apn (id_sim, apn) VALUES ${valuesApn}`);
            }
        }

        await transaction.commit();
        return { id: simIdNum, ...data, observacion, ip: ipsUnicas, apn: apnsProcesados };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Borrado logico (Se usa GETUTCDATE)
exports.eliminar = async (id, id_user = null, razon = 'ELIMINACIÓN DE REGISTRO') => {
    const pool = await poolPromise;
    const simId = Number(id);

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Obtener estado actual
        const reqCurrent = new sql.Request(transaction);
        const simCurrent = await reqCurrent.input('id_sim', sql.Int, simId)
            .query('SELECT * FROM sim WITH (UPDLOCK, HOLDLOCK) WHERE id_sim = @id_sim AND deleted_at IS NULL');

        if (simCurrent.recordset.length === 0) {
            await transaction.rollback();
            return false;
        }

        const simData = simCurrent.recordset[0];

        // Marcar como eliminada y cambiar estado a 'desactivada' (GETUTCDATE)
        const reqUpdate = new sql.Request(transaction);
        const result = await reqUpdate
            .input('id_sim', sql.Int, simId)
            .query(`
                UPDATE sim
                SET deleted_at = GETUTCDATE(),
                    id_estado = (
                        SELECT TOP 1 id_estado
                        FROM estados
                        WHERE LOWER(descripcion) = 'desactivada'
                    )
                WHERE id_sim = @id_sim
            `);

        // Registrar la eliminación (GETUTCDATE)
        if (id_user) {
            const reqAudit = new sql.Request(transaction);
            await reqAudit
                .input('id_sim', sql.Int, simId)
                .input('razon', sql.VarChar, String(razon).trim())
                .input('id_user', sql.Int, Number(id_user))
                .input('num_sim', sql.VarChar, simData.num_sim)
                .input('num_linea', sql.VarChar, simData.num_linea)
                .input('cod_pin', sql.VarChar, simData.cod_pin)
                .input('cod_puk', sql.VarChar, simData.cod_puk)
                .input('id_tiposim', sql.Int, simData.id_tiposim)
                .input('id_operador', sql.Int, simData.id_operador)
                .input('id_estado', sql.Int, simData.id_estado)
                .input('id_plan', sql.Int, simData.id_plan)
                .input('id_capacidad', sql.Int, simData.id_capacidad)
                .input('id_responsable', sql.Int, simData.id_responsable)
                .input('id_destino', sql.Int, simData.id_destino)
                .input('id_ubicacion', sql.Int, simData.id_ubicacion)
                .input('observacion', sql.VarChar, simData.observacion || '')
                .query(`
                    INSERT INTO modificaciones (
                        id_sim, razon, id_user, created_at,
                        num_sim, num_linea, cod_pin, cod_puk,
                        id_tiposim, id_operador, id_estado,
                        id_plan, id_capacidad, id_responsable,
                        id_destino, id_ubicacion, observacion
                    ) VALUES (
                        @id_sim, @razon, @id_user, GETUTCDATE(),
                        @num_sim, @num_linea, @cod_pin, @cod_puk,
                        @id_tiposim, @id_operador, @id_estado,
                        @id_plan, @id_capacidad, @id_responsable,
                        @id_destino, @id_ubicacion, @observacion
                    )
                `);
        }

        await transaction.commit();
        return result.rowsAffected[0] > 0;

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Historial completo
exports.getHistorial = async (id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id_sim', sql.Int, Number(id))
        .query(`
            SELECT
                m.razon, m.ips, m.apns, m.created_at, m.observacion,
                ISNULL(u.nombres, 'SISTEMA') AS nombres,
                ISNULL(u.apellidos, '(CARGA MASIVA)') AS apellidos,
                m.num_sim, m.num_linea, m.cod_pin AS pin, m.cod_puk AS puk,
                ts.descripcion AS tipo_sim,
                o.descripcion AS operador,
                p.descripcion AS [plan],
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
            WHERE m.id_sim = @id_sim
            ORDER BY m.created_at DESC
        `);

    return result.recordset;
};

// Busqueda masiva
exports.buscarSimsMasivo = async (listaNums) => {
    if (!Array.isArray(listaNums) || !listaNums.length) return [];
    
    const loteLimitado = listaNums
        .filter(item => item !== null && item !== undefined && (typeof item === 'string' || typeof item === 'number'))
        .map(item => String(item).trim())
        .filter(Boolean)
        .slice(0, 500);

    if (loteLimitado.length === 0) return [];

    const pool = await poolPromise;
    const request = pool.request();
    
    const paramsList = loteLimitado.map((num, idx) => {
        request.input(`num${idx}`, sql.VarChar, num);
        return `@num${idx}`;
    }).filter(Boolean).join(',');

    if (paramsList.length === 0) return [];

    const result = await request.query(
        `SELECT num_sim FROM sim WHERE num_sim IN (${paramsList}) AND deleted_at IS NULL`
    );
    return result.recordset;
};

// Valida si una IP está registrada al crear
exports.validarIpDuplicadaCrear = async (ip) => {
    if (!ip) return null;
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ip', sql.VarChar, String(ip).trim())
        .query(`
            SELECT TOP 1 i.id_sim, s.num_linea
            FROM ip i
            INNER JOIN sim s ON i.id_sim = s.id_sim
            WHERE i.ip = @ip AND s.deleted_at IS NULL
        `);
    return result.recordset.length > 0 ? result.recordset[0] : null;
};

// Valida si una IP pertenece a otra tarjeta activa al actualizar
exports.validarIpDuplicadaActualizar = async (ip, id_sim) => {
    if (!ip) return null;
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ip', sql.VarChar, String(ip).trim())
        .input('id_sim', sql.Int, Number(id_sim))
        .query(`
            SELECT TOP 1 i.id_sim, s.num_linea
            FROM ip i
            INNER JOIN sim s ON i.id_sim = s.id_sim
            WHERE i.ip = @ip 
              AND i.id_sim != @id_sim 
              AND s.deleted_at IS NULL
        `);
    return result.recordset.length > 0 ? result.recordset[0] : null;
};

// Valida duplicidad de SIM o Linea al crear
exports.validarSimOLineaDuplicadaCrear = async (num_sim, num_linea) => {
    const pool = await poolPromise;
    const cleanNumSim = num_sim != null ? String(num_sim).trim() : '';
    const cleanNumLinea = num_linea != null ? String(num_linea).trim() : '';

    const result = await pool.request()
        .input('num_sim', sql.VarChar, cleanNumSim)
        .input('num_linea', sql.VarChar, cleanNumLinea)
        .query(`
            SELECT TOP 1 num_sim, num_linea
            FROM sim
            WHERE (num_sim = @num_sim OR num_linea = @num_linea) AND deleted_at IS NULL
        `);

    return result.recordset.length > 0 ? result.recordset[0] : null;
};

// Valida duplicidad de SIM o Linea en otras tarjetas al actualizar
exports.validarSimOLineaDuplicadaActualizar = async (num_sim, num_linea, id_sim) => {
    const pool = await poolPromise;
    const cleanNumSim = num_sim != null ? String(num_sim).trim() : '';
    const cleanNumLinea = num_linea != null ? String(num_linea).trim() : '';

    const result = await pool.request()
        .input('num_sim', sql.VarChar, cleanNumSim)
        .input('num_linea', sql.VarChar, cleanNumLinea)
        .input('id_sim', sql.Int, Number(id_sim))
        .query(`
            SELECT TOP 1 num_sim, num_linea
            FROM sim
            WHERE (num_sim = @num_sim OR num_linea = @num_linea) AND id_sim != @id_sim AND deleted_at IS NULL
        `);

    return result.recordset.length > 0 ? result.recordset[0] : null;
};