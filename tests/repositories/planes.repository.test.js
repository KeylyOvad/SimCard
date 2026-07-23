const planesRepository = require('../../src/repositories/planes.repository');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

describe('Pruebas Unitarias - Planes Repository', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPlanes', () => {
    test('Debe retornar todos los planes activos', async () => {
      const mockRows = [
        { id_plan: 1, descripcion: 'Plan Corporativo 5G' },
        { id_plan: 2, descripcion: 'Plan Navegación Ilimitada' }
      ];
      db.query.mockResolvedValue([mockRows]);

      const result = await planesRepository.getAllPlanes();

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM planes WHERE deleted_at IS NULL');
      expect(result).toEqual(mockRows);
    });
  });

  describe('createPlan', () => {
    test('Debe insertar un plan correctamente y retornar el objeto con su insertId', async () => {
      const mockPayload = { descripcion: 'Plan Redes Sociales' };
      const mockResult = { insertId: 10 };
      db.query.mockResolvedValue([mockResult]);

      const result = await planesRepository.createPlan(mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO planes'),
        ['Plan Redes Sociales']
      );
      expect(result).toEqual({ id_plan: 10, descripcion: 'Plan Redes Sociales' });
    });
  });

  describe('updatePlan', () => {
    test('Debe ejecutar la query de UPDATE y retornar el objeto con el ID enviado', async () => {
      const mockId = '3';
      const mockPayload = { descripcion: 'Plan Prepago Modificado' };
      db.query.mockResolvedValue([{}]);

      const result = await planesRepository.updatePlan(mockId, mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE planes'),
        ['Plan Prepago Modificado', '3']
      );
      expect(result).toEqual({ id_plan: '3', descripcion: 'Plan Prepago Modificado' });
    });
  });

  describe('deletePlan', () => {
    test('Debe ejecutar el DELETE físico y retornar true incondicionalmente', async () => {
      const mockId = '5';
      db.query.mockResolvedValue([{}]);

      const result = await planesRepository.deletePlan(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM planes WHERE id_plan = ?'),
        ['5']
      );
      expect(result).toBe(true);
    });
  });

  describe('hardDeletePlan', () => {
    test('Debe ejecutar la query de eliminación física y retornar true si afectó filas', async () => {
      const mockId = '12';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await planesRepository.hardDeletePlan(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM planes WHERE id_plan = ?'),
        ['12']
      );
      expect(result).toBe(true);
    });

    test('Debe retornar false si affectedRows es 0 en hardDeletePlan', async () => {
      const mockId = '999';
      const mockResult = { affectedRows: 0 };
      db.query.mockResolvedValue([mockResult]);

      const result = await planesRepository.hardDeletePlan(mockId);

      expect(result).toBe(false);
    });
  });
});