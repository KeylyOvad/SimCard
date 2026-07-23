const jwt = require('jsonwebtoken');

const { verificarToken, esAdmin } = require('../../src/middlewares/auth.middleware'); 

describe('Pruebas Unitarias - Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'clave_secreta_para_pruebas';
  });

  test('Debe retornar 401 si no se envía la cabecera Authorization o formato inválido', () => {
    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ 
        status: 'error',
        message: 'Acceso denegado: Token no provisto o formato inválido' 
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('Debe pasar (next) si el token es válido y está bien firmado', () => {
    const payload = { id_usuario: 1, id_rol: 1 };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    verificarToken(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.id_usuario).toBe(1);
    expect(next).toHaveBeenCalled();
  });

  test('Debe retornar 403 si el id_rol del usuario NO es 1', () => {
    req.user = { id_usuario: 2, id_rol: 2 };

    esAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Acceso denegado: Permisos insuficientes para realizar esta acción.'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('Debe permitir el acceso (next) si el id_rol es igual a 1', () => {
    req.user = { id_usuario: 1, id_rol: 1 };

    esAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});