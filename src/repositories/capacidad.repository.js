const db = require('../config/db');

// Busca una capacidad por su descripcion ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_capacidad, descripcion FROM capacidades WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todas las capacidades que no han sido eliminadas
const getAllCapacidades = async () => {
  const [rows] = await db.query(
    'SELECT * FROM capacidades WHERE deleted_at IS NULL'
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
  await db.query(
    `UPDATE capacidades SET descripcion = ?, updated_at = NOW() WHERE id_capacidad = ?`,
    [descripcion, id]
  );
  return { id_capacidad: id, descripcion };
};


const deleteCapacidad = async (id) => {
  const [result] = await db.query(
    `UPDATE capacidades
     SET deleted_at = NOW()
     WHERE id_capacidad = ?`,
    [id]
  );

  return result.affectedRows > 0;
};


module.exports = {
  findByDescripcion,
  getAllCapacidades,
  createCapacidad,
  updateCapacidad,
  deleteCapacidad
};