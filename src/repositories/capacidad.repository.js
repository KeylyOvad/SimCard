const db = require('../config/db');


const getAllCapacidades = async () => {

    const [rows] = await db.query(
    'SELECT * FROM capacidades WHERE deleted_at IS NULL'
);
 return rows;
};

const createCapacidad = async (cap) => {
   const { descripcion } = cap;
   const [result] = await db.query(
   `INSERT INTO capacidades (descripcion, created_at, updated_at)
    VALUES (?, NOW(), NOW())`,
    [descripcion]
 );
   return { id_capacidad: result.insertId, descripcion };
};


const updateCapacidad = async (id, cap) => {
    const { descripcion } = cap;
    await db.query(
    `UPDATE capacidades SET descripcion = ?, updated_at = NOW() WHERE id_capacidad = ?`,
     [descripcion, id]
  );
  return { id_capacidad: id, descripcion };
};

const deleteCapacidad = async (id) => {
  const [result] = await db.query(
   `DELETE FROM capacidades WHERE id_capacidad = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  getAllCapacidades,
  createCapacidad,
  updateCapacidad,
  deleteCapacidad

};
