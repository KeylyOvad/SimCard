const { importarExcel } = require('../../src/controllers/carga-excel.controller');
const SimRepository = require('../../src/repositories/sim.repository');
const db = require('../../src/config/db');
const XLSX = require('xlsx');
const jwt = require('jsonwebtoken');


jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

jest.mock('../../src/repositories/sim.repository', () => ({
  buscarSimsMasivo: jest.fn(),
  crear: jest.fn()
}));

jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

describe('Pruebas Unitarias Masivas - Sim Controller (importarExcel)', () => {
  let req, res;

  beforeEach(() => {
    req = {
      file: { buffer: Buffer.from('excel_falso') },
      headers: { authorization: 'Bearer token_falso' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();

    db.query.mockImplementation((queryStr) => {
      if (queryStr.includes('FROM ip')) {
        return Promise.resolve([[{ ip: '192.168.1.1' }]]);
      }
      return Promise.resolve([[{ id: 1 }, { id: 2 }]]);
    });
  });

  
  test('Debe retornar 400 si req.file no está presente', async () => {
    req.file = null;

    await importarExcel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'No se envió archivo' });
  });

  test('Debe retornar 400 si el archivo Excel no contiene filas', async () => {
    XLSX.read.mockReturnValue({ SheetNames: ['Hoja1'], Sheets: {} });
    XLSX.utils.sheet_to_json.mockReturnValue([]);

    await importarExcel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'El archivo está vacío' });
  });

  test('Debe procesar e insertar correctamente una fila con datos válidos', async () => {
    const filaValida = {
      NUM_SIM: '895701001',
      NUM_LINEA: '3001234567',
      ID_OPERADOR: 1,
      ID_ESTADO: 1,
      ID_PLAN: 1,
      ID_CAPACIDAD: 1,
      ID_RESPONSABLE: 1,
      ID_DESTINO: 1,
      ID_UBICACION: 1,
      ID_TIPOSIM: 1,
      COD_PIN: '1234',
      COD_PUK: '12345678',
      ID_IP: '10.0.0.1'
    };

    XLSX.read.mockReturnValue({ SheetNames: ['Hoja1'], Sheets: {} });
    XLSX.utils.sheet_to_json.mockReturnValue([filaValida]);
    jwt.verify.mockReturnValue({ id: 99 }); 

    SimRepository.buscarSimsMasivo.mockResolvedValue([]); 
    SimRepository.crear.mockResolvedValue({ id: 500 }); 

    await importarExcel(req, res);

    expect(SimRepository.crear).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      total: 1,
      guardadas: 1,
      omitidas: 0
    }));
  });

  test('Debe acumular errores si los IDs de catálogos no existen en el sistema', async () => {
    const filaInvalida = {
      NUM_SIM: '', 
      NUM_LINEA: '300111',
      ID_OPERADOR: 999, 
      ID_ESTADO: 1,
      ID_PLAN: 1,
      ID_CAPACIDAD: 1,
      ID_RESPONSABLE: 1,
      ID_DESTINO: 1,
      ID_UBICACION: 1,
      ID_TIPOSIM: 1
    };

    XLSX.read.mockReturnValue({ SheetNames: ['Hoja1'], Sheets: {} });
    XLSX.utils.sheet_to_json.mockReturnValue([filaInvalida]);

    await importarExcel(req, res);

    expect(SimRepository.crear).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      total: 1,
      guardadas: 0,
      omitidas: 1
    }));
  });
});