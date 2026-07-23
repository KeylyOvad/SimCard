const reporteRepository = require('../../src/repositories/reporte.repository'); 
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

describe('Pruebas Unitarias - Reporte Repository', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obtenerDatosParaExcel', () => {
    test('Debe ejecutar la query compleja con éxito y retornar el listado formateado de líneas', async () => {
      const mockRows = [
        {
          num_linea: '912345678',
          num_sim: '8951100000000000000',
          operador: 'Movistar',
          responsable: 'Juan Pérez',
          destino: 'Nacional',
          estado: 'Activo',
          ubicacion: 'Oficina Central',
          tipo_sim: 'Física',
          plan: 'Plan Datos 10GB',
          capacidad: '10 GB',
          cod_pin: '1234',
          cod_puk: '56789012',
          observacion: 'Línea de prueba sin saltos',
          ips: '192.168.1.50',
          apns: 'gprs.movistar.cl'
        }
      ];

      db.query.mockResolvedValue([mockRows]);

      const result = await reporteRepository.obtenerDatosParaExcel();

      expect(db.query).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockRows);
    });

    test('Debe propagar el error si la consulta a la base de datos falla', async () => {
      db.query.mockRejectedValue(new Error('Syntax Error or Connection Lost'));

      await expect(reporteRepository.obtenerDatosParaExcel()).rejects.toThrow('Syntax Error or Connection Lost');
    });
  });
});