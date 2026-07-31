const { poolPromise } = require('../config/db');

// Busca una capacidad por su descripción ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', descripcion)
    .query(`
      SELECT TOP 1
        id_capacidad,
        descripcion
      FROM capacidades
      WHERE LOWER(descripcion) = LOWER(@descripcion)
        AND deleted_at IS NULL
    `);

  return result.recordset[0];
};

// Obtiene todas las capacidades activas
const getAllCapacidades = async () => {
  const pool = await poolPromise;

  const result = await pool.request()
    .query(`
      SELECT
        id_capacidad,
        descripcion,
        created_at,
        updated_at
      FROM capacidades
      WHERE deleted_at IS NULL
    `);

  return result.recordset;
};

// Inserta una nueva capacidad
const createCapacidad = async (cap) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', cap.descripcion)
    .query(`
      INSERT INTO capacidades
      (descripcion, created_at, updated_at)
      OUTPUT INSERTED.id_capacidad
      VALUES
      (@descripcion, GETDATE(), GETDATE())
    `);

  return {
    id_capacidad: result.recordset[0].id_capacidad,
    descripcion: cap.descripcion
  };
};

// Actualiza una capacidad
const updateCapacidad = async (id, cap) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .input('descripcion', cap.descripcion)
    .query(`
      UPDATE capacidades
      SET descripcion = @descripcion,
          updated_at = GETDATE()
      WHERE id_capacidad = @id
        AND deleted_at IS NULL
    `);

  if (result.rowsAffected[0] === 0) return null;

  return {
    id_capacidad: id,
    descripcion: cap.descripcion
  };
};

// Borrado logico
const deleteCapacidad = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      UPDATE capacidades
      SET deleted_at = GETDATE()
      WHERE id_capacidad = @id
        AND deleted_at IS NULL
    `);

  return result.rowsAffected[0] > 0;
};

// Borrado fisico
const hardDeleteCapacidad = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      DELETE FROM capacidades
      WHERE id_capacidad = @id
    `);

  return result.rowsAffected[0] > 0;
};

module.exports = {
  findByDescripcion,
  getAllCapacidades,
  createCapacidad,
  updateCapacidad,
  deleteCapacidad,
  hardDeleteCapacidad
};