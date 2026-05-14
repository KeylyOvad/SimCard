const db = require('../config/db');

const findByCorreo = async (correo) => {
      const [rows] = await db.query(
      'SELECT id_usuario, nombres, correo, password FROM usuarios WHERE LOWER(correo) = LOWER(?)',
      [correo]
  );
    return rows[0];
};

const getAllUsers = async () => {
    const [rows] = await db.query('SELECT * FROM usuarios');
    return rows;
  };

const createUser = async (usuario) => {
     const { nombres, apellidos, correo, contrasena, estado } = usuario;
     const [result] = await db.query(
    `INSERT INTO usuarios (nombres, apellidos, correo, password, estado)
     VALUES (?, ?, ?, ?, ?)`,
     [nombres, apellidos, correo, contrasena, estado]
  );

   return {
    id: result.insertId,
    nombres,
    apellidos,
    correo,
    estado
  };
};
   const deleteUser = async (id) => {
    return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM usuarios WHERE id_usuario = ?';
    db.query(sql, [id], (err, result) => {
       if (err) return reject(err);
       resolve(result.affectedRows > 0);
    });
 });
};

module.exports = {
findByCorreo,
getAllUsers,
createUser,
deleteUser 
};