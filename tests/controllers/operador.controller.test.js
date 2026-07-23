const { getOperadores, createOperador, updateOperador, deleteOperador } = require('../../src/controllers/operador.controller'); // Ajusta la ruta si tu archivo se llama diferente (ej: operador.js)
const operadorRepository = require('../../src/repositories/operador.repository');

jest.mock('../../src/repositories/operador.repository', () => ({
  getAllOperadores: jest.fn(),
  createOperador: jest.fn(),
  updateOperador: jest.fn(),
  deleteOperador: jest.fn()
}));

describe('Pruebas Unitarias - Operador Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {}
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

  describe('getOperadores', () => {
    test('Debe retornar la lista de operadores con un estatus 200', async () => {
      const mockOperadores = [{ id: 1, nombre: 'Claro' }, { id: 2, nombre: 'Movistar' }];
      operadorRepository.getAllOperadores.mockResolvedValue(mockOperadores);

      await getOperadores(req, res);

      expect(operadorRepository.getAllOperadores).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockOperadores);
    });

    test('Debe retornar 500 si el repositorio falla al obtener los operadores', async () => {
      operadorRepository.getAllOperadores.mockRejectedValue(new Error('Error de DB'));

      await getOperadores(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error de DB' });
    });
  });

  describe('createOperador', () => {
    test('Debe crear un operador correctamente y responder con 201', async () => {
      req.body = { nombre: 'Tigo' };
      const mockCreado = { id: 3, nombre: 'Tigo' };
      operadorRepository.createOperador.mockResolvedValue(mockCreado);

      await createOperador(req, res);

      expect(operadorRepository.createOperador).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreado);
    });

    test('Debe retornar 500 si la creación del operador falla', async () => {
      operadorRepository.createOperador.mockRejectedValue(new Error('Error de inserción'));

      await createOperador(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error de inserción' });
    });
  });

  describe('updateOperador', () => {
    test('Debe actualizar el operador usando el ID enviado y retornar el objeto modificado', async () => {
      req.params.id = '1';
      req.body = { nombre: 'Claro Empresa' };
      const mockActualizado = { id: 1, nombre: 'Claro Empresa' };
      
      operadorRepository.updateOperador.mockResolvedValue(mockActualizado);

      await updateOperador(req, res);

      expect(operadorRepository.updateOperador).toHaveBeenCalledWith('1', req.body);
      expect(res.json).toHaveBeenCalledWith(mockActualizado);
    });

    test('Debe retornar 500 si falla la actualización del operador', async () => {
      operadorRepository.updateOperador.mockRejectedValue(new Error('Error de actualización'));

      await updateOperador(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error de actualización' });
    });
  });

  describe('deleteOperador', () => {
    test('Debe eliminar el operador por ID y retornar un mensaje confirmando el éxito', async () => {
      req.params.id = '2';
      operadorRepository.deleteOperador.mockResolvedValue(true);

      await deleteOperador(req, res);

      expect(operadorRepository.deleteOperador).toHaveBeenCalledWith('2');
      expect(res.json).toHaveBeenCalledWith({ message: 'Operador eliminado correctamente' });
    });

    test('Debe retornar 500 si ocurre un error al intentar eliminar', async () => {
      operadorRepository.deleteOperador.mockRejectedValue(new Error('Error al eliminar'));

      await deleteOperador(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al eliminar' });
    });
  });
});