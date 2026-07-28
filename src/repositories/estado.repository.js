const db = require('../config/db');

// Busca un estado ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_estado, descripcion FROM estados WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todos los estados activos 
const getAllEstados = async () => {
  const [rows] = await db.query(
    'SELECT id_estado, descripcion, created_at, updated_at FROM estados WHERE deleted_at IS NULL'
  );
  return rows;
};

// Inserta un nuevo estado
const createEstado = async (estado) => {
  const { descripcion } = estado;
  const [result] = await db.query(
    `INSERT INTO estados (descripcion, created_at, updated_at)
     VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
  return { id_estado: result.insertId, descripcion };
};

// Actualiza la descripcion
const updateEstado = async (id, estado) => {
  const { descripcion } = estado;
  const [result] = await db.query(
    `UPDATE estados 
     SET descripcion = ?, updated_at = NOW() 
     WHERE id_estado = ? AND deleted_at IS NULL`,
    [descripcion, id]
  );

  if (result.affectedRows === 0) return null;
  return { id_estado: id, descripcion };
};

// Borrado logico
const deleteEstado = async (id) => {
  const [result] = await db.query(
    `UPDATE estados 
     SET deleted_at = NOW() 
     WHERE id_estado = ? AND deleted_at IS NULL`,
    [id]
  );
  return result.affectedRows > 0;
};

// Borrado fisico  solo para procesos internos
const hardDeleteEstado = async (id) => {
  const [result] = await db.query(
    `DELETE FROM estados WHERE id_estado = ?`,
    [id]
  );
  return result.affectedRows > 0;
};


module.exports = {
  findByDescripcion,
  getAllEstados,
  createEstado,
  updateEstado,
  deleteEstado,
  hardDeleteEstado
};