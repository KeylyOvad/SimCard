const ubicacionRepository = require('../repositories/ubicacion.repository');

// Trae todas las ubicaciones registradas
const getUbicaciones = async (req, res) => {
  try {
    const ubicaciones = await ubicacionRepository.getAllUbicaciones();

    return res.status(200).json(ubicaciones);
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crea una nueva ubicacion
const createUbicacion = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción de la ubicación es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    // Valida si ya existe una ubicacion con esa misma descripcion
    const existente = await ubicacionRepository.findByDescripcion(descripcionNormalizada);

    if (existente) {
      return res.status(409).json({
        message: 'La ubicación ingresada ya se encuentra registrada.'
      });
    }

    const nueva = await ubicacionRepository.createUbicacion({
      descripcion: descripcionNormalizada
    });

    return res.status(201).json(nueva);

  } catch (error) {
    console.error('Error al crear ubicación:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualiza una ubicacion existente usando su ID
const updateUbicacion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Validacion estricta de ID entero positivo
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción de la ubicación es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    const existente = await ubicacionRepository.findByDescripcion(descripcionNormalizada);

    if (existente && String(existente.id_ubicacion) !== String(id)) {
      return res.status(409).json({
        message: 'No se puede actualizar. La ubicación ingresada ya pertenece a otro registro.'
      });
    }

    const actualizada = await ubicacionRepository.updateUbicacion(id, {
      descripcion: descripcionNormalizada
    });

    if (!actualizada) {
      return res.status(404).json({ message: 'Ubicación no encontrada' });
    }

    return res.status(200).json(actualizada);

  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Elimina una ubicacion usando su ID 
const deleteUbicacion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const eliminada = await ubicacionRepository.deleteUbicacion(id);

    if (!eliminada) {
      return res.status(404).json({ message: 'Ubicación no encontrada' });
    }

    return res.status(200).json({ message: 'Ubicación eliminada correctamente' });

  } catch (error) {
    console.error('Error al eliminar ubicación:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getUbicaciones,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion
};