const ubicacionRepository = require('../repositories/ubicacion.repository');

const getUbicaciones = async (req, res) => {
   try {
   const ubicaciones = await ubicacionRepository.getAllUbicaciones();
   res.json(ubicaciones);
   } catch (error) {
   res.status(500).json({ error: error.message });
   }
};

const createUbicacion = async (req, res) => {
    try {
    const nueva = await ubicacionRepository.createUbicacion(req.body);
    res.status(201).json(nueva);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

const updateUbicacion = async (req, res) => {
    try {
    const actualizada = await ubicacionRepository.updateUbicacion(req.params.id, req.body);
    res.json(actualizada);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

const deleteUbicacion = async (req, res) => {
    try {
    await ubicacionRepository.deleteUbicacion(req.params.id);
    res.json({ message: 'Ubicación eliminada correctamente' });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

module.exports = {
  getUbicaciones,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion
};