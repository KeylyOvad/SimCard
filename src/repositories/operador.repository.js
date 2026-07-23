const db = require('../config/db');

// Busca un operador por su descripcion ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_operador, descripcion FROM operadores WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todos los operadores que no han sido eliminados logicamente
const getAllOperadores = async () => {
  const [rows] = await db.query('SELECT * FROM operadores WHERE deleted_at IS NULL');
  return rows;
};

// Inserta un nuevo operador en la base de datos
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

// Actualiza la descripcion de un operador existente
const updateOperador = async (id, operador) => {
  const { descripcion } = operador;
  await db.query(
    `UPDATE operadores SET descripcion = ?, updated_at = NOW() WHERE id_operador = ?`,
    [descripcion, id]
  );
  return { id_operador: id, descripcion };
};

// Aplica una eliminacion logica al operador setenado la fecha en deleted_at
const deleteOperador = async (id) => {
  await db.query(
    `UPDATE operadores SET deleted_at = NOW() WHERE id_operador = ?`,
    [id]
  );
  return true;
};

module.exports = {
  findByDescripcion,
  getAllOperadores,
  createOperador,
  updateOperador,
  deleteOperador
};