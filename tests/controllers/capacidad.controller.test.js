const capacidadController = require('../../src/controllers/capacidad.controller');
const capacidadRepository = require('../../src/repositories/capacidad.repository');


jest.mock('../../src/repositories/capacidad.repository', () => ({
  getAllCapacidades: jest.fn(),
  createCapacidad: jest.fn(),
  updateCapacidad: jest.fn(),
  deleteCapacidad: jest.fn()
}));

describe('Pruebas Unitarias - Capacidad Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  test('getCapacidades debe retornar la lista de capacidades', async () => {
    const listaFalsa = [{ id: 1, descripcion: '10 GB' }];
    capacidadRepository.getAllCapacidades.mockResolvedValueOnce(listaFalsa);

    await capacidadController.getCapacidades(req, res);

    expect(res.json).toHaveBeenCalledWith(listaFalsa);
  });

  test('createCapacidad debe responder con 201 al crear una capacidad', async () => {
    const nuevaCapacidad = { id: 3, descripcion: '100 GB' };
    req.body = { descripcion: '100 GB' };
    capacidadRepository.createCapacidad.mockResolvedValueOnce(nuevaCapacidad);

    await capacidadController.createCapacidad(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(nuevaCapacidad);
  });

  test('updateCapacidad debe retornar el objeto actualizado', async () => {
    const capacidadActualizada = { id: '1', descripcion: '50 GB' };
    req.params.id = '1';
    req.body = { descripcion: '50 GB' };
    capacidadRepository.updateCapacidad.mockResolvedValueOnce(capacidadActualizada);

    await capacidadController.updateCapacidad(req, res);

    expect(res.json).toHaveBeenCalledWith(capacidadActualizada);
  });

  test('deleteCapacidad debe retornar mensaje de confirmación', async () => {
    req.params.id = '1';
    capacidadRepository.deleteCapacidad.mockResolvedValueOnce(true);

    await capacidadController.deleteCapacidad(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Capacidad eliminada correctamente' });
  });
});