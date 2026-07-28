const db = require('../config/db');

// Busca una ubicacion ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_ubicacion, descripcion FROM ubicaciones WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todas las ubicaciones activas 
const getAllUbicaciones = async () => {
  const [rows] = await db.query(
    'SELECT id_ubicacion, descripcion, created_at, updated_at FROM ubicaciones WHERE deleted_at IS NULL'
  );
  return rows;
};

// Inserta una nueva ubicación
const createUbicacion = async (ubi) => {
  const { descripcion } = ubi;
  const [result] = await db.query(
    `INSERT INTO ubicaciones (descripcion, created_at, updated_at) VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
  return { id_ubicacion: result.insertId, descripcion };
};

// Actualiza la descripcion validando que el registro exista
const updateUbicacion = async (id, ubi) => {
  const { descripcion } = ubi;
  const [result] = await db.query(
    `UPDATE ubicaciones SET descripcion = ?, updated_at = NOW() WHERE id_ubicacion = ? AND deleted_at IS NULL`,
    [descripcion, id]
  );

  if (result.affectedRows === 0) return null;
  return { id_ubicacion: id, descripcion };
};

// Borrado Logico
const deleteUbicacion = async (id) => {
  const [result] = await db.query(
    `UPDATE ubicaciones SET deleted_at = NOW() WHERE id_ubicacion = ? AND deleted_at IS NULL`,
    [id]
  );
  return result.affectedRows > 0;
};

// Borrado Fisico 
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