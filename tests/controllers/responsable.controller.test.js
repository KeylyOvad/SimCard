const {
  getResponsables,
  createResponsable,
  updateResponsable,
  deleteResponsable
} = require('../../src/controllers/responsable.controller'); 
const responsableRepository = require('../../src/repositories/responsable.repository');

jest.mock('../../src/repositories/responsable.repository', () => ({
  getAllResponsables: jest.fn(),
  createResponsable: jest.fn(),
  updateResponsable: jest.fn(),
  deleteResponsable: jest.fn()
}));

describe('Pruebas Unitarias - Responsable Controller', () => {
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

  describe('getResponsables', () => {
    test('Debe retornar la lista de responsables con código 200', async () => {
      const mockResponsables = [
        { id: 1, nombre: 'Juan Pérez' },
        { id: 2, nombre: 'María Gomez' }
      ];
      responsableRepository.getAllResponsables.mockResolvedValue(mockResponsables);

      await getResponsables(req, res);

      expect(responsableRepository.getAllResponsables).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockResponsables);
    });

    test('Debe responder con 500 si el repositorio falla', async () => {
      responsableRepository.getAllResponsables.mockRejectedValue(new Error('DB Error'));

      await getResponsables(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });

  describe('createResponsable', () => {
    test('Debe crear un responsable y retornar 201', async () => {
      req.body = { nombre: 'Carlos Torres' };
      const mockNuevo = { id: 3, nombre: 'Carlos Torres' };
      responsableRepository.createResponsable.mockResolvedValue(mockNuevo);

      await createResponsable(req, res);

      expect(responsableRepository.createResponsable).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNuevo);
    });

    test('Debe responder con 500 si falla la creación', async () => {
      responsableRepository.createResponsable.mockRejectedValue(new Error('Error al guardar'));

      await createResponsable(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al guardar' });
    });
  });

  describe('updateResponsable', () => {
    test('Debe actualizar el responsable y retornar los nuevos datos', async () => {
      req.params.id = '1';
      req.body = { nombre: 'Juan P. Actualizado' };
      const mockActualizado = { id: 1, nombre: 'Juan P. Actualizado' };
      responsableRepository.updateResponsable.mockResolvedValue(mockActualizado);

      await updateResponsable(req, res);

      expect(responsableRepository.updateResponsable).toHaveBeenCalledWith('1', req.body);
      expect(res.json).toHaveBeenCalledWith(mockActualizado);
    });

    test('Debe responder con 500 si falla la actualización', async () => {
      responsableRepository.updateResponsable.mockRejectedValue(new Error('Error al actualizar'));

      await updateResponsable(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al actualizar' });
    });
  });

  describe('deleteResponsable', () => {
    test('Debe eliminar al responsable y retornar un mensaje de confirmación', async () => {
      req.params.id = '5';
      responsableRepository.deleteResponsable.mockResolvedValue(true);

      await deleteResponsable(req, res);

      expect(responsableRepository.deleteResponsable).toHaveBeenCalledWith('5');
      expect(res.json).toHaveBeenCalledWith({ message: 'Responsable eliminado correctamente' });
    });

    test('Debe responder con 500 si falla la eliminación', async () => {
      responsableRepository.deleteResponsable.mockRejectedValue(new Error('Error al eliminar'));

      await deleteResponsable(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al eliminar' });
    });
  });
});