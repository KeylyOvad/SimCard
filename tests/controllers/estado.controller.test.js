const { getEstados, createEstado, updateEstado, deleteEstado } = require('../../src/controllers/estado.controller'); // Ajusta si tu archivo se llama diferente (ej: estado.js)
const estadoRepository = require('../../src/repositories/estado.repository');


jest.mock('../../src/repositories/estado.repository', () => ({
  getAllEstados: jest.fn(),
  createEstado: jest.fn(),
  updateEstado: jest.fn(),
  deleteEstado: jest.fn()
}));

describe('Pruebas Unitarias - Estado Controller', () => {
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
  });

  describe('getEstados', () => {
    test('Debe retornar la lista de estados con un estatus 200', async () => {
      const mockEstados = [{ id: 1, nombre: 'Activo' }, { id: 2, nombre: 'Inactivo' }];
      estadoRepository.getAllEstados.mockResolvedValue(mockEstados);

      await getEstados(req, res);

      expect(estadoRepository.getAllEstados).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockEstados);
    });

    test('Debe retornar 500 si el repositorio falla al obtener los estados', async () => {
      estadoRepository.getAllEstados.mockRejectedValue(new Error('Error de DB'));

      await getEstados(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error de DB' });
    });
  });

  describe('createEstado', () => {
    test('Debe crear un estado correctamente y responder con 201', async () => {
      req.body = { nombre: 'Suspendido' };
      const mockCreado = { id: 3, nombre: 'Suspendido' };
      estadoRepository.createEstado.mockResolvedValue(mockCreado);

      await createEstado(req, res);

      expect(estadoRepository.createEstado).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreado);
    });

    test('Debe retornar 500 si la creación del estado falla', async () => {
      estadoRepository.createEstado.mockRejectedValue(new Error('Error de inserción'));

      await createEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error de inserción' });
    });
  });

  describe('updateEstado', () => {
    test('Debe actualizar el estado usando el ID enviado y retornar el objeto modificado', async () => {
      req.params.id = '2';
      req.body = { nombre: 'Inactivo Modificado' };
      const mockActualizado = { id: 2, nombre: 'Inactivo Modificado' };
      
      estadoRepository.updateEstado.mockResolvedValue(mockActualizado);

      await updateEstado(req, res);

      expect(estadoRepository.updateEstado).toHaveBeenCalledWith('2', req.body);
      expect(res.json).toHaveBeenCalledWith(mockActualizado);
    });

    test('Debe retornar 500 si falla la actualización del estado', async () => {
      estadoRepository.updateEstado.mockRejectedValue(new Error('Error de actualización'));

      await updateEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error de actualización' });
    });
  });

  describe('deleteEstado', () => {
    test('Debe eliminar el estado por ID y retornar un mensaje confirmando el éxito', async () => {
      req.params.id = '1';
      estadoRepository.deleteEstado.mockResolvedValue(true);

      await deleteEstado(req, res);

      expect(estadoRepository.deleteEstado).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Estado eliminado correctamente' });
    });

    test('Debe retornar 500 si ocurre un error al intentar eliminar', async () => {
      estadoRepository.deleteEstado.mockRejectedValue(new Error('Error al eliminar'));

      await deleteEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al eliminar' });
    });
  });
});