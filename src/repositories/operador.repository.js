const db = require('../config/db');

const getAllOperadores = async () => {
 const [rows] = await db.query('SELECT * FROM operadores WHERE deleted_at IS NULL');
 return rows;
};

const createOperador = async (operador) => {
  const { descripcion } = operador;
  const [result] = await db.query(
 `INSERT INTO operadores (descripcion, created_at, updated_at) VALUES (?, NOW(), NOW())`,
  [descripcion]
  );
   return {
   id_operador: result.insertId,
   descripcion
   };
};

const updateOperador = async (id, operador) => {
   const { descripcion } = operador;
   await db.query(
   `UPDATE operadores SET descripcion = ?, updated_at = NOW() WHERE id_operador = ?`,
    [descripcion, id]
   );
   return { id_operador: id, descripcion };
};
const deleteOperador = async (id) => {
   await db.query(
   `UPDATE operadores SET deleted_at = NOW() WHERE id_operador = ?`,
    [id]
  );
  return true;
};

module.exports = {
  getAllOperadores,
  createOperador,
  updateOperador,
  deleteOperador
};