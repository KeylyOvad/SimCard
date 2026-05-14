const db = require('../config/db');
const getAllPlanes = async () => {
  const [rows] = await db.query(
 'SELECT * FROM planes WHERE deleted_at IS NULL'
  );
  return rows;
};

const createPlan = async (plan) => {
const { descripcion } = plan;

const [result] = await db.query(
 `INSERT INTO planes (descripcion, created_at, updated_at)
  VALUES (?, NOW(), NOW())`,
  [descripcion]
 );

    return {
    id_plan: result.insertId,
    descripcion
   };

};


const updatePlan = async (id, plan) => {

  const { descripcion } = plan;

    await db.query(
    `UPDATE planes 
     SET descripcion = ?, updated_at = NOW() 
     WHERE id_plan = ?`,
    [descripcion, id]
 );

   return { id_plan: id, descripcion };
};


const deletePlan = async (id) => {
     await db.query(
     `DELETE FROM planes WHERE id_plan = ?`,
     [id]
  );
      return true;
};

const hardDeletePlan = async (id) => {
    const [result] = await db.query(
    `DELETE FROM planes WHERE id_plan = ?`,
    [id]
  );
 return result.affectedRows > 0;
};

module.exports = {
   getAllPlanes,
   createPlan,
   updatePlan,
   deletePlan,
   hardDeletePlan
};
