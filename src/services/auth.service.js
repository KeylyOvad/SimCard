const userRepository = require('../repositories/user.repository');
const { comparePassword } = require('../utils/password.util');
const { generateToken } = require('../utils/jwt.util');

  const login = async (correo, password) => {
  const user = await userRepository.findByCorreo(correo);
  if (!user) throw new Error('INVALID_CREDENTIALS');
  const isValid = await comparePassword(password, user.password);
  if (!isValid) throw new Error('INVALID_CREDENTIALS');
   
    return generateToken({
    id: user.id_usuario,
    nombre: user.nombres,
    correo: user.correo
 });

};

module.exports = { login }
