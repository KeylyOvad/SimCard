const { getPlanes, createPlan, updatePlan, deletePlan } = require('../../src/controllers/planes.controller'); // Ajusta el nombre si se llama diferente (ej: plan.controller.js)
const planesRepository = require('../../src/repositories/planes.repository');

jest.mock('../../src/repositories/planes.repository', () => ({
  getAllPlanes: jest.fn(),
  createPlan: jest.fn(),
  updatePlan: jest.fn(),
  deletePlan: jest.fn()
}));

describe('Pruebas Unitarias - Planes Controller', () => {
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

  describe('getPlanes', () => {
    test('Debe retornar la lista completa de planes con un status 200', async () => {
      const mockPlanes = [{ id: 1, nombre: 'Plan Ilimitado 5G' }, { id: 2, nombre: 'Plan Corporativo Básico' }];
      planesRepository.getAllPlanes.mockResolvedValue(mockPlanes);

      await getPlanes(req, res);

      expect(planesRepository.getAllPlanes).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockPlanes);
    });

    test('Debe retornar status 500 cuando el repositorio lanza una excepción', async () => {
      planesRepository.getAllPlanes.mockRejectedValue(new Error('Fallo de conexión a la Base de Datos'));

      await getPlanes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Fallo de conexión a la Base de Datos' });
    });
  });

  describe('createPlan', () => {
    test('Debe crear un plan correctamente y responder con estatus 201 y el objeto creado', async () => {
      req.body = { nombre: 'Plan Prepago Datos', gigas: 10 };
      const mockCreado = { id: 3, nombre: 'Plan Prepago Datos', gigas: 10 };
      planesRepository.createPlan.mockResolvedValue(mockCreado);

      await createPlan(req, res);

      expect(planesRepository.createPlan).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreado);
    });

    test('Debe responder con status 500 si falla la inserción en el repositorio', async () => {
      planesRepository.createPlan.mockRejectedValue(new Error('Restricción de unicidad violada'));

      await createPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Restricción de unicidad violada' });
    });
  });

  describe('updatePlan', () => {
    test('Debe actualizar el plan usando el ID provisto y devolver el registro modificado', async () => {
      req.params.id = '42';
      req.body = { nombre: 'Plan Ilimitado Premium' };
      const mockActualizado = { id: 42, nombre: 'Plan Ilimitado Premium' };
      
      planesRepository.updatePlan.mockResolvedValue(mockActualizado);

      await updatePlan(req, res);

      expect(planesRepository.updatePlan).toHaveBeenCalledWith('42', req.body);
      expect(res.json).toHaveBeenCalledWith(mockActualizado);
    });

    test('Debe retornar status 500 si falla la actualización', async () => {
      planesRepository.updatePlan.mockRejectedValue(new Error('Plan no encontrado o error interno'));

      await updatePlan(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Plan no encontrado o error interno' });
    });
  });

  describe('deletePlan', () => {
    test('Debe eliminar el plan de forma exitosa y retornar un mensaje descriptivo', async () => {
      req.params.id = '7';
      planesRepository.deletePlan.mockResolvedValue(true);

      await deletePlan(req, res);

      expect(planesRepository.deletePlan).toHaveBeenCalledWith('7');
      expect(res.json).toHaveBeenCalledWith({ message: 'Plan eliminado correctamente' });
    });

    test('Debe retornar status 500 si se produce un error al remover el plan', async () => {
      planesRepository.deletePlan.mockRejectedValue(new Error('Llave foránea activa detectada'));

      await deletePlan(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Llave foránea activa detectada' });
    });
  });
});