const db = require('../config/db');

const getAllEstados = async () => {
  const [rows] = await db.query(
  'SELECT * FROM estados WHERE deleted_at IS NULL'
  );
  return rows;
};
const createEstado = async (estado) => {
  const { descripcion } = estado;
  const [result] = await db.query(
  `INSERT INTO estados (descripcion, created_at, updated_at)
   VALUES (?, NOW(), NOW())`,
   [descripcion]
   );
   return { id_estado: result.insertId, descripcion };
};

const updateEstado = async (id, estado) => {
   const { descripcion } = estado;
   await db.query(
   `UPDATE estados SET descripcion = ?, updated_at = NOW() WHERE id_estado = ?`,
    [descripcion, id]
   );
   return { id_estado: id, descripcion };
};

const deleteEstado = async (id) => {
    const [result] = await db.query(
    `DELETE FROM estados WHERE id_estado = ?`,
     [id]
    );
return result.affectedRows > 0;
};

const hardDeleteEstado = async (id) => {
   const [result] = await db.query(
   `DELETE FROM estados WHERE id_estado = ?`,
    [id]
   );
 return result.affectedRows > 0;
};
module.exports = {
   getAllEstados,
   createEstado,
   updateEstado,
   deleteEstado,
   hardDeleteEstado
};
