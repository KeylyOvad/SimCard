const { poolPromise } = require('../config/db');

// Busca una ubicacion ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', descripcion)
    .query(`
      SELECT TOP 1
        id_ubicacion,
        descripcion
      FROM ubicaciones
      WHERE LOWER(descripcion) = LOWER(@descripcion)
        AND deleted_at IS NULL
    `);

  return result.recordset[0];
};

// Obtiene todas las ubicaciones activas
const getAllUbicaciones = async () => {
  const pool = await poolPromise;

  const result = await pool.request()
    .query(`
      SELECT
        id_ubicacion,
        descripcion,
        created_at,
        updated_at
      FROM ubicaciones
      WHERE deleted_at IS NULL
    `);

  return result.recordset;
};

// Inserta una nueva ubicacion
const createUbicacion = async (ubi) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', ubi.descripcion)
    .query(`
      INSERT INTO ubicaciones
      (descripcion, created_at, updated_at)
      OUTPUT INSERTED.id_ubicacion
      VALUES
      (@descripcion, GETDATE(), GETDATE())
    `);

  return {
    id_ubicacion: result.recordset[0].id_ubicacion,
    descripcion: ubi.descripcion
  };
};

// Actualiza la descripcion
const updateUbicacion = async (id, ubi) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .input('descripcion', ubi.descripcion)
    .query(`
      UPDATE ubicaciones
      SET descripcion = @descripcion,
          updated_at = GETDATE()
      WHERE id_ubicacion = @id
        AND deleted_at IS NULL
    `);

  if (result.rowsAffected[0] === 0) return null;

  return {
    id_ubicacion: id,
    descripcion: ubi.descripcion
  };
};

// Borrado logico
const deleteUbicacion = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      UPDATE ubicaciones
      SET deleted_at = GETDATE()
      WHERE id_ubicacion = @id
        AND deleted_at IS NULL
    `);

  return result.rowsAffected[0] > 0;
};

// Borrado fisico
const hardDeleteUbicacion = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      DELETE FROM ubicaciones
      WHERE id_ubicacion = @id
    `);

  return result.rowsAffected[0] > 0;
};

module.exports = {
  findByDescripcion,
  getAllUbicaciones,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion,
  hardDeleteUbicacion
};