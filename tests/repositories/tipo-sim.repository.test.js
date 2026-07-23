const tipoSimRepository = require('../../src/repositories/tipo-sim.repository');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

describe('Pruebas Unitarias - Tipo SIM Repository', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTiposSim', () => {
    test('Debe retornar todos los tipos de SIM activos', async () => {
      const mockRows = [
        { id_tiposim: 1, descripcion: 'Física' },
        { id_tiposim: 2, descripcion: 'eSIM (Virtual)' }
      ];
      db.query.mockResolvedValue([mockRows]);

      const result = await tipoSimRepository.getAllTiposSim();

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM tiposim WHERE deleted_at IS NULL');
      expect(result).toEqual(mockRows);
    });
  });

  describe('createTipoSim', () => {
    test('Debe insertar un tipo de SIM correctamente y retornar el objeto con su insertId', async () => {
      const mockPayload = { descripcion: 'Multi-IMSI' };
      const mockResult = { insertId: 3 };
      db.query.mockResolvedValue([mockResult]);

      const result = await tipoSimRepository.createTipoSim(mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tiposim'),
        ['Multi-IMSI']
      );
      expect(result).toEqual({ id_tiposim: 3, descripcion: 'Multi-IMSI' });
    });
  });

  describe('updateTipoSim', () => {
    test('Debe ejecutar la query de UPDATE y retornar el objeto con el ID enviado', async () => {
      const mockId = '1';
      const mockPayload = { descripcion: 'Física (Nano/Micro)' };
      db.query.mockResolvedValue([{}]);

      const result = await tipoSimRepository.updateTipoSim(mockId, mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tiposim'),
        ['Física (Nano/Micro)', '1']
      );
      expect(result).toEqual({ id_tiposim: '1', descripcion: 'Física (Nano/Micro)' });
    });
  });

  describe('deleteTipoSim', () => {
    test('Debe retornar true si affectedRows es mayor a 0', async () => {
      const mockId = '2';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await tipoSimRepository.deleteTipoSim(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM tiposim WHERE id_tiposim = ?'),
        ['2']
      );
      expect(result).toBe(true);
    });

    test('Debe retornar false si affectedRows es 0', async () => {
      const mockId = '999';
      const mockResult = { affectedRows: 0 };
      db.query.mockResolvedValue([mockResult]);

      const result = await tipoSimRepository.deleteTipoSim(mockId);

      expect(result).toBe(false);
    });
  });

  describe('hardDeleteTipoSim', () => {
    test('Debe ejecutar la query de eliminación física y retornar true si afectó filas', async () => {
      const mockId = '4';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await tipoSimRepository.hardDeleteTipoSim(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM tiposim WHERE id_tiposim = ?'),
        ['4']
      );
      expect(result).toBe(true);
    });
  });
});