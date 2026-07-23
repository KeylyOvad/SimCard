const ubicacionRepository = require('../../src/repositories/ubicacion.repository');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

describe('Pruebas Unitarias - Ubicacion Repository', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUbicaciones', () => {
    test('Debe retornar todas las ubicaciones activas', async () => {
      const mockRows = [
        { id_ubicacion: 1, descripcion: 'Bodega Central' },
        { id_ubicacion: 2, descripcion: 'Sucursal Norte' }
      ];
      db.query.mockResolvedValue([mockRows]);

      const result = await ubicacionRepository.getAllUbicaciones();

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM ubicaciones WHERE deleted_at IS NULL');
      expect(result).toEqual(mockRows);
    });
  });

  describe('createUbicacion', () => {
    test('Debe insertar una ubicación correctamente y retornar el objeto con su insertId', async () => {
      const mockPayload = { descripcion: 'Oficina Postventa' };
      const mockResult = { insertId: 44 };
      db.query.mockResolvedValue([mockResult]);

      const result = await ubicacionRepository.createUbicacion(mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ubicaciones'),
        ['Oficina Postventa']
      );
      expect(result).toEqual({ id_ubicacion: 44, descripcion: 'Oficina Postventa' });
    });
  });

  describe('updateUbicacion', () => {
    test('Debe ejecutar la query de UPDATE y retornar el objeto con el ID enviado', async () => {
      const mockId = '10';
      const mockPayload = { descripcion: 'Bodega Principal (Editada)' };
      db.query.mockResolvedValue([{}]);

      const result = await ubicacionRepository.updateUbicacion(mockId, mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ubicaciones SET descripcion = ?'),
        ['Bodega Principal (Editada)', '10']
      );
      expect(result).toEqual({ id_ubicacion: '10', descripcion: 'Bodega Principal (Editada)' });
    });
  });

  describe('deleteUbicacion', () => {
    test('Debe retornar true si affectedRows es mayor a 0', async () => {
      const mockId = '3';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await ubicacionRepository.deleteUbicacion(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM ubicaciones WHERE id_ubicacion = ?'),
        ['3']
      );
      expect(result).toBe(true);
    });

    test('Debe retornar false si affectedRows es 0', async () => {
      const mockId = '999';
      const mockResult = { affectedRows: 0 };
      db.query.mockResolvedValue([mockResult]);

      const result = await ubicacionRepository.deleteUbicacion(mockId);

      expect(result).toBe(false);
    });
  });

  describe('hardDeleteUbicacion', () => {
    test('Debe ejecutar la query de eliminación física y retornar true si afectó filas', async () => {
      const mockId = '7';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await ubicacionRepository.hardDeleteUbicacion(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM ubicaciones WHERE id_ubicacion = ?'),
        ['7']
      );
      expect(result).toBe(true);
    });
  });
});