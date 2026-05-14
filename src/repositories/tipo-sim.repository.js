const db = require('../config/db');

const getAllTiposSim = async () => {
    const [rows] = await db.query(
    'SELECT * FROM tiposim WHERE deleted_at IS NULL'
 );
 return rows;
};
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

const deleteTipoSim = async (id) => {
    const [result] = await db.query(
    `DELETE FROM tiposim WHERE id_tiposim = ?`,
     [id]
  );
  return result.affectedRows > 0;
};

const hardDeleteTipoSim = async (id) => {
    const [result] = await db.query(
    `DELETE FROM tiposim WHERE id_tiposim = ?`,
    [id]
 );
   return result.affectedRows > 0;
};
module.exports = {
 getAllTiposSim,
 createTipoSim,
 updateTipoSim,
 deleteTipoSim,
 hardDeleteTipoSim
};