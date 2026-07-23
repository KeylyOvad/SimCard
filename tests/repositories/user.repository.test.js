const userRepository = require('../../src/repositories/user.repository');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

describe('Pruebas Unitarias - User Repository', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByCorreo', () => {
    test('Debe retornar el primer usuario encontrado ignorando mayúsculas/minúsculas', async () => {
      const mockUser = { id_usuario: 1, nombres: 'Kevin', correo: 'test@correo.com', id_rol: 1 };
      db.query.mockResolvedValue([[mockUser]]);

      const result = await userRepository.findByCorreo('TEST@correo.com');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE LOWER(correo) = LOWER(?)'),
        ['TEST@correo.com']
      );
      expect(result).toEqual(mockUser);
    });

    test('Debe retornar undefined si el correo no está registrado', async () => {
      db.query.mockResolvedValue([[]]);

      const result = await userRepository.findByCorreo('noexiste@correo.com');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllUsers', () => {
    test('Debe retornar el listado completo de la tabla usuarios', async () => {
      const mockUsers = [
        { id_usuario: 1, nombres: 'Kevin' },
        { id_usuario: 2, nombres: 'Admin' }
      ];
      db.query.mockResolvedValue([mockUsers]);

      const result = await userRepository.getAllUsers();

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM usuarios');
      expect(result).toEqual(mockUsers);
    });
  });

  describe('createUser', () => {
    test('Debe insertar el usuario y retornar sus datos junto al insertId', async () => {
      const mockPayload = {
        nombres: 'Juan',
        apellidos: 'Pérez',
        correo: 'juan@correo.com',
        contrasena: 'hashed_password',
        estado: 'Activo',
        id_rol: 2
      };
      const mockResult = { insertId: 7 };
      db.query.mockResolvedValue([mockResult]);

      const result = await userRepository.createUser(mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usuarios'),
        ['Juan', 'Pérez', 'juan@correo.com', 'hashed_password', 'Activo', 2]
      );
      expect(result).toEqual({
        id: 7,
        nombres: 'Juan',
        apellidos: 'Pérez',
        correo: 'juan@correo.com',
        estado: 'Activo',
        id_rol: 2
      });
    });
  });

  describe('updateUser', () => {
    const mockPayloadBase = {
      nombres: 'Juan Modificado',
      apellidos: 'Pérez',
      correo: 'juan@correo.com',
      estado: 'Inactivo',
      id_rol: 2
    };

    test('Debe incluir la contraseña en la query de actualización si viene en el objeto', async () => {
      const payloadConPassword = { ...mockPayloadBase, contrasena: 'new_hashed_password' };
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await userRepository.updateUser(15, payloadConPassword);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('password = ?'),
        ['Juan Modificado', 'Pérez', 'juan@correo.com', 'new_hashed_password', 'Inactivo', 2, 15]
      );
      expect(result).toBe(true);
    });

    test('Debe omitir la contraseña en la query de actualización si no viene en el objeto', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await userRepository.updateUser(15, mockPayloadBase);

      expect(db.query).toHaveBeenCalledWith(
        expect.not.stringContaining('password = ?'),
        ['Juan Modificado', 'Pérez', 'juan@correo.com', 'Inactivo', 2, 15]
      );
      expect(result).toBe(true);
    });

    test('Debe retornar false si no se actualizó ningún registro (affectedRows es 0)', async () => {
      db.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await userRepository.updateUser(999, mockPayloadBase);
      expect(result).toBe(false);
    });
  });

  describe('deleteUser', () => {
    test('Debe retornar true si se eliminó físicamente el usuario', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await userRepository.deleteUser(3);

      expect(db.query).toHaveBeenCalledWith('DELETE FROM usuarios WHERE id_usuario = ?', [3]);
      expect(result).toBe(true);
    });

    test('Debe retornar false si el usuario a eliminar no existía', async () => {
      db.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await userRepository.deleteUser(999);
      expect(result).toBe(false);
    });
  });
});