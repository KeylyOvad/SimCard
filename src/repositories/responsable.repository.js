const { poolPromise } = require('../config/db');

// Busca un responsable ignorando mayúsculas y minúsculas
const findByDescripcion = async (descripcion) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', descripcion)
    .query(`
      SELECT TOP 1
        id_responsable,
        descripcion
      FROM responsables
      WHERE LOWER(descripcion) = LOWER(@descripcion)
        AND deleted_at IS NULL
    `);

  return result.recordset[0];
};

// Obtiene todos los responsables activos
const getAllResponsables = async () => {
  const pool = await poolPromise;

  const result = await pool.request()
    .query(`
      SELECT
        id_responsable,
        descripcion,
        created_at,
        updated_at
      FROM responsables
      WHERE deleted_at IS NULL
    `);

  return result.recordset;
};

// Inserta un nuevo responsable
const createResponsable = async (resp) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', resp.descripcion)
    .query(`
      INSERT INTO responsables
      (descripcion, created_at, updated_at)
      OUTPUT INSERTED.id_responsable
      VALUES
      (@descripcion, GETDATE(), GETDATE())
    `);

  return {
    id_responsable: result.recordset[0].id_responsable,
    descripcion: resp.descripcion
  };
};

// Actualiza la descripción
const updateResponsable = async (id, resp) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .input('descripcion', resp.descripcion)
    .query(`
      UPDATE responsables
      SET descripcion = @descripcion,
          updated_at = GETDATE()
      WHERE id_responsable = @id
        AND deleted_at IS NULL
    `);

  if (result.rowsAffected[0] === 0) return null;

  return {
    id_responsable: id,
    descripcion: resp.descripcion
  };
};

// Borrado lógico
const deleteResponsable = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      UPDATE responsables
      SET deleted_at = GETDATE()
      WHERE id_responsable = @id
        AND deleted_at IS NULL
    `);

  return result.rowsAffected[0] > 0;
};

// Borrado físico
const hardDeleteResponsable = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      DELETE FROM responsables
      WHERE id_responsable = @id
    `);

  return result.rowsAffected[0] > 0;
};

module.exports = {
  findByDescripcion,
  getAllResponsables,
  createResponsable,
  updateResponsable,
  deleteResponsable,
  hardDeleteResponsable
};