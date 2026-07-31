const userRepository = require('../repositories/user.repository');
const { comparePassword } = require('../utils/password.util');
const { generateToken } = require('../utils/jwt.util');

// Inicia sesion validando el usuario y generando el token
const login = async (correo, password) => {
  // Busca el usuario por correo en la base de datos
  const user = await userRepository.findByCorreo(correo);
  
  // Valida que el usuario exista y que este activo (estado 1)
  if (!user || Number(user.estado) !== 1) {
    throw new Error('INVALID_CREDENTIALS');
  }
  
  // Compara la contrasena ingresada con la guardada
  const isValid = await comparePassword(password, user.password);
  if (!isValid) throw new Error('INVALID_CREDENTIALS');
    
  // Genera el token JWT con los datos basicos del usuario
  const token = generateToken({
    id: user.id_usuario,
    nombre: user.nombres,
    correo: user.correo,
    id_rol: user.id_rol 
  });

  return { token, id_rol: user.id_rol };
};

module.exports = { login };