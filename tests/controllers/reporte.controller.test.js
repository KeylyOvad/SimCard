const { descargarExcel } = require('../../src/controllers/reporte.controller'); 
const reporteRepository = require('../../src/repositories/reporte.repository');
const ExcelJS = require('exceljs');

jest.mock('../../src/repositories/reporte.repository', () => ({
  obtenerDatosParaExcel: jest.fn()
}));

jest.mock('exceljs', () => {
  return {
    Workbook: jest.fn().mockImplementation(() => {
      
      const proxyHandler = {
        get: (target, prop) => {
          if (prop === 'toString') return () => 'activa';
          if (prop === 'write') return jest.fn().mockResolvedValue(true);
          
          if (prop === 'eachCell' || prop === 'forEach') {
            return (options, cb) => {
              const callback = typeof options === 'function' ? options : cb;
              if (callback) {
                callback(new Proxy({ value: 'activa', key: 'num_linea' }, proxyHandler), 1);
                callback(new Proxy({ value: 'activa', key: 'estado' }, proxyHandler), 6);
                callback(new Proxy({ value: 'activa', key: 'observacion' }, proxyHandler), 15);
              }
            };
          }

          if (prop === 'addRow' || prop === 'getRow' || prop === 'getCell') {
            return () => new Proxy({ height: 0, numFmt: '' }, proxyHandler);
          }

          if (prop === 'columns') {
            const colMock = new Proxy({ key: 'num_linea', width: 10 }, proxyHandler);
            const obsMock = new Proxy({ key: 'observacion', width: 10 }, proxyHandler);
            return [colMock, obsMock];
          }

          
          return new Proxy({}, proxyHandler);
        },
        set: () => true
      };

      const mockWorkbook = new Proxy({}, proxyHandler);

      return {
        addWorksheet: jest.fn().mockReturnValue(mockWorkbook),
        xlsx: mockWorkbook
      };
    })
  };
});

describe('Pruebas Unitarias - Reporte Controller (descargarExcel)', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('Debe generar el libro Excel, mapear los datos y setear los headers HTTP correspondientes', async () => {
    const mockDatos = [
      {
        num_linea: '3001234567',
        num_sim: '895701001',
        operador: 'Claro',
        responsable: 'Juan Pérez',
        destino: 'Nodos',
        estado: 'activa',
        ubicacion: 'Cúcuta',
        tipo_sim: 'M2M',
        plan: 'Datos 10GB',
        capacidad: '10GB',
        cod_pin: '1111',
        cod_puk: '22222222',
        ips: '10.0.0.5',
        apns: 'vpn.cens.com.co',
        observacion: 'Línea de pruebas'
      }
    ];

    reporteRepository.obtenerDatosParaExcel.mockResolvedValue(mockDatos);

    await descargarExcel(req, res);

    expect(reporteRepository.obtenerDatosParaExcel).toHaveBeenCalledTimes(1);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename=Reporte_SIMCARDS_CENS.xlsx'
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  test('Debe responder con 500 si el repositorio falla', async () => {
    reporteRepository.obtenerDatosParaExcel.mockRejectedValue(new Error('DB_ERROR'));

    await descargarExcel(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error interno al generar el reporte' });
  });
});