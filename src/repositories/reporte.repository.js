const db = require('../config/db');

// Obtiene de forma estructurada la información consolidada trayendo solo la ÚLTIMA IP y APN
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
            s.observacion,
            
            -- Obtiene la ÚLTIMA IP registrada ordenando por su ID de inserción
            COALESCE(
                (SELECT ip FROM ip WHERE id_sim = s.id_sim ORDER BY id_ip DESC LIMIT 1), 
                'SIN IP'
            ) AS ips,
            
            -- Obtiene el ÚLTIMO APN registrado ordenando por su ID de inserción
            COALESCE(
                (SELECT apn FROM apn WHERE id_sim = s.id_sim ORDER BY id_apn DESC LIMIT 1), 
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