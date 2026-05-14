const db = require('../config/db');

const getAllDestinos = async () => {
  const [rows] = await db.query(
 'SELECT * FROM destinos WHERE deleted_at IS NULL'
 );
  return rows;
};

const createDestino = async (dest) => {
 const { descripcion } = dest;
 const [result] = await db.query(
`INSERT INTO destinos (descripcion, created_at, updated_at)
 VALUES (?, NOW(), NOW())`,
[descripcion]
 );
 return { id_destino: result.insertId, descripcion };
};

const updateDestino = async (id, dest) => {
 const { descripcion } = dest;
 await db.query(
 `UPDATE destinos SET descripcion = ?, updated_at = NOW() WHERE id_destino = ?`,
  [descripcion, id]
);
return { id_destino: id, descripcion };
};

const deleteDestino = async (id) => {
 const [result] = await db.query(
 `DELETE FROM destinos WHERE id_destino = ?`,
 [id]

);
 return result.affectedRows > 0;
};

const hardDeleteDestino = async (id) => {
  const [result] = await db.query(
 `DELETE FROM destinos WHERE id_destino = ?`,
  [id]
);
 return result.affectedRows > 0;
};

module.exports = {
 getAllDestinos,
 createDestino,
 updateDestino,
 deleteDestino,
 hardDeleteDestino
};