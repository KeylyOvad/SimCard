const operadorRepository = require('../../src/repositories/operador.repository');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

describe('Pruebas Unitarias - Operador Repository', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllOperadores', () => {
    test('Debe retornar todos los operadores activos (deleted_at IS NULL)', async () => {
      const mockRows = [
        { id_operador: 1, descripcion: 'Movistar' },
        { id_operador: 2, descripcion: 'Claro' }
      ];
      db.query.mockResolvedValue([mockRows]);

      const result = await operadorRepository.getAllOperadores();

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM operadores WHERE deleted_at IS NULL');
      expect(result).toEqual(mockRows);
    });
  });

  describe('createOperador', () => {
    test('Debe insertar un operador correctamente y retornar el objeto con su insertId', async () => {
      const mockPayload = { descripcion: 'Entel' };
      const mockResult = { insertId: 4 };
      db.query.mockResolvedValue([mockResult]);

      const result = await operadorRepository.createOperador(mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO operadores'),
        ['Entel']
      );
      expect(result).toEqual({ id_operador: 4, descripcion: 'Entel' });
    });
  });

  describe('updateOperador', () => {
    test('Debe ejecutar la query de UPDATE y retornar el objeto con el ID enviado', async () => {
      const mockId = '1';
      const mockPayload = { descripcion: 'Movistar Empresas' };
      db.query.mockResolvedValue([{}]);

      const result = await operadorRepository.updateOperador(mockId, mockPayload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE operadores SET descripcion = ?'),
        ['Movistar Empresas', '1']
      );
      expect(result).toEqual({ id_operador: '1', descripcion: 'Movistar Empresas' });
    });
  });

  describe('deleteOperador', () => {
    test('Debe realizar un Soft Delete (UPDATE deleted_at) y retornar true', async () => {
      const mockId = '2';
      db.query.mockResolvedValue([{}]);

      const result = await operadorRepository.deleteOperador(mockId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE operadores SET deleted_at = NOW() WHERE id_operador = ?'),
        ['2']
      );
      expect(result).toBe(true);
    });
  });
});