const authService = require('../services/auth.service');

const login = async (req, res) => {
  const { correo, password } = req.body;

  try {
    const token = await authService.login(correo, password);

    res.json({
      message: 'Login exitoso',
      token
    });

  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    res.status(500).json({ message: 'Error del servidor' });
  }
};

const getUserInfo = (req, res) => {
  res.json({
    nombre: req.user.nombre
  });
};

module.exports = {
  login,
  getUserInfo
};