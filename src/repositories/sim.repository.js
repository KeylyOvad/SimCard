const db = require('../config/db');

exports.getAll = async () => {
    const [rows] = await db.query(`
    SELECT 
    s.num_linea,
    s.num_sim,
    o.descripcion AS operador,
    e.descripcion AS estado,
    p.descripcion AS plan,
    c.descripcion AS capacidad,
    r.descripcion AS responsable,
    d.descripcion AS destino,
    u.descripcion AS ubicacion

    FROM sim s

    LEFT JOIN operadores o ON s.id_operador = o.id_operador
    LEFT JOIN estados e ON s.id_estado = e.id_estado
    LEFT JOIN planes p ON s.id_plan = p.id_plan
    LEFT JOIN capacidades c ON s.id_capacidad = c.id_capacidad
    LEFT JOIN responsables r ON s.id_responsable = r.id_responsable
    LEFT JOIN destinos d ON s.id_destino = d.id_destino
    LEFT JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
 `);
return rows;
};