const bcrypt = require('bcrypt');

// Genera el hash de seguridad de la contrasena mediante un algoritmo robusto (Bcrypt)
const hashPassword = (plainPassword) => {
  return bcrypt.hash(plainPassword, 10);
};

// Compara el texto plano de una contrasena con un hash guardado para validar si coinciden
const comparePassword = (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword
};