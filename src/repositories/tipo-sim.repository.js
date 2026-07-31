const { poolPromise, sql } = require('../config/db');

// Busca un tipo de sim ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('descripcion', sql.VarChar, String(descripcion).trim())
    .query(`
      SELECT TOP 1 id_tiposim, descripcion 
      FROM tiposim 
      WHERE LOWER(descripcion) = LOWER(@descripcion) AND deleted_at IS NULL
    `);
  return result.recordset[0] || null;
};

// Obtiene todos los tipos de sim activos 
const getAllTiposSim = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT id_tiposim, descripcion, created_at, updated_at 
    FROM tiposim 
    WHERE deleted_at IS NULL
  `);
  return result.recordset;
};

// Inserta un nuevo tipo de sim
const createTipoSim = async (tipo) => {
  const { descripcion } = tipo;
  const pool = await poolPromise;
  
  const result = await pool.request()
    .input('descripcion', sql.VarChar, String(descripcion).trim())
    .query(`
      INSERT INTO tiposim (descripcion, created_at)
      OUTPUT INSERTED.id_tiposim
      VALUES (@descripcion, GETDATE())
    `);

  return {
    id_tiposim: result.recordset[0].id_tiposim,
    descripcion
  };
};

// Actualiza la descripción validando que el registro exista 
const updateTipoSim = async (id, tipo) => {
  const { descripcion } = tipo;
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', sql.Int, Number(id))
    .input('descripcion', sql.VarChar, String(descripcion).trim())
    .query(`
      UPDATE tiposim 
      SET descripcion = @descripcion, updated_at = GETDATE() 
      WHERE id_tiposim = @id AND deleted_at IS NULL
    `);

  if (result.rowsAffected[0] === 0) return null;
  return { id_tiposim: id, descripcion };
};

// Borrado Logico
const deleteTipoSim = async (id) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, Number(id))
    .query(`
      UPDATE tiposim 
      SET deleted_at = GETDATE() 
      WHERE id_tiposim = @id AND deleted_at IS NULL
    `);

  return result.rowsAffected[0] > 0;
};

// Borrado Fisico
const hardDeleteTipoSim = async (id) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, Number(id))
    .query(`
      DELETE FROM tiposim 
      WHERE id_tiposim = @id
    `);

  return result.rowsAffected[0] > 0;
};

module.exports = {
  findByDescripcion,
  getAllTiposSim,
  createTipoSim,
  updateTipoSim,
  deleteTipoSim,
  hardDeleteTipoSim
};