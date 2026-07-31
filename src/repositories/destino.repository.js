const { poolPromise } = require('../config/db');

// Busca un destino por su descripción ignorando mayúsculas y minúsculas
const findByDescripcion = async (descripcion) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', descripcion)
    .query(`
      SELECT TOP 1
        id_destino,
        descripcion
      FROM destinos
      WHERE LOWER(descripcion) = LOWER(@descripcion)
        AND deleted_at IS NULL
    `);

  return result.recordset[0];
};

// Obtiene todos los destinos activos
const getAllDestinos = async () => {
  const pool = await poolPromise;

  const result = await pool.request()
    .query(`
      SELECT
        id_destino,
        descripcion,
        created_at,
        updated_at
      FROM destinos
      WHERE deleted_at IS NULL
    `);

  return result.recordset;
};

// Inserta un nuevo destino
const createDestino = async (dest) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', dest.descripcion)
    .query(`
      INSERT INTO destinos
      (descripcion, created_at, updated_at)
      OUTPUT INSERTED.id_destino
      VALUES
      (@descripcion, GETDATE(), GETDATE())
    `);

  return {
    id_destino: result.recordset[0].id_destino,
    descripcion: dest.descripcion
  };
};

// Actualiza la descripción
const updateDestino = async (id, dest) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .input('descripcion', dest.descripcion)
    .query(`
      UPDATE destinos
      SET descripcion = @descripcion,
          updated_at = GETDATE()
      WHERE id_destino = @id
        AND deleted_at IS NULL
    `);

  if (result.rowsAffected[0] === 0) return null;

  return {
    id_destino: id,
    descripcion: dest.descripcion
  };
};

// Borrado lógico
const deleteDestino = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      UPDATE destinos
      SET deleted_at = GETDATE()
      WHERE id_destino = @id
        AND deleted_at IS NULL
    `);

  return result.rowsAffected[0] > 0;
};

// Borrado físico
const hardDeleteDestino = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      DELETE FROM destinos
      WHERE id_destino = @id
    `);

  return result.rowsAffected[0] > 0;
};

module.exports = {
  findByDescripcion,
  getAllDestinos,
  createDestino,
  updateDestino,
  deleteDestino,
  hardDeleteDestino
};