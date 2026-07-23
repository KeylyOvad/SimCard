const jwt = require('jsonwebtoken');

// Genera un token JWT firmado utilizando una clave secreta y con un tiempo de expiracion de una hora
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
};

// Verifica la validez y autenticidad del token recibido comparandolo contra la clave secreta
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};