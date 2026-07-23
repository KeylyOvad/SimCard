const {
  getUbicaciones,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion
} = require('../../src/controllers/ubicacion.controller');
const ubicacionRepository = require('../../src/repositories/ubicacion.repository');

jest.mock('../../src/repositories/ubicacion.repository');

describe('Pruebas Unitarias - Ubicación Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getUbicaciones', () => {
    test('Debe retornar un arreglo con las ubicaciones con éxito', async () => {
      const mockUbicaciones = [
        { id: 1, nombre: 'Sede Central' },
        { id: 2, nombre: 'Bodega Norte' }
      ];
      ubicacionRepository.getAllUbicaciones.mockResolvedValue(mockUbicaciones);

      await getUbicaciones(req, res);

      expect(ubicacionRepository.getAllUbicaciones).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockUbicaciones);
    });

    test('Debe responder con status 500 si falla el repositorio al listar', async () => {
      ubicacionRepository.getAllUbicaciones.mockRejectedValue(new Error('DB Connection Error'));

      await getUbicaciones(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Connection Error' });
    });
  });

  describe('createUbicacion', () => {
    test('Debe crear una ubicación correctamente y retornar status 201', async () => {
      req.body = { nombre: 'Nueva Sucursal' };
      const mockNuevaUbicacion = { id: 3, nombre: 'Nueva Sucursal' };
      ubicacionRepository.createUbicacion.mockResolvedValue(mockNuevaUbicacion);

      await createUbicacion(req, res);

      expect(ubicacionRepository.createUbicacion).toHaveBeenCalledWith({ nombre: 'Nueva Sucursal' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNuevaUbicacion);
    });

    test('Debe responder con status 500 si la creación en repositorio falla', async () => {
      ubicacionRepository.createUbicacion.mockRejectedValue(new Error('Insert Constraint Error'));

      await createUbicacion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insert Constraint Error' });
    });
  });

  describe('updateUbicacion', () => {
    test('Debe actualizar la ubicación con éxito y responder el objeto actualizado', async () => {
      req.params.id = '10';
      req.body = { nombre: 'Sede Central Modificada' };
      const mockActualizado = { id: 10, nombre: 'Sede Central Modificada' }; // ✨ Corregido a masculino
      ubicacionRepository.updateUbicacion.mockResolvedValue(mockActualizado);

      await updateUbicacion(req, res);

      expect(ubicacionRepository.updateUbicacion).toHaveBeenCalledWith('10', { nombre: 'Sede Central Modificada' });
      expect(res.json).toHaveBeenCalledWith(mockActualizado); // ✨ Ahora coincide perfectamente
    });

    test('Debe responder con status 500 si la actualización falla', async () => {
      req.params.id = '10';
      ubicacionRepository.updateUbicacion.mockRejectedValue(new Error('Update Failed'));

      await updateUbicacion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Update Failed' });
    });
  });

  describe('deleteUbicacion', () => {
    test('Debe borrar el registro y retornar el mensaje de éxito exacto', async () => {
      req.params.id = '5';
      ubicacionRepository.deleteUbicacion.mockResolvedValue(true);

      await deleteUbicacion(req, res);

      expect(ubicacionRepository.deleteUbicacion).toHaveBeenCalledWith('5');
      expect(res.json).toHaveBeenCalledWith({ message: 'Ubicación eliminada correctamente' });
    });

    test('Debe responder con status 500 si la eliminación falla', async () => {
      req.params.id = '5';
      ubicacionRepository.deleteUbicacion.mockRejectedValue(new Error('Delete Row Error'));

      await deleteUbicacion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Delete Row Error' });
    });
  });
});