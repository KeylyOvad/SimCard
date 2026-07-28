const db = require('../config/db');

// Busca un tipo de sim ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_tiposim, descripcion FROM tiposim WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todos los tipos de sim activos 
const getAllTiposSim = async () => {
  const [rows] = await db.query(
    'SELECT id_tiposim, descripcion, created_at, updated_at FROM tiposim WHERE deleted_at IS NULL'
  );
  return rows;
};

// Inserta un nuevo tipo de sim
const createTipoSim = async (tipo) => {
  const { descripcion } = tipo;
  const [result] = await db.query(
    `INSERT INTO tiposim (descripcion, created_at, updated_at) VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
  return {
    id_tiposim: result.insertId,
    descripcion
  };
};

// Actualiza la descripción validando que el registro exista 
const updateTipoSim = async (id, tipo) => {
  const { descripcion } = tipo;
  const [result] = await db.query(
    `UPDATE tiposim SET descripcion = ?, updated_at = NOW() WHERE id_tiposim = ? AND deleted_at IS NULL`,
    [descripcion, id]
  );

  if (result.affectedRows === 0) return null;
  return { id_tiposim: id, descripcion };
};

// Borrado Logico
const deleteTipoSim = async (id) => {
  const [result] = await db.query(
    `UPDATE tiposim SET deleted_at = NOW() WHERE id_tiposim = ? AND deleted_at IS NULL`,
    [id]
  );
  return result.affectedRows > 0;
};

// Borrado Fisico
const hardDeleteTipoSim = async (id) => {
  const [result] = await db.query(
    `DELETE FROM tiposim WHERE id_tiposim = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findByDescripcion,
  getAllTiposSim,
  createTipoSim,
  updateTipoSim,
  deleteTipoSim,
  hardDeleteTipoSim
};