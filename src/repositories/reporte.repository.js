const { poolPromise } = require('../config/db');

exports.obtenerDatosParaExcel = async () => {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        WITH cte_ultima_ip AS (
            SELECT id_sim, ip,
                   ROW_NUMBER() OVER (PARTITION BY id_sim ORDER BY id_ip DESC) as rn
            FROM ip
        ),
        cte_ultima_apn AS (
            SELECT id_sim, apn,
                   ROW_NUMBER() OVER (PARTITION BY id_sim ORDER BY id_apn DESC) as rn
            FROM apn
        )
        SELECT
            s.num_linea,
            s.num_sim,
            o.descripcion AS operador,
            r.descripcion AS responsable,
            d.descripcion AS destino,
            e.descripcion AS estado,
            u.descripcion AS ubicacion,
            ts.descripcion AS tipo_sim,
            p.descripcion AS [plan],
            c.descripcion AS capacidad,
            s.cod_pin,
            s.cod_puk,
            s.observacion,
            ISNULL(i.ip, 'SIN IP') AS ips,
            ISNULL(a.apn, 'SIN APN') AS apns
        FROM sim s
        LEFT JOIN tiposim ts ON s.id_tiposim = ts.id_tiposim
        LEFT JOIN operadores o ON s.id_operador = o.id_operador
        LEFT JOIN estados e ON s.id_estado = e.id_estado
        LEFT JOIN planes p ON s.id_plan = p.id_plan
        LEFT JOIN capacidades c ON s.id_capacidad = c.id_capacidad
        LEFT JOIN responsables r ON s.id_responsable = r.id_responsable
        LEFT JOIN destinos d ON s.id_destino = d.id_destino
        LEFT JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
        LEFT JOIN cte_ultima_ip i ON s.id_sim = i.id_sim AND i.rn = 1
        LEFT JOIN cte_ultima_apn a ON s.id_sim = a.id_sim AND a.rn = 1
        WHERE s.deleted_at IS NULL
        ORDER BY s.num_linea ASC
    `);

    return result.recordset;
};