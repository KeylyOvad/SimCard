const {
  getSims,
  getSimById,
  createSim,
  updateSim,
  deleteSim,
  getHistorial
} = require('../../src/controllers/sim.controller'); 
const simService = require('../../src/services/sim.service');
const simRepository = require('../../src/repositories/sim.repository'); 
const jwt = require('jsonwebtoken');

jest.mock('../../src/services/sim.service');
jest.mock('../../src/repositories/sim.repository', () => ({ 
  validarIpDuplicadaCrear: jest.fn(),
  validarIpDuplicadaActualizar: jest.fn()
}));
jest.mock('jsonwebtoken');

describe('Pruebas Unitarias - SIM Controller', () => {
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

  describe('getSims', () => {
    test('Debe retornar un arreglo de SIMs con éxito', async () => {
      const mockList = [{ id: 1, numeroSim: '8957' }];
      simService.getSims.mockResolvedValue(mockList);

      await getSims(req, res);

      expect(simService.getSims).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockList);
    });

    test('Debe responder con 500 si falla el servicio', async () => {
      simService.getSims.mockRejectedValue(new Error('Fetch error'));

      await getSims(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getSimById', () => {
    test('Debe retornar la SIM si existe', async () => {
      req.params.id = '10';
      const mockSim = { id: 10, numeroSim: '8957' };
      simService.getSimById.mockResolvedValue(mockSim);

      await getSimById(req, res);

      expect(res.json).toHaveBeenCalledWith(mockSim);
    });

    test('Debe retornar 404 si la SIM no existe', async () => {
      req.params.id = '999';
      simService.getSimById.mockResolvedValue(null);

      await getSimById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'SIM no encontrada' });
    });
  });

  describe('createSim', () => {
    let payloadValido;

    beforeEach(() => {
      payloadValido = {
        numeroSim: '123456', numeroLinea: '300123', tipoSimId: 1, operadorId: 1,
        planId: 1, capacidadId: 1, estadoId: 1, responsableId: 1, ubicacionId: 1,
        destinoId: 1, ip: ['10.0.0.1'], apn: ['vpn.cens.com'], observacion: 'Test'
      };
    });

    test('Debe crear la SIM exitosamente extrayendo el ID del Token JWT', async () => {
      req.headers.authorization = 'Bearer token_valido';
      req.body = { ...payloadValido };
      
      jwt.decode.mockReturnValue({ id: 99 });
      simRepository.validarIpDuplicadaCrear.mockResolvedValue(null);
      simService.createSim.mockResolvedValue({ id: 1, ...payloadValido });

      await createSim(req, res);

      expect(jwt.decode).toHaveBeenCalledWith('token_valido');
      expect(simService.createSim).toHaveBeenCalledWith(expect.objectContaining({
        id_user: 99,
        observacion: 'Test'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debe lanzar error 400 si faltan parámetros estructurales obligatorios', async () => {
      req.body = { numeroSim: '123456' }; 

      await createSim(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Error de validación')
      }));
    });

    test('Debe lanzar error 400 si se detecta una dirección IP duplicada', async () => {
      req.body = { ...payloadValido };
      simRepository.validarIpDuplicadaCrear.mockResolvedValue({ num_linea: '315777' });

      await createSim(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'La dirección IP 10.0.0.1 ya está registrada en la línea N° 315777.'
      });
    });
  });

  describe('updateSim', () => {
    let payloadUpdateValido;

    beforeEach(() => {
      payloadUpdateValido = {
        numeroSim: '123456', numeroLinea: '300123', tipoSimId: 1, operadorId: 1,
        planId: 1, capacidadId: 1, estadoId: 1, responsableId: 1, ubicacionId: 1,
        destinoId: 1, razonModificacion: 'Cambio de responsable técnico'
      };
    });

    test('Debe actualizar la SIM si los parámetros y la razón de cambio son válidos', async () => {
      req.params.id = '10';
      req.body = { ...payloadUpdateValido };
      simRepository.validarIpDuplicadaActualizar.mockResolvedValue(null);
      simService.updateSim.mockResolvedValue({ id: 10, ...payloadUpdateValido });

      await updateSim(req, res);

      expect(res.json).toHaveBeenCalledWith({ id: 10, ...payloadUpdateValido });
    });

    test('Debe lanzar 400 si la razonModificacion está ausente o es menor a 5 caracteres', async () => {
      req.params.id = '10';
      req.body = { ...payloadUpdateValido, razonModificacion: 'abc' }; 

      await updateSim(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteSim', () => {
    test('Debe borrar la SIM y retornar mensaje de éxito', async () => {
      req.params.id = '5';
      simService.deleteSim.mockResolvedValue(true);

      await deleteSim(req, res);

      expect(simService.deleteSim).toHaveBeenCalledWith('5');
      expect(res.json).toHaveBeenCalledWith({ message: 'SIM eliminado correctamente' });
    });
  });

  describe('getHistorial', () => {
    test('Debe retornar la lista de auditoría histórica de la SIM', async () => {
      req.params.id = '12';
      const mockHistorial = [{ id: 1, accion: 'UPDATE' }];
      simService.getHistorial.mockResolvedValue(mockHistorial);

      await getHistorial(req, res);

      expect(simService.getHistorial).toHaveBeenCalledWith('12');
      expect(res.json).toHaveBeenCalledWith(mockHistorial);
    });
  });
});