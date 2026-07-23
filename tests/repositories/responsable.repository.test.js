const responsableRepository = require('../../src/repositories/responsable.repository');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

describe('Pruebas Unitarias - Responsable Repository', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllResponsables', () => {
    test('Debe retornar todos los responsables activos', async () => {
      const mockRows = [
        { id_responsable: 1, descripcion: 'Área de TI' },
        { id_responsable: 2, descripcion: 'Logística' }
      ];
      db.query.mockResolvedValue([mockRows]);

      const result = await responsableRepository.getAllResponsables();

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM responsables WHERE deleted_at IS NULL');
      expect(result).toEqual(mockRows);
    });
  });

  describe('createResponsable', () => {
    test('Debe insertar un responsable correctamente y retornar el objeto con su insertId', async () => {
      const mockPayload = { descripcion: 'Recursos Humanos' };
      const mockResult = { insertId: 15 };
      db.query.mockResolvedValue([mockResult]);

      const result = await responsableRepository.createResponsable(mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO responsables'),
        ['Recursos Humanos']
      );
      expect(result).toEqual({ id_responsable: 15, descripcion: 'Recursos Humanos' });
    });
  });

  describe('updateResponsable', () => {
    test('Debe ejecutar la query de UPDATE y retornar el objeto con el ID enviado', async () => {
      const mockId = '4';
      const mockPayload = { descripcion: 'TI - Infraestructura' };
      db.query.mockResolvedValue([{}]);

      const result = await responsableRepository.updateResponsable(mockId, mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE responsables SET descripcion = ?'),
        ['TI - Infraestructura', '4']
      );
      expect(result).toEqual({ id_responsable: '4', descripcion: 'TI - Infraestructura' });
    });
  });

  describe('deleteResponsable', () => {
    test('Debe retornar true si affectedRows es mayor a 0', async () => {
      const mockId = '2';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await responsableRepository.deleteResponsable(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM responsables WHERE id_responsable = ?'),
        ['2']
      );
      expect(result).toBe(true);
    });

    test('Debe retornar false si affectedRows es 0', async () => {
      const mockId = '999';
      const mockResult = { affectedRows: 0 };
      db.query.mockResolvedValue([mockResult]);

      const result = await responsableRepository.deleteResponsable(mockId);

      expect(result).toBe(false);
    });
  });

  describe('hardDeleteResponsable', () => {
    test('Debe ejecutar la query de eliminación física y retornar true si afectó filas', async () => {
      const mockId = '8';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await responsableRepository.hardDeleteResponsable(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM responsables WHERE id_responsable = ?'),
        ['8']
      );
      expect(result).toBe(true);
    });
  });
});