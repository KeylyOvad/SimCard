const db = require('../config/db');

// Busca un tipo de sim por su descripcion ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_tiposim, descripcion FROM tiposim WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todos los tipos de sim que no han sido eliminados logicamente
const getAllTiposSim = async () => {
    const [rows] = await db.query(
    'SELECT * FROM tiposim WHERE deleted_at IS NULL'
 );
 return rows;
};

// Inserta un nuevo tipo de sim en la base de datos
const createTipoSim = async (tipo) => {
   const { descripcion } = tipo;
   const [result] = await db.query(
   `INSERT INTO tiposim (descripcion, created_at, updated_at)
    VALUES (?, NOW(), NOW())`,
    [descripcion]
  );
   return {
    id_tiposim: result.insertId,
    descripcion
   };
};

// Actualiza la descripcion de un tipo de sim existente usando su id
const updateTipoSim = async (id, tipo) => {
  const { descripcion } = tipo;
  await db.query(
  `UPDATE tiposim 
   SET descripcion = ?, updated_at = NOW() 
   WHERE id_tiposim = ?`,
   [descripcion, id]
 );
  return { id_tiposim: id, descripcion };
};

// Elimina un tipo de sim usando su id 
const deleteTipoSim = async (id) => {
    const [result] = await db.query(
    `DELETE FROM tiposim WHERE id_tiposim = ?`,
     [id]
  );
  return result.affectedRows > 0;
};

// Realiza una eliminacion fisica del tipo de sim validando filas afectadas
const hardDeleteTipoSim = async (id) => {
    const [result] = await db.query(
    `DELETE FROM tiposim WHERE id_tiposim = ?`,
    [id]
 );
   return result.affectedRows > 0;
};

module.exports = {
 findByDescripcion,
 getAllTiposSim,
 createTipoSim,
 updateTipoSim,
 deleteTipoSim,
 hardDeleteTipoSim
};