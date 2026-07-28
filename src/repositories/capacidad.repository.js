const db = require('../config/db');

// Busca una capacidad por su descripción ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_capacidad, descripcion FROM capacidades WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todas las capacidades activas 
const getAllCapacidades = async () => {
  const [rows] = await db.query(
    'SELECT id_capacidad, descripcion, created_at, updated_at FROM capacidades WHERE deleted_at IS NULL'
  );
  return rows;
};

// Inserta una nueva capacidad en la base de datos
const createCapacidad = async (cap) => {
  const { descripcion } = cap;
  const [result] = await db.query(
    `INSERT INTO capacidades (descripcion, created_at, updated_at)
     VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
  return { id_capacidad: result.insertId, descripcion };
};

// Actualiza la descripcion de una capacidad existente
const updateCapacidad = async (id, cap) => {
  const { descripcion } = cap;
  const [result] = await db.query(
    `UPDATE capacidades 
     SET descripcion = ?, updated_at = NOW() 
     WHERE id_capacidad = ? AND deleted_at IS NULL`,
    [descripcion, id]
  );
  
  if (result.affectedRows === 0) return null;
  return { id_capacidad: id, descripcion };
};

// Borrado logico de la capacidad
const deleteCapacidad = async (id) => {
  const [result] = await db.query(
    `UPDATE capacidades
     SET deleted_at = NOW()
     WHERE id_capacidad = ? AND deleted_at IS NULL`,
    [id]
  );

  return result.affectedRows > 0;
};

// Borrado fisico solo para procesos internos
const hardDeleteCapacidad = async (id) => {
  const [result] = await db.query(
    `DELETE FROM capacidades WHERE id_capacidad = ?`,
    [id]
  );
  return result.affectedRows > 0;
};


module.exports = {
  findByDescripcion,
  getAllCapacidades,
  createCapacidad,
  updateCapacidad,
  deleteCapacidad,
  hardDeleteCapacidad
};