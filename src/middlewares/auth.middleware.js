const jwt = require('jsonwebtoken');

// Valida que la peticion incluya un token JWT valido
const verificarToken = (req, res, next) => {
  // Deja pasar peticiones CORS OPTIONS sin pedir token
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Soporta cabeceras en mayusculas o minusculas
  const authHeader = req.headers['authorization'] || req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      status: 'error',
      message: 'Acceso denegado: Token no provisto o formato invalido' 
    });
  }

  // Extrae el token removiendo "Bearer "
  const token = authHeader.replace(/^Bearer\s+/, '').trim();

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ 
      status: 'error',
      message: 'Acceso denegado: Token invalido' 
    });
  }

  try {
    // Verifica la firma del token con la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Inyecta los datos del usuario en la peticion
    next(); // Permite continuar a la siguiente funcion o controlador
  } catch (error) {
    console.error('Error JWT:', error.message);
    return res.status(401).json({ 
      status: 'error',
      message: 'Sesion invalida o expirada. Por favor, inicie sesion nuevamente.' 
    });
  }
};

// Valida si el usuario de la peticion tiene asignado el rol de Administrador
const esAdmin = (req, res, next) => {
  if (!req.user || !req.user.id_rol || Number(req.user.id_rol) !== 1) {
    return res.status(403).json({ 
      status: 'error',
      message: 'Acceso denegado: Permisos insuficientes.' 
    });
  }
  next();
};

module.exports = { verificarToken, esAdmin };