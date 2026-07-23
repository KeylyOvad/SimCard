const {
  getTiposSim,
  createTipoSim,
  updateTipoSim,
  deleteTipoSim
} = require('../../src/controllers/tipo-sim.controller'); 
const tipoSimRepository = require('../../src/repositories/tipo-sim.repository'); 

jest.mock('../../src/repositories/tipo-sim.repository');

describe('Pruebas Unitarias - Tipo SIM Controller', () => {
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

  describe('getTiposSim', () => {
    test('Debe retornar un arreglo con los tipos de SIM con éxito', async () => {
      const mockList = [
        { id: 1, nombre: 'Física / Micro SIM' },
        { id: 2, nombre: 'eSIM / Virtual' }
      ];
      tipoSimRepository.getAllTiposSim.mockResolvedValue(mockList);

      await getTiposSim(req, res);

      expect(tipoSimRepository.getAllTiposSim).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockList);
    });

    test('Debe responder con 500 si falla el repositorio al listar', async () => {
      tipoSimRepository.getAllTiposSim.mockRejectedValue(new Error('DB Error'));

      await getTiposSim(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });

  describe('createTipoSim', () => {
    test('Debe crear el tipo de SIM correctamente y retornar 201', async () => {
      req.body = { nombre: 'M2M Industrial' };
      const mockCreado = { id: 3, nombre: 'M2M Industrial' };
      tipoSimRepository.createTipoSim.mockResolvedValue(mockCreado);

      await createTipoSim(req, res);

      expect(tipoSimRepository.createTipoSim).toHaveBeenCalledWith({ nombre: 'M2M Industrial' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreado);
    });

    test('Debe responder con 500 si la creación falla', async () => {
      tipoSimRepository.createTipoSim.mockRejectedValue(new Error('Insert failed'));

      await createTipoSim(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insert failed' });
    });
  });


  describe('updateTipoSim', () => {
    test('Debe actualizar el tipo de SIM con éxito', async () => {
      req.params.id = '2';
      req.body = { nombre: 'eSIM Modificada' };
      const mockActualizado = { id: 2, nombre: 'eSIM Modificada' };
      tipoSimRepository.updateTipoSim.mockResolvedValue(mockActualizado);

      await updateTipoSim(req, res);

      expect(tipoSimRepository.updateTipoSim).toHaveBeenCalledWith('2', { nombre: 'eSIM Modificada' });
      expect(res.json).toHaveBeenCalledWith(mockActualizado);
    });

    test('Debe responder con 500 si la actualización falla', async () => {
      req.params.id = '2';
      tipoSimRepository.updateTipoSim.mockRejectedValue(new Error('Update failed'));

      await updateTipoSim(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Update failed' });
    });
  });

  describe('deleteTipoSim', () => {
    test('Debe borrar el registro y retornar el mensaje de éxito', async () => {
      req.params.id = '1';
      tipoSimRepository.deleteTipoSim.mockResolvedValue(true);

      await deleteTipoSim(req, res);

      expect(tipoSimRepository.deleteTipoSim).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Tipo SIM eliminado correctamente' });
    });

    test('Debe responder con 500 si la eliminación falla', async () => {
      req.params.id = '1';
      tipoSimRepository.deleteTipoSim.mockRejectedValue(new Error('Delete failed'));

      await deleteTipoSim(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Delete failed' });
    });
  });
});