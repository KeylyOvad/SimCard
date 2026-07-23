const db = require('../config/db');

// Busca un plan por su descripcion ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_plan, descripcion FROM planes WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todos los planes que no han sido eliminados logicamente
const getAllPlanes = async () => {
  const [rows] = await db.query(
    'SELECT * FROM planes WHERE deleted_at IS NULL'
  );
  return rows;
};

// Inserta un nuevo plan en la base de datos
const createPlan = async (plan) => {
  const { descripcion } = plan;
  const [result] = await db.query(
    `INSERT INTO planes (descripcion, created_at, updated_at)
     VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
  return {
    id_plan: result.insertId,
    descripcion
  };
};

// Actualiza la descripcion de un plan existente usando su id
const updatePlan = async (id, plan) => {
  const { descripcion } = plan;
  await db.query(
    `UPDATE planes 
     SET descripcion = ?, updated_at = NOW() 
     WHERE id_plan = ?`,
    [descripcion, id]
  );
  return { id_plan: id, descripcion };
};

// Elimina un plan usando su id
const deletePlan = async (id) => {
  await db.query(
    `DELETE FROM planes WHERE id_plan = ?`,
    [id]
  );
  return true;
};

// Realiza una eliminacion fisica del plan validando filas afectadas
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