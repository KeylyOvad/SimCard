const { poolPromise } = require('../config/db');

// Busca un plan ignorando maysculas y minusculas
const findByDescripcion = async (descripcion) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', descripcion)
    .query(`
      SELECT TOP 1
        id_plan,
        descripcion
      FROM planes
      WHERE LOWER(descripcion) = LOWER(@descripcion)
        AND deleted_at IS NULL
    `);

  return result.recordset[0];
};

// Obtiene todos los planes activos
const getAllPlanes = async () => {
  const pool = await poolPromise;

  const result = await pool.request()
    .query(`
      SELECT
        id_plan,
        descripcion,
        created_at,
        updated_at
      FROM planes
      WHERE deleted_at IS NULL
    `);

  return result.recordset;
};

// Inserta un nuevo plan
const createPlan = async (plan) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', plan.descripcion)
    .query(`
      INSERT INTO planes
      (descripcion, created_at, updated_at)
      OUTPUT INSERTED.id_plan
      VALUES
      (@descripcion, GETDATE(), GETDATE())
    `);

  return {
    id_plan: result.recordset[0].id_plan,
    descripcion: plan.descripcion
  };
};

// Actualiza la descripcion
const updatePlan = async (id, plan) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .input('descripcion', plan.descripcion)
    .query(`
      UPDATE planes
      SET descripcion = @descripcion,
          updated_at = GETDATE()
      WHERE id_plan = @id
        AND deleted_at IS NULL
    `);

  if (result.rowsAffected[0] === 0) return null;

  return {
    id_plan: id,
    descripcion: plan.descripcion
  };
};

// Borrado logico
const deletePlan = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      UPDATE planes
      SET deleted_at = GETDATE()
      WHERE id_plan = @id
        AND deleted_at IS NULL
    `);

  return result.rowsAffected[0] > 0;
};

// Borrado fisico
const hardDeletePlan = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      DELETE FROM planes
      WHERE id_plan = @id
    `);

  return result.rowsAffected[0] > 0;
};

module.exports = {
  findByDescripcion,
  getAllPlanes,
  createPlan,
  updatePlan,
  deletePlan,
  hardDeletePlan
};