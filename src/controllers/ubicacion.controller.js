const ubicacionRepository = require('../repositories/ubicacion.repository');

// Trae todas las ubicaciones registradas
const getUbicaciones = async (req, res) => {
  try {
    const ubicaciones = await ubicacionRepository.getAllUbicaciones();
    res.json(ubicaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crea una nueva ubicación
const createUbicacion = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción de la ubicación es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si ya existe una ubicación con esa misma descripción
    const existente = await ubicacionRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (existente) {
      return res.status(400).json({
        message: `La ubicación [${descripcionNormalizada}] ya se encuentra registrada.`
      });
    }

    const nueva = await ubicacionRepository.createUbicacion({
      descripcion: descripcionNormalizada
    });

    res.status(201).json(nueva);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualiza una ubicación existente usando su id
const updateUbicacion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción de la ubicación es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si el nombre ya pertenece a otra ubicación diferente a la que se edita
    const existente = await ubicacionRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (
      existente &&
      String(existente.id_ubicacion) !== String(id)
    ) {
      return res.status(400).json({
        message: `No se puede actualizar. La ubicación [${descripcionNormalizada}] ya existe.`
      });
    }

    const actualizada = await ubicacionRepository.updateUbicacion(id, {
      descripcion: descripcionNormalizada
    });

    res.json(actualizada);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Elimina una ubicación usando su id
const deleteUbicacion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const eliminada = await ubicacionRepository.deleteUbicacion(id);

    if (!eliminada) {
      return res.status(404).json({
        message: 'Ubicación no encontrada'
      });
    }

    res.json({
      message: 'Ubicación eliminada correctamente'
    });

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