const capacidadRepository = require('../repositories/capacidad.repository');

// Trae todas las capacidades registradas
const getCapacidades = async (req, res) => {
  try {
    const capacidades = await capacidadRepository.getAllCapacidades();
    res.json(capacidades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crea una nueva capacidad
const createCapacidad = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción de la capacidad es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si ya existe una capacidad con esa misma descripción
    const existente = await capacidadRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (existente) {
      return res.status(400).json({
        message: `La capacidad [${descripcionNormalizada}] ya se encuentra registrada.`
      });
    }

    const nueva = await capacidadRepository.createCapacidad({
      descripcion: descripcionNormalizada
    });

    res.status(201).json(nueva);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualiza una capacidad existente usando su ID
const updateCapacidad = async (req, res) => {
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
        message: 'La descripción de la capacidad es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si el nombre ya pertenece a otra capacidad diferente a la que se edita
    const existente = await capacidadRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (
      existente &&
      String(existente.id_capacidad) !== String(id)
    ) {
      return res.status(400).json({
        message: `No se puede actualizar. La capacidad [${descripcionNormalizada}] ya existe.`
      });
    }

    const actualizada = await capacidadRepository.updateCapacidad(id, {
      descripcion: descripcionNormalizada
    });

    res.json(actualizada);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Elimina una capacidad usando su ID
const deleteCapacidad = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const eliminada = await capacidadRepository.deleteCapacidad(id);

    if (!eliminada) {
      return res.status(404).json({
        message: 'Capacidad no encontrada'
      });
    }

    res.json({
      message: 'Capacidad eliminada correctamente'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCapacidades,
  createCapacidad,
  updateCapacidad,
  deleteCapacidad
};