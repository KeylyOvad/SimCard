const authService = require('../services/auth.service');

// Hace el inicio de sesión del usuario
const login = async (req, res) => {
  const { correo, password } = req.body;

  // Validar campos obligatorios
  if (!correo || !password) {
    return res.status(400).json({
      message: 'Correo y contraseña son obligatorios'
    });
  }

  // Validar formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(correo)) {
    return res.status(400).json({
      message: 'Formato de correo inválido'
    });
  }

  // Normalizar correo
  const correoNormalizado = correo.trim().toLowerCase();

  try {
    // Busca el usuario y genera el token de seguridad
    const { token, id_rol } = await authService.login(
      correoNormalizado,
      password
    );

    res.json({
      message: 'Login exitoso',
      token,
      id_rol
    });

  } catch (error) {

    // Si los datos están mal, avisa al usuario
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        message: 'Credenciales incorrectas'
      });
    }

    // Si es otro error lo guarda en consola y manda error 500
    console.error('Error en controlador login:', error.message);

    res.status(500).json({
      message: 'Error del servidor'
    });
  }
};

// Devuelve los datos del usuario que ya inició sesión
const getUserInfo = (req, res) => {
  // req.user viene del middleware que valida el token
  res.json({
    nombre: req.user.nombre,
    id_rol: req.user.id_rol
  });
};

module.exports = {
  login,
  getUserInfo
};