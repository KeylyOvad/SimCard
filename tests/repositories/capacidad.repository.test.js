const capacidadRepository = require('../../src/repositories/capacidad.repository');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

describe('Pruebas Unitarias - Capacidad Repository', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCapacidades', () => {
    test('Debe retornar todas las capacidades activas (rows)', async () => {
      const mockRows = [
        { id_capacidad: 1, descripcion: '10 GB' },
        { id_capacidad: 2, descripcion: '20 GB' }
      ];
      
      const result = await capacidadRepository.getAllCapacidades();

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM capacidades WHERE deleted_at IS NULL');
      expect(result).toEqual(mockRows);
    });
  });

  describe('createCapacidad', () => {
    test('Debe insertar una capacidad correctamente y retornar el nuevo objeto con su insertId', async () => {
      const mockPayload = { descripcion: '50 GB' };
      const mockResult = { insertId: 99 };
      db.query.mockResolvedValue([mockResult]);

      const result = await capacidadRepository.createCapacidad(mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO capacidades'),
        ['50 GB']
      );
      expect(result).toEqual({ id_capacidad: 99, descripcion: '50 GB' });
    });
  });

  describe('updateCapacidad', () => {
    test('Debe ejecutar la query de UPDATE y retornar el objeto con el ID enviado', async () => {
      const mockId = '5';
      const mockPayload = { descripcion: 'Unlimited GB' };
      db.query.mockResolvedValue([{}]); 

      const result = await capacidadRepository.updateCapacidad(mockId, mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE capacidades SET descripcion = ?'),
        ['Unlimited GB', '5']
      );
      expect(result).toEqual({ id_capacidad: '5', descripcion: 'Unlimited GB' });
    });
  });

  describe('deleteCapacidad', () => {
    test('Debe retornar true si affectedRows es mayor a 0', async () => {
      const mockId = '12';
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await capacidadRepository.deleteCapacidad(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM capacidades WHERE id_capacidad = ?'),
        ['12']
      );
      expect(result).toBe(true);
    });

    test('Debe retornar false si affectedRows es 0 (no se eliminó nada)', async () => {
      const mockId = '999';
      const mockResult = { affectedRows: 0 };
      db.query.mockResolvedValue([mockResult]);

      const result = await capacidadRepository.deleteCapacidad(mockId);

      expect(result).toBe(false);
    });
  });
});