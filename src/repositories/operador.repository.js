const db = require('../config/db');

// Busca un operador ignorando mayUsculas y minUsculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_operador, descripcion FROM operadores WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todos los operadores activos
const getAllOperadores = async () => {
  const [rows] = await db.query(
    'SELECT id_operador, descripcion, created_at, updated_at FROM operadores WHERE deleted_at IS NULL'
  );
  return rows;
};

// Inserta un nuevo operador
const createOperador = async (operador) => {
  const { descripcion } = operador;
  const [result] = await db.query(
    `INSERT INTO operadores (descripcion, created_at, updated_at) VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
  return {
    id_operador: result.insertId,
    descripcion
  };
};

// Actualiza la descripciOn de un operador existente
const updateOperador = async (id, operador) => {
  const { descripcion } = operador;
  const [result] = await db.query(
    `UPDATE operadores SET descripcion = ?, updated_at = NOW() WHERE id_operador = ? AND deleted_at IS NULL`,
    [descripcion, id]
  );

  if (result.affectedRows === 0) return null;
  return { id_operador: id, descripcion };
};

// Borrado logico
const deleteOperador = async (id) => {
  const [result] = await db.query(
    `UPDATE operadores SET deleted_at = NOW() WHERE id_operador = ? AND deleted_at IS NULL`,
    [id]
  );
  return result.affectedRows > 0;
};

// Borrado fisico  solo para procesos internos
const hardDeleteOperador = async (id) => {
  const [result] = await db.query(
    `DELETE FROM operadores WHERE id_operador = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findByDescripcion,
  getAllOperadores,
  createOperador,
  updateOperador,
  deleteOperador,
  hardDeleteOperador
};