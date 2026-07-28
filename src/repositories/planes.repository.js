const db = require('../config/db');

// Busca un plan ignorando mayUsculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_plan, descripcion FROM planes WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todos los planes 
const getAllPlanes = async () => {
  const [rows] = await db.query(
    'SELECT id_plan, descripcion, created_at, updated_at FROM planes WHERE deleted_at IS NULL'
  );
  return rows;
};

// Inserta un nuevo plan
const createPlan = async (plan) => {
  const { descripcion } = plan;
  const [result] = await db.query(
    `INSERT INTO planes (descripcion, created_at, updated_at) VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
  return {
    id_plan: result.insertId,
    descripcion
  };
};

// Actualiza la descripción validando que el registro exista 
const updatePlan = async (id, plan) => {
  const { descripcion } = plan;
  const [result] = await db.query(
    `UPDATE planes SET descripcion = ?, updated_at = NOW() WHERE id_plan = ? AND deleted_at IS NULL`,
    [descripcion, id]
  );

  if (result.affectedRows === 0) return null;
  return { id_plan: id, descripcion };
};

// Borrado Logico 
const deletePlan = async (id) => {
  const [result] = await db.query(
    `UPDATE planes SET deleted_at = NOW() WHERE id_plan = ? AND deleted_at IS NULL`,
    [id]
  );
  return result.affectedRows > 0;
};

// Borrado fisico solo para procesos internos
const hardDeletePlan = async (id) => {
  const [result] = await db.query(
    `DELETE FROM planes WHERE id_plan = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findByDescripcion,
  getAllPlanes,
  createPlan,
  updatePlan,
  deletePlan,
  hardDeletePlan
};