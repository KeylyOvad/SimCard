const simRepository = require('../../src/repositories/sim.repository'); 
const db = require('../../src/config/db');

const mockConnection = {
  beginTransaction: jest.fn(),
  query: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn()
};

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn(() => Promise.resolve(mockConnection))
}));

describe('Pruebas Unitarias - SIM Repository', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('Debe retornar la lista completa de SIMs formateada con sus agrupaciones', async () => {
      const mockRows = [{ id_sim: 1, num_linea: '911111111', ips: '10.0.0.1', apns: 'bam.cl' }];
      db.query.mockResolvedValue([mockRows]);

      const result = await simRepository.getAll();

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRows);
    });
  });

  describe('getById', () => {
    test('Debe mapear correctamente los arreglos de IPs y APNs y retornar el SIM', async () => {
      const mockSimRow = { id_sim: 10, num_linea: '922222222' };
      const mockIpsRows = [{ ip: '192.168.1.1' }, { ip: '192.168.1.2' }];
      const mockApnsRows = [{ apn: 'm2m.operador' }];

      db.query
        .mockResolvedValueOnce([[mockSimRow]])   
        .mockResolvedValueOnce([mockIpsRows])    
        .mockResolvedValueOnce([mockApnsRows]);  

      const result = await simRepository.getById(10);

      expect(result).toEqual({
        id_sim: 10,
        num_linea: '922222222',
        ips: ['192.168.1.1', '192.168.1.2'],
        apns: ['m2m.operador']
      });
    });

    test('Debe retornar null si el SIM base no existe', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await simRepository.getById(999);
      expect(result).toBeNull();
    });
  });

  describe('buscarPorSim', () => {
    test('Debe retornar la fila encontrada o null', async () => {
      const mockRow = { id_sim: 1, num_sim: '8951' };
      db.query.mockResolvedValueOnce([[mockRow]]);

      const result = await simRepository.buscarPorSim('8951');
      expect(result).toEqual(mockRow);
    });
  });

  describe('crear', () => {
    const validData = {
      numeroSim: '890001',
      numeroLinea: '999999',
      tipoSimId: 1,
      operadorId: 2,
      ip: ['10.0.0.2'],
      apn: ['internet']
    };

    test('Debe ejecutar de forma exitosa el flujo completo de creación inicial', async () => {
      mockConnection.query
        .mockResolvedValueOnce([[]]) 
        .mockResolvedValueOnce([{ insertId: 55 }]) 
        .mockResolvedValueOnce([{}]) 
        .mockResolvedValueOnce([{}]) 
        .mockResolvedValueOnce([{}]); 

      const result = await simRepository.crear(validData);

      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(55);
    });

    test('Debe hacer rollback si la IP ya está asignada a otra SIM activa', async () => {
      mockConnection.query.mockResolvedValueOnce([[{ ip: '10.0.0.2' }]]);

      await expect(simRepository.crear(validData)).rejects.toThrow(
        'La IP 10.0.0.2 ya está asignada a otra tarjeta activa.'
      );

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('actualizar', () => {
    const updateData = {
      numeroSim: '890001-M',
      numeroLinea: '999999',
      ip: ['10.0.0.5'],
      razonModificacion: 'Cambio de IP corporativa'
    };

    test('Debe actualizar los campos del SIM, limpiar tablas dependientes y commitear', async () => {
      mockConnection.query
        .mockResolvedValueOnce([[{ id_sim: 1 }]]) 
        .mockResolvedValueOnce([[]]) 
        .mockResolvedValueOnce([{}]) 
        .mockResolvedValueOnce([{}]) 
        .mockResolvedValueOnce([{}]) 
        .mockResolvedValueOnce([{}]) 
        .mockResolvedValueOnce([{}]); 

      const result = await simRepository.actualizar(1, updateData);

      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(1);
    });
  });

  describe('eliminar', () => {
    test('Debe ejecutar la query de desactivación masiva e inhabilitación temporal', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);
      const result = await simRepository.eliminar(5);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result[0].affectedRows).toBe(1);
    });
  });

  describe('getHistorial', () => {
    test('Debe retornar las filas de modificaciones de la SIM', async () => {
      const mockHistory = [{ razon: 'REGISTRO INICIAL' }];
      db.query.mockResolvedValue([mockHistory]);

      const result = await simRepository.getHistorial(1);
      expect(result).toEqual(mockHistory);
    });

    test('Debe capturar errores, logearlos por consola y propagarlos', async () => {
      const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => {});
      db.query.mockRejectedValue(new Error('Fatal Connection'));

      await expect(simRepository.getHistorial(1)).rejects.toThrow('Fatal Connection');
      expect(spyConsole).toHaveBeenCalled();
      spyConsole.mockRestore();
    });
  });

  describe('Metodos de validación adicionales', () => {
    test('buscarSimsMasivo devuelve arreglos de coincidencia', async () => {
      db.query.mockResolvedValue([[{ num_sim: '111' }]]);
      const result = await simRepository.buscarSimsMasivo(['111']);
      expect(result).toEqual([{ num_sim: '111' }]);
    });

    test('validarIpDuplicadaCrear e validarIpDuplicadaActualizar', async () => {
      db.query.mockResolvedValue([[{ id_sim: 1, num_linea: '99' }]]);
      const resCrear = await simRepository.validarIpDuplicadaCrear('10.0.0.1');
      expect(resCrear).toEqual({ id_sim: 1, num_linea: '99' });

      const resAct = await simRepository.validarIpDuplicadaActualizar('10.0.0.1', 1);
      expect(resAct).toEqual({ id_sim: 1, num_linea: '99' });
    });
  });
});