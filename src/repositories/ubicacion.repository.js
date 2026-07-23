const db = require('../config/db');

// Busca una ubicacion por su descripcion ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_ubicacion, descripcion FROM ubicaciones WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todas las ubicaciones que no han sido eliminadas logicamente
const getAllUbicaciones = async () => {
     const [rows] = await db.query(
     'SELECT * FROM ubicaciones WHERE deleted_at IS NULL'
 );
   return rows;
};

// Inserta una nueva ubicacion en la base de datos
const createUbicacion = async (ubi) => {
  const { descripcion } = ubi;
  const [result] = await db.query(
  `INSERT INTO ubicaciones (descripcion, created_at, updated_at)
   VALUES (?, NOW(), NOW())`,
   [descripcion]
 );
   return { id_ubicacion: result.insertId, descripcion };
};

// Actualiza la descripcion de una ubicacion existente usando su id
const updateUbicacion = async (id, ubi) => {
     const { descripcion } = ubi;
     await db.query(
     `UPDATE ubicaciones SET descripcion = ?, updated_at = NOW() WHERE id_ubicacion = ?`,
     [descripcion, id]
 );
    return { id_ubicacion: id, descripcion };
};

// Elimina una ubicacion usando su id 
const deleteUbicacion = async (id) => {
     const [result] = await db.query(
    `DELETE FROM ubicaciones WHERE id_ubicacion = ?`,
    [id]
 );
   return result.affectedRows > 0;
};

// Realiza una eliminacion fisica de la ubicacion validando filas afectadas
const hardDeleteUbicacion = async (id) => {
   const [result] = await db.query(
   `DELETE FROM ubicaciones WHERE id_ubicacion = ?`,
   [id]
  );
     return result.affectedRows > 0;
};

module.exports = {
  findByDescripcion,
  getAllUbicaciones,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion,
  hardDeleteUbicacion
};