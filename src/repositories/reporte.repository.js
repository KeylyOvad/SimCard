const db = require('../config/db');

// Obtiene de forma estructurada toda la informacion consolidada para armar el Excel
exports.obtenerDatosParaExcel = async () => {
    const [rows] = await db.query(`
        SELECT 
            s.num_linea, 
            s.num_sim, 
            o.descripcion AS operador, 
            r.descripcion AS responsable, 
            d.descripcion AS destino, 
            e.descripcion AS estado, 
            u.descripcion AS ubicacion,
            ts.descripcion AS tipo_sim, 
            p.descripcion AS plan, 
            c.descripcion AS capacidad, 
            s.cod_pin, 
            s.cod_puk,
            
            -- Reemplaza valores nulos por vacio y limpia los saltos de linea
            REPLACE(REPLACE(IFNULL(s.observacion, ''), '\\r', ' '), '\\n', ' ') AS observacion,
            
            -- Obtiene la ultima IP asociada a la SIM o retorna un texto por defecto
            COALESCE(
                (SELECT ip FROM ip WHERE id_sim = s.id_sim ORDER BY ip DESC LIMIT 1), 
                'SIN IP'
            ) AS ips,
            
            -- Obtiene el ultimo APN asociado a la SIM o retorna un texto por defecto
            COALESCE(
                (SELECT apn FROM apn WHERE id_sim = s.id_sim ORDER BY apn DESC LIMIT 1), 
                'SIN APN'
            ) AS apns

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
        ORDER BY s.num_linea ASC
    `);
    
    return rows;
};