const { poolPromise } = require('../config/db');

// Busca un estado ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', descripcion)
    .query(`
      SELECT TOP 1
        id_estado,
        descripcion
      FROM estados
      WHERE LOWER(descripcion) = LOWER(@descripcion)
        AND deleted_at IS NULL
    `);

  return result.recordset[0];
};

// Obtiene todos los estados activos
const getAllEstados = async () => {
  const pool = await poolPromise;

  const result = await pool.request()
    .query(`
      SELECT
        id_estado,
        descripcion,
        created_at,
        updated_at
      FROM estados
      WHERE deleted_at IS NULL
    `);

  return result.recordset;
};

// Inserta un nuevo estado
const createEstado = async (estado) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', estado.descripcion)
    .query(`
      INSERT INTO estados
      (descripcion, created_at, updated_at)
      OUTPUT INSERTED.id_estado
      VALUES
      (@descripcion, GETDATE(), GETDATE())
    `);

  return {
    id_estado: result.recordset[0].id_estado,
    descripcion: estado.descripcion
  };
};

// Actualiza la descripcion
const updateEstado = async (id, estado) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .input('descripcion', estado.descripcion)
    .query(`
      UPDATE estados
      SET descripcion = @descripcion,
          updated_at = GETDATE()
      WHERE id_estado = @id
        AND deleted_at IS NULL
    `);

  if (result.rowsAffected[0] === 0) return null;

  return {
    id_estado: id,
    descripcion: estado.descripcion
  };
};

// Borrado logico
const deleteEstado = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      UPDATE estados
      SET deleted_at = GETDATE()
      WHERE id_estado = @id
        AND deleted_at IS NULL
    `);

  return result.rowsAffected[0] > 0;
};

// Borrado fisico
const hardDeleteEstado = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      DELETE FROM estados
      WHERE id_estado = @id
    `);

  return result.rowsAffected[0] > 0;
};

module.exports = {
  findByDescripcion,
  getAllEstados,
  createEstado,
  updateEstado,
  deleteEstado,
  hardDeleteEstado
};