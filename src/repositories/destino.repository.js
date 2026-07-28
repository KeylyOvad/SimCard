const db = require('../config/db');

// Busca un destino por su descripción ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_destino, descripcion FROM destinos WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todos los destinos que no han sido eliminados logicamente
const getAllDestinos = async () => {
  const [rows] = await db.query(
    'SELECT id_destino, descripcion, created_at, updated_at FROM destinos WHERE deleted_at IS NULL'
  );
  return rows;
};

// Inserta un nuevo destino
const createDestino = async (dest) => {
  const { descripcion } = dest;
  const [result] = await db.query(
    `INSERT INTO destinos (descripcion, created_at, updated_at)
     VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
  return { id_destino: result.insertId, descripcion };
};

// Actualiza la descripcion
const updateDestino = async (id, dest) => {
  const { descripcion } = dest;
  const [result] = await db.query(
    `UPDATE destinos 
     SET descripcion = ?, updated_at = NOW() 
     WHERE id_destino = ? AND deleted_at IS NULL`,
    [descripcion, id]
  );

  if (result.affectedRows === 0) return null;
  return { id_destino: id, descripcion };
};

// Borrado logico 
const deleteDestino = async (id) => {
  const [result] = await db.query(
    `UPDATE destinos 
     SET deleted_at = NOW() 
     WHERE id_destino = ? AND deleted_at IS NULL`,
    [id]
  );
  return result.affectedRows > 0;
};

// Borrado fisico solo para procesos internos
const hardDeleteDestino = async (id) => {
  const [result] = await db.query(
    `DELETE FROM destinos WHERE id_destino = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findByDescripcion,
  getAllDestinos,
  createDestino,
  updateDestino,
  deleteDestino,
  hardDeleteDestino
};