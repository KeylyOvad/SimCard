const {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../../src/controllers/user.controller');
const userRepository = require('../../src/repositories/user.repository');
const bcrypt = require('bcrypt');

jest.mock('../../src/repositories/user.repository');
jest.mock('bcrypt');

describe('Pruebas Unitarias - User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getUsers', () => {
    test('Debe retornar la lista de usuarios con éxito', async () => {
      const mockUsers = [{ id: 1, nombres: 'John', apellidos: 'Doe', correo: 'john@test.com' }];
      userRepository.getAllUsers.mockResolvedValue(mockUsers);

      await getUsers(req, res);

      expect(userRepository.getAllUsers).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    test('Debe responder con 500 si falla el repositorio al listar', async () => {
      userRepository.getAllUsers.mockRejectedValue(new Error('DB Query Error'));

      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error al obtener usuarios' });
    });
  });

  describe('createUser', () => {
    test('Debe crear un usuario exitosamente encriptando la contraseña y mapeando rol/estado', async () => {
      req.body = {
        nombres: 'John',
        apellidos: 'Doe',
        correo: 'john@test.com',
        contrasena: 'securePass123',
        estado: 'Activo',
        id_rol: '1'
      };

      bcrypt.hash.mockResolvedValue('hashed_password_mock');
      const mockNuevoUsuario = { id: 1, nombres: 'John', correo: 'john@test.com' };
      userRepository.createUser.mockResolvedValue(mockNuevoUsuario);

      await createUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('securePass123', 10);
      expect(userRepository.createUser).toHaveBeenCalledWith({
        nombres: 'John',
        apellidos: 'Doe',
        correo: 'john@test.com',
        contrasena: 'hashed_password_mock',
        estado: 1, 
        id_rol: 1  
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNuevoUsuario);
    });

    test('Debe lanzar error 400 si faltan datos obligatorios', async () => {
      req.body = { nombres: 'John' }; 

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Faltan datos obligatorios' });
      expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    test('Debe responder con 500 si ocurre un error inesperado al crear', async () => {
      req.body = { nombres: 'J', apellidos: 'D', correo: 'j@t.com', contrasena: '123' };
      bcrypt.hash.mockRejectedValue(new Error('Bcrypt failed'));

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error al crear usuario' });
    });
  });

  describe('updateUser', () => {
    test('Debe actualizar el usuario correctamente con una nueva contraseña', async () => {
      req.params.id = '5';
      req.body = {
        nombres: 'Jane',
        apellidos: 'Doe',
        correo: 'jane@test.com',
        contrasena: 'newPassword',
        estado: 'Inactivo',
        id_rol: '3'
      };

      bcrypt.hash.mockResolvedValue('new_hashed_password');
      userRepository.updateUser.mockResolvedValue(true);

      await updateUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(userRepository.updateUser).toHaveBeenCalledWith('5', {
        nombres: 'Jane',
        apellidos: 'Doe',
        correo: 'jane@test.com',
        contrasena: 'new_hashed_password',
        estado: 0, 
        id_rol: 3
      });
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario actualizado correctamente', usuarioId: '5' });
    });

    test('Debe actualizar el usuario sin tocar la contraseña si viene vacía o ausente', async () => {
      req.params.id = '5';
      req.body = {
        nombres: 'Jane',
        apellidos: 'Doe',
        correo: 'jane@test.com',
        contrasena: ' ', 
        estado: 'Activo'
      };

      userRepository.updateUser.mockResolvedValue(true);

      await updateUser(req, res);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.updateUser).toHaveBeenCalledWith('5', {
        nombres: 'Jane',
        apellidos: 'Doe',
        correo: 'jane@test.com',
        contrasena: null,
        estado: 1,
        id_rol: undefined
      });
    });

    test('Debe retornar 400 si faltan nombres, apellidos o correo al actualizar', async () => {
      req.params.id = '5';
      req.body = { nombres: 'Jane' }; 

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nombres, apellidos y correo son obligatorios' });
    });

    test('Debe retornar 404 si el repositorio indica que el usuario no existe', async () => {
      req.params.id = '999';
      req.body = { nombres: 'J', apellidos: 'D', correo: 'j@t.com' };
      userRepository.updateUser.mockResolvedValue(false); 

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado para actualizar' });
    });
  });

  describe('deleteUser', () => {
    test('Debe eliminar el usuario con éxito', async () => {
      req.params.id = '7';
      userRepository.deleteUser.mockResolvedValue(true);

      await deleteUser(req, res);

      expect(userRepository.deleteUser).toHaveBeenCalledWith('7');
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario eliminado correctamente', id_usuario: '7' });
    });

    test('Debe retornar 404 si el usuario a eliminar no existe', async () => {
      req.params.id = '999';
      userRepository.deleteUser.mockResolvedValue(false);

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });
  });
});