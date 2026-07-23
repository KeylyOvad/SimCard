const estadoRepository = require('../../src/repositories/estado.repository');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

describe('Pruebas Unitarias - Estado Repository', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllEstados', () => {
    test('Debe retornar todos los estados activos', async () => {
      const mockRows = [
        { id_estado: 1, descripcion: 'Disponible' },
        { id_estado: 2, descripcion: 'Asignada' }
      ];
      db.query.mockResolvedValue([mockRows]);

      const result = await estadoRepository.getAllEstados();

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM estados WHERE deleted_at IS NULL');
      expect(result).toEqual(mockRows);
    });
  });

  describe('createEstado', () => {
    test('Debe insertar un estado correctamente y retornar el nuevo objeto con su insertId', async () => {
      const mockPayload = { descripcion: 'De Baja' };
      const mockResult = { insertId: 5 };
      db.query.mockResolvedValue([mockResult]);

      const result = await estadoRepository.createEstado(mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO estados'),
        ['De Baja']
      );
      expect(result).toEqual({ id_estado: 5, descripcion: 'De Baja' });
    });
  });

  describe('updateEstado', () => {
    test('Debe ejecutar la query de UPDATE y retornar el objeto con el ID enviado', async () => {
      const mockId = '2';
      const mockPayload = { descripcion: 'Asignada - En Uso' };
      db.query.mockResolvedValue([{}]);

      const result = await estadoRepository.updateEstado(mockId, mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE estados SET descripcion = ?'),
        ['Asignada - En Uso', '2']
      );
      expect(result).toEqual({ id_estado: '2', descripcion: 'Asignada - En Uso' });
    });
  });

  describe('deleteEstado', () => {
    test('Debe retornar true si affectedRows es mayor a 0', async () => {
      const mockId = '3';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await estadoRepository.deleteEstado(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM estados WHERE id_estado = ?'),
        ['3']
      );
      expect(result).toBe(true);
    });

    test('Debe retornar false si affectedRows es 0', async () => {
      const mockId = '999';
      const mockResult = { affectedRows: 0 };
      db.query.mockResolvedValue([mockResult]);

      const result = await estadoRepository.deleteEstado(mockId);

      expect(result).toBe(false);
    });
  });

  describe('hardDeleteEstado', () => {
    test('Debe ejecutar la query de eliminación física y retornar true si afectó filas', async () => {
      const mockId = '1';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await estadoRepository.hardDeleteEstado(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM estados WHERE id_estado = ?'),
        ['1']
      );
      expect(result).toBe(true);
    });
  });
});