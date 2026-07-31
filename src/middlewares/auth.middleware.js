const jwt = require('jsonwebtoken');

// Verifica que la peticion tenga un token valido
const verificarToken = (req, res, next) => {
  // Permite peticiones OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Obtiene el encabezado de autorizacion
  const authHeader = req.headers['authorization'] || req.headers.authorization;
  
  // Valida que exista el encabezado y empiece con Bearer
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      status: 'error',
      message: 'Acceso denegado: Token no provisto o formato invalido' 
    });
  }

  // Extrae el token
  const token = authHeader.replace(/^Bearer\s+/, '').trim();

  // Valida que el token no este vacio o sea invalido
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ 
      status: 'error',
      message: 'Acceso denegado: Token invalido' 
    });
  }

  try {
    // Valida la firma del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next(); 
  } catch (error) {
    console.error('Error JWT:', error.message);
    return res.status(401).json({ 
      status: 'error',
      message: 'Sesion invalida o expirada. Por favor, inicie sesion nuevamente.' 
    });
  }
};

// Valida si el usuario es administrador
const esAdmin = (req, res, next) => {
  // Comprueba el rol del usuario (1 = Admin)
  if (!req.user || !req.user.id_rol || Number(req.user.id_rol) !== 1) {
    return res.status(403).json({ 
      status: 'error',
      message: 'Acceso denegado: Permisos insuficientes.' 
    });
  }
  next(); 
};

module.exports = { verificarToken, esAdmin };