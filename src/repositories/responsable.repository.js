const db = require('../config/db');

// Busca un responsable por su descripcion ignorando mayusculas y minusculas
const findByDescripcion = async (descripcion) => {
  const [rows] = await db.query(
    'SELECT id_responsable, descripcion FROM responsables WHERE LOWER(descripcion) = LOWER(?) AND deleted_at IS NULL',
    [descripcion]
  );
  return rows[0];
};

// Obtiene todos los responsables que no han sido eliminados logicamente
const getAllResponsables = async () => {
    const [rows] = await db.query(
        'SELECT * FROM responsables WHERE deleted_at IS NULL'
    );
    return rows;
};

// Inserta un nuevo responsable en la base de datos
const createResponsable = async (resp) => {
    const { descripcion } = resp;
    const [result] = await db.query(
        `INSERT INTO responsables (descripcion, created_at, updated_at)
         VALUES (?, NOW(), NOW())`,
        [descripcion]
    );
    return { id_responsable: result.insertId, descripcion };
};

// Actualiza la descripcion de un responsable existente usando su id
const updateResponsable = async (id, resp) => {
    const { descripcion } = resp;
    await db.query(
        `UPDATE responsables SET descripcion = ?, updated_at = NOW() WHERE id_responsable = ?`,
        [descripcion, id]
    );
    return { id_responsable: id, descripcion };
};

// Elimina un responsable usando su id
const deleteResponsable = async (id) => {
    const [result] = await db.query(
        `DELETE FROM responsables WHERE id_responsable = ?`,
        [id]
    );
    return result.affectedRows > 0;
};

// Realiza una eliminacion fisica del responsable validando filas afectadas
const hardDeleteResponsable = async (id) => {
    const [result] = await db.query(
        `DELETE FROM responsables WHERE id_responsable = ?`,
        [id]
    );
    return result.affectedRows > 0;
};

module.exports = {
    findByDescripcion,
    getAllResponsables,
    createResponsable,
    updateResponsable,
    deleteResponsable,
    hardDeleteResponsable
};