const db = require('../config/db');

// Busca un responsable ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_responsable, descripcion FROM responsables WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todos los responsables
const getAllResponsables = async () => {
  const [rows] = await db.query(
    'SELECT id_responsable, descripcion, created_at, updated_at FROM responsables WHERE deleted_at IS NULL'
  );
  return rows;
};

// Inserta un nuevo responsable
const createResponsable = async (resp) => {
  const { descripcion } = resp;
  const [result] = await db.query(
    `INSERT INTO responsables (descripcion, created_at, updated_at) VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
  return { id_responsable: result.insertId, descripcion };
};

// Actualiza la descripcion validando que el registro exista 
const updateResponsable = async (id, resp) => {
  const { descripcion } = resp;
  const [result] = await db.query(
    `UPDATE responsables SET descripcion = ?, updated_at = NOW() WHERE id_responsable = ? AND deleted_at IS NULL`,
    [descripcion, id]
  );

  if (result.affectedRows === 0) return null;
  return { id_responsable: id, descripcion };
};

// Borrado Logico
const deleteResponsable = async (id) => {
  const [result] = await db.query(
    `UPDATE responsables SET deleted_at = NOW() WHERE id_responsable = ? AND deleted_at IS NULL`,
    [id]
  );
  return result.affectedRows > 0;
};

// Borrado Fisico 
const hardDeleteResponsable = async (id) => {
  const [result] = await db.query(
    `DELETE FROM responsables WHERE id_responsable = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findByDescripcion,
  getAllResponsables,
  createResponsable,
  updateResponsable,
  deleteResponsable,
  hardDeleteResponsable
};