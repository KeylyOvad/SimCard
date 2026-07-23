const db = require('../config/db');

// Busca un estado por su descripcion ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_estado, descripcion FROM estados WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todos los estados que no han sido eliminados logicamente
const getAllEstados = async () => {
  const [rows] = await db.query(
    'SELECT * FROM estados WHERE deleted_at IS NULL'
  );
  return rows;
};

// Inserta un nuevo estado en la base de datos
const createEstado = async (estado) => {
  const { descripcion } = estado;
  const [result] = await db.query(
    `INSERT INTO estados (descripcion, created_at, updated_at)
     VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
  return { id_estado: result.insertId, descripcion };
};

// Actualiza la descripcion de un estado existente
const updateEstado = async (id, estado) => {
  const { descripcion } = estado;
  await db.query(
    `UPDATE estados SET descripcion = ?, updated_at = NOW() WHERE id_estado = ?`,
    [descripcion, id]
  );
  return { id_estado: id, descripcion };
};

// Elimina un estado usando su ID
const deleteEstado = async (id) => {
  const [result] = await db.query(
    `DELETE FROM estados WHERE id_estado = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

// Realiza una eliminacion fisica del estado en la base de datos
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