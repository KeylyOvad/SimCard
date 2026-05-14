const db = require('../config/db');

const getAllUbicaciones = async () => {
     const [rows] = await db.query(
     'SELECT * FROM ubicaciones WHERE deleted_at IS NULL'
 );
   return rows;
};

const createUbicacion = async (ubi) => {
  const { descripcion } = ubi;
  const [result] = await db.query(
  `INSERT INTO ubicaciones (descripcion, created_at, updated_at)
   VALUES (?, NOW(), NOW())`,
   [descripcion]
 );
   return { id_ubicacion: result.insertId, descripcion };
};

const updateUbicacion = async (id, ubi) => {
     const { descripcion } = ubi;
     await db.query(
     `UPDATE ubicaciones SET descripcion = ?, updated_at = NOW() WHERE id_ubicacion = ?`,
     [descripcion, id]
 );
    return { id_ubicacion: id, descripcion };
};

const deleteUbicacion = async (id) => {
     const [result] = await db.query(
    `DELETE FROM ubicaciones WHERE id_ubicacion = ?`,
    [id]
 );
   return result.affectedRows > 0;
};

const hardDeleteUbicacion = async (id) => {
   const [result] = await db.query(
   `DELETE FROM ubicaciones WHERE id_ubicacion = ?`,
   [id]
  );
     return result.affectedRows > 0;
};

module.exports = {
  getAllUbicaciones,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion,
  hardDeleteUbicacion
};