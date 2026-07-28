const db = require('../config/db');

const findByCorreo = async (correo) => {
    const [rows] = await db.query(
        // ✅ Agregamos 'estado' a la consulta SQL
        'SELECT id_usuario, nombres, correo, password, estado, id_rol FROM usuarios WHERE LOWER(correo) = LOWER(?)',
        [correo]
    );
    return rows[0];
};

const getAllUsers = async () => {
    const [rows] = await db.query(`
        SELECT
            id_usuario,
            nombres,
            apellidos,
            correo,
            estado,
            id_rol
        FROM usuarios
    `);

    return rows;
};

const createUser = async (usuario) => {
    const { nombres, apellidos, correo, contrasena, estado, id_rol = 2 } = usuario;
    const [result] = await db.query(
        `INSERT INTO usuarios (nombres, apellidos, correo, password, estado, id_rol)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nombres, apellidos, correo, contrasena, estado, id_rol]
    );

    return {
        id: result.insertId,
        nombres,
        apellidos,
        correo,
        estado,
        id_rol
    };
};

const updateUser = async (id, usuario) => {
    const { nombres, apellidos, correo, contrasena, estado, id_rol } = usuario;

    let result;
    if (contrasena) {
        [result] = await db.query(
            `UPDATE usuarios 
             SET nombres = ?, apellidos = ?, correo = ?, password = ?, estado = ?, id_rol = ?
             WHERE id_usuario = ?`,
            [nombres, apellidos, correo, contrasena, estado, id_rol, id]
        );
    } else {
        [result] = await db.query(
            `UPDATE usuarios 
             SET nombres = ?, apellidos = ?, correo = ?, estado = ?, id_rol = ?
             WHERE id_usuario = ?`,
            [nombres, apellidos, correo, estado, id_rol, id]
        );
    }

    return result.affectedRows > 0;
};

const deleteUser = async (id) => {
    const [result] = await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
    return result.affectedRows > 0;
};

module.exports = {
    findByCorreo,
    getAllUsers,
    createUser,
    updateUser, 
    deleteUser 
};