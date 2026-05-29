const db = require('../config/db');

exports.obtenerDatosParaExcel = async () => {
    const [rows] = await db.query(`
        SELECT 
            s.num_linea, s.num_sim, o.descripcion AS operador, 
            r.descripcion AS responsable, d.descripcion AS destino, 
            e.descripcion AS estado, u.descripcion AS ubicacion,
            ts.descripcion AS tipo_sim, p.descripcion AS plan, 
            c.descripcion AS capacidad, s.cod_pin, s.cod_puk,
            GROUP_CONCAT(DISTINCT i.ip SEPARATOR ', ') AS ips,
            GROUP_CONCAT(DISTINCT a.apn SEPARATOR ', ') AS apns,
            s.observacion
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
        ORDER BY s.num_linea ASC
    `);
    return rows;
};