const db = require('../config/db');

const getAllResponsables = async () => {
    const [rows] = await db.query(
    'SELECT * FROM responsables WHERE deleted_at IS NULL'
   );
    return rows;
};

const createResponsable = async (resp) => {
   const { descripcion } = resp;
   const [result] = await db.query(
   `INSERT INTO responsables (descripcion, created_at, updated_at)
    VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
  return { id_responsable: result.insertId, descripcion };
};

const updateResponsable = async (id, resp) => {
     const { descripcion } = resp;
     await db.query(
    `UPDATE responsables SET descripcion = ?, updated_at = NOW() WHERE id_responsable = ?`,
    [descripcion, id]
   );
   return { id_responsable: id, descripcion };
};

const deleteResponsable = async (id) => {
    const [result] = await db.query(
    `DELETE FROM responsables WHERE id_responsable = ?`,
     [id]
  );
 return result.affectedRows > 0;
};






const hardDeleteResponsable = async (id) => {

  const [result] = await db.query(

    `DELETE FROM responsables WHERE id_responsable = ?`,

    [id]

  );

  return result.affectedRows > 0;

};


module.exports = {

  getAllResponsables,

  createResponsable,

  updateResponsable,

  deleteResponsable,

  hardDeleteResponsable

};