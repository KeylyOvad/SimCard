const userRepository = require('../repositories/user.repository');
const { comparePassword } = require('../utils/password.util');
const { generateToken } = require('../utils/jwt.util');

// Gestiona el proceso de autenticacion validando credenciales y generando un token de acceso
const login = async (correo, password) => {
  // Busca si existe un usuario registrado con el correo 
  const user = await userRepository.findByCorreo(correo);
  
  // 1. Si no existe el usuario
  // 2. O si el usuario está inactivo (estado 0)
  if (!user || Number(user.estado) !== 1) {
    throw new Error('INVALID_CREDENTIALS');
  }
  
  // Compara la contrasena ingresada con el hash almacenado en la base de datos
  const isValid = await comparePassword(password, user.password);
  if (!isValid) throw new Error('INVALID_CREDENTIALS');
    
  // Genera el token JWT empaquetando la informacion basica del perfil autenticado
  const token = generateToken({
    id: user.id_usuario,
    nombre: user.nombres,
    correo: user.correo,
    id_rol: user.id_rol 
  });

  return { token, id_rol: user.id_rol };
};

module.exports = { login };