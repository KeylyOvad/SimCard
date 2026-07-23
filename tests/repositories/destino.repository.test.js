const destinoRepository = require('../../src/repositories/destino.repository');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

describe('Pruebas Unitarias - Destino Repository', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDestinos', () => {
    test('Debe retornar todos los destinos activos', async () => {
      const mockRows = [
        { id_destino: 1, descripcion: 'América del Norte' },
        { id_destino: 2, descripcion: 'Europa' }
      ];
      db.query.mockResolvedValue([mockRows]);

      const result = await destinoRepository.getAllDestinos();

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM destinos WHERE deleted_at IS NULL');
      expect(result).toEqual(mockRows);
    });
  });

  describe('createDestino', () => {
    test('Debe insertar un destino correctamente y retornar el nuevo objeto con su insertId', async () => {
      const mockPayload = { descripcion: 'Asia de Pacat' };
      const mockResult = { insertId: 50 };
      db.query.mockResolvedValue([mockResult]);

      const result = await destinoRepository.createDestino(mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO destinos'),
        ['Asia de Pacat']
      );
      expect(result).toEqual({ id_destino: 50, descripcion: 'Asia de Pacat' });
    });
  });

  describe('updateDestino', () => {
    test('Debe ejecutar la query de UPDATE y retornar el objeto con el ID enviado', async () => {
      const mockId = '8';
      const mockPayload = { descripcion: 'Latinoamérica' };
      db.query.mockResolvedValue([{}]);

      const result = await destinoRepository.updateDestino(mockId, mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE destinos SET descripcion = ?'),
        ['Latinoamérica', '8']
      );
      expect(result).toEqual({ id_destino: '8', descripcion: 'Latinoamérica' });
    });
  });

  describe('deleteDestino', () => {
    test('Debe retornar true si affectedRows es mayor a 0', async () => {
      const mockId = '3';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await destinoRepository.deleteDestino(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM destinos WHERE id_destino = ?'),
        ['3']
      );
      expect(result).toBe(true);
    });

    test('Debe retornar false si affectedRows es 0', async () => {
      const mockId = '999';
      const mockResult = { affectedRows: 0 };
      db.query.mockResolvedValue([mockResult]);

      const result = await destinoRepository.deleteDestino(mockId);

      expect(result).toBe(false);
    });
  });

  describe('hardDeleteDestino', () => {
    test('Debe ejecutar la query de eliminación física y retornar true si afectó filas', async () => {
      const mockId = '4';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await destinoRepository.hardDeleteDestino(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM destinos WHERE id_destino = ?'),
        ['4']
      );
      expect(result).toBe(true);
    });
  });
});