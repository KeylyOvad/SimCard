const { getDestinos, createDestino, updateDestino, deleteDestino } = require('../../src/controllers/destino.controller'); // Ajusta la ruta si tu archivo se llama diferente
const destinoRepository = require('../../src/repositories/destino.repository');


jest.mock('../../src/repositories/destino.repository', () => ({
  getAllDestinos: jest.fn(),
  createDestino: jest.fn(),
  updateDestino: jest.fn(),
  deleteDestino: jest.fn()
}));

describe('Pruebas Unitarias - Destino Controller', () => {
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

  describe('getDestinos', () => {
    test('Debe retornar la lista de destinos con un estatus 200', async () => {
      const mockDestinos = [{ id: 1, nombre: 'Destino A' }, { id: 2, nombre: 'Destino B' }];
      destinoRepository.getAllDestinos.mockResolvedValue(mockDestinos);

      await getDestinos(req, res);

      expect(destinoRepository.getAllDestinos).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockDestinos);
    });

    test('Debe retornar 500 si el repositorio falla', async () => {
      destinoRepository.getAllDestinos.mockRejectedValue(new Error('Error de conexión'));

      await getDestinos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error de conexión' });
    });
  });

  describe('createDestino', () => {
    test('Debe crear un destino y responder con 201 y el objeto creado', async () => {
      req.body = { nombre: 'Nuevo Destino' };
      const mockCreado = { id: 3, nombre: 'Nuevo Destino' };
      destinoRepository.createDestino.mockResolvedValue(mockCreado);

      await createDestino(req, res);

      expect(destinoRepository.createDestino).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreado);
    });

    test('Debe retornar 500 si falla la creación', async () => {
      destinoRepository.createDestino.mockRejectedValue(new Error('Error al insertar'));

      await createDestino(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al insertar' });
    });
  });

  describe('updateDestino', () => {
    test('Debe actualizar el destino usando el ID de los params y retornar el objeto actualizado', async () => {
      req.params.id = '10';
      req.body = { nombre: 'Destino Modificado' };
      const mockActualizado = { id: 10, nombre: 'Destino Modificado' };
      
      destinoRepository.updateDestino.mockResolvedValue(mockActualizado);

      await updateDestino(req, res);

      expect(destinoRepository.updateDestino).toHaveBeenCalledWith('10', req.body);
      expect(res.json).toHaveBeenCalledWith(mockActualizado);
    });

    test('Debe retornar 500 si falla la actualización', async () => {
      destinoRepository.updateDestino.mockRejectedValue(new Error('Error al actualizar'));

      await updateDestino(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al actualizar' });
    });
  });

  describe('deleteDestino', () => {
    test('Debe eliminar el destino correctamente y retornar un mensaje de éxito', async () => {
      req.params.id = '5';
      destinoRepository.deleteDestino.mockResolvedValue(true);

      await deleteDestino(req, res);

      expect(destinoRepository.deleteDestino).toHaveBeenCalledWith('5');
      expect(res.json).toHaveBeenCalledWith({ message: 'Destino eliminado correctamente' });
    });

    test('Debe retornar 500 si falla la eliminación', async () => {
      destinoRepository.deleteDestino.mockRejectedValue(new Error('Error al eliminar'));

      await deleteDestino(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al eliminar' });
    });
  });
});