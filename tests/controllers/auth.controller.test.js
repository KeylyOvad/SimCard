const authController = require('../../src/controllers/auth.controller');
const authService = require('../../src/services/auth.service');

jest.mock('../../src/services/auth.service', () => ({
  login: jest.fn()
}));

describe('Pruebas Unitarias - Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  test('login debe retornar el token y id_rol si las credenciales son válidas', async () => {
    req.body = { correo: 'test@correo.com', password: 'password123' };
    
    authService.login.mockResolvedValueOnce({
      token: 'jwt_falso_exitoso',
      id_rol: 1
    });

    await authController.login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Login exitoso',
      token: 'jwt_falso_exitoso',
      id_rol: 1
    });
  });

  test('login debe retornar 401 si el servicio lanza INVALID_CREDENTIALS', async () => {
    req.body = { correo: 'test@correo.com', password: 'mal_password' };
    
    authService.login.mockRejectedValueOnce(new Error('INVALID_CREDENTIALS'));

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales incorrectas' });
  });

  test('login debe retornar 500 si ocurre cualquier otro error inesperado', async () => {
    req.body = { correo: 'test@correo.com', password: 'password123' };
    
    authService.login.mockRejectedValueOnce(new Error('DB_CONN_TIMEOUT'));

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error del servidor' });
  });

  test('getUserInfo debe retornar los datos del usuario que vienen en req.user', () => {
    req.user = { nombre: 'Juan Pérez', id_rol: 1 };

    authController.getUserInfo(req, res);

    expect(res.json).toHaveBeenCalledWith({
      nombre: 'Juan Pérez',
      id_rol: 1
    });
  });
});