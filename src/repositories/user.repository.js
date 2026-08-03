const { poolPromise } = require('../config/db');

// Busca un usuario por correo
const findByCorreo = async (correo) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('correo', correo)
    .query(`
      SELECT
        id_usuario,
        nombres,
        correo,
        password,
        estado,
        id_rol
      FROM usuarios
      WHERE LOWER(correo) = LOWER(@correo)
        AND deleted_at IS NULL
    `);

  return result.recordset[0];
};

// Obtiene todos los usuarios activos
const getAllUsers = async () => {
  const pool = await poolPromise;

  const result = await pool.request()
    .query(`
      SELECT
        id_usuario,
        nombres,
        apellidos,
        correo,
        estado,
        id_rol,
        created_at,
        updated_at
      FROM usuarios
      WHERE deleted_at IS NULL
      ORDER BY id_usuario DESC
    `);

  return result.recordset;
};

// Crear usuario
const createUser = async (usuario) => {
  const pool = await poolPromise;

  const {
    nombres,
    apellidos,
    correo,
    contrasena,
    estado = 1,
    id_rol = 2
  } = usuario;

  const result = await pool.request()
    .input('nombres', nombres)
    .input('apellidos', apellidos)
    .input('correo', correo)
    .input('password', contrasena)
    .input('estado', estado)
    .input('id_rol', id_rol)
    .query(`
      INSERT INTO usuarios
      (
        nombres,
        apellidos,
        correo,
        password,
        estado,
        id_rol,
        created_at
      )
      OUTPUT INSERTED.id_usuario
      VALUES
      (
        @nombres,
        @apellidos,
        @correo,
        @password,
        @estado,
        @id_rol,
        GETDATE()
      )
    `);

  return {
    id_usuario: result.recordset[0].id_usuario,
    nombres,
    apellidos,
    correo,
    estado,
    id_rol
  };
};

// Actualizar usuario
const updateUser = async (id, usuario) => {
  const pool = await poolPromise;

  const {
    nombres,
    apellidos,
    correo,
    contrasena,
    estado,
    id_rol
  } = usuario;

  const campos = [];
  const request = pool.request();

  if (nombres !== undefined) {
    campos.push('nombres = @nombres');
    request.input('nombres', nombres);
  }

  if (apellidos !== undefined) {
    campos.push('apellidos = @apellidos');
    request.input('apellidos', apellidos);
  }

  if (correo !== undefined) {
    campos.push('correo = @correo');
    request.input('correo', correo);
  }

  if (estado !== undefined) {
    campos.push('estado = @estado');
    request.input('estado', estado);
  }

  if (id_rol !== undefined && id_rol !== null) {
    campos.push('id_rol = @id_rol');
    request.input('id_rol', id_rol);
  }

  if (contrasena) {
    campos.push('password = @password');
    request.input('password', contrasena);
  }

  if (campos.length === 0) return false;

  campos.push('updated_at = GETDATE()');

  request.input('id', id);

  const result = await request.query(`
    UPDATE usuarios
    SET ${campos.join(', ')}
    WHERE id_usuario = @id
      AND deleted_at IS NULL
  `);

  return result.rowsAffected[0] > 0;
};

// Borrado logico
const deleteUser = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', id)
    .query(`
      UPDATE usuarios
      SET deleted_at = GETDATE(),
          estado = 0
      WHERE id_usuario = @id
    `);

  return result.rowsAffected[0] > 0;
};

module.exports = {
  findByCorreo,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};