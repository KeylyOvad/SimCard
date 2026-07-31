const { poolPromise } = require('../config/db');

// Busca un operador ignorando mayúsculas y minúsculas
const findByDescripcion = async (descripcion) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', descripcion)
    .query(`
      SELECT TOP 1
        id_operador,
        descripcion
      FROM operadores
      WHERE LOWER(descripcion) = LOWER(@descripcion)
        AND deleted_at IS NULL
    `);

  return result.recordset[0];
};

// Obtiene todos los operadores activos
const getAllOperadores = async () => {
  const pool = await poolPromise;

  const result = await pool.request()
    .query(`
      SELECT
        id_operador,
        descripcion,
        created_at,
        updated_at
      FROM operadores
      WHERE deleted_at IS NULL
    `);

  return result.recordset;
};

// Inserta un nuevo operador
const createOperador = async (operador) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('descripcion', operador.descripcion)
    .query(`
      INSERT INTO operadores
      (descripcion, created_at, updated_at)
      OUTPUT INSERTED.id_operador
      VALUES
      (@descripcion, GETDATE(), GETDATE())
    `);

  return {
    id_operador: result.recordset[0].id_operador,
    descripcion: operador.descripcion
  };
};

// Actualiza la descripción de un operador
const updateOperador = async (id, operador) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .input('descripcion', operador.descripcion)
    .query(`
      UPDATE operadores
      SET descripcion = @descripcion,
          updated_at = GETDATE()
      WHERE id_operador = @id
        AND deleted_at IS NULL
    `);

  if (result.rowsAffected[0] === 0) return null;

  return {
    id_operador: id,
    descripcion: operador.descripcion
  };
};

// Borrado lógico
const deleteOperador = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      UPDATE operadores
      SET deleted_at = GETDATE()
      WHERE id_operador = @id
        AND deleted_at IS NULL
    `);

  return result.rowsAffected[0] > 0;
};

// Borrado físico
const hardDeleteOperador = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      DELETE FROM operadores
      WHERE id_operador = @id
    `);

  return result.rowsAffected[0] > 0;
};

module.exports = {
  findByDescripcion,
  getAllOperadores,
  createOperador,
  updateOperador,
  deleteOperador,
  hardDeleteOperador
};