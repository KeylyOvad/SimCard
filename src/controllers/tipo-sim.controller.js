const tipoSimRepository = require('../repositories/tipo-sim.repository');

// Trae todos los tipos de sim registrados
const getTiposSim = async (req, res) => {
  try {
    const tipos = await tipoSimRepository.getAllTiposSim();
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crea un nuevo tipo de sim
const createTipoSim = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del tipo de SIM es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si ya existe un tipo de SIM con esa misma descripción
    const existente = await tipoSimRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (existente) {
      return res.status(400).json({
        message: `El tipo de SIM [${descripcionNormalizada}] ya se encuentra registrado.`
      });
    }

    const nuevo = await tipoSimRepository.createTipoSim({
      descripcion: descripcionNormalizada
    });

    res.status(201).json(nuevo);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualiza un tipo de SIM existente usando su id
const updateTipoSim = async (req, res) => {
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
        message: 'La descripción del tipo de SIM es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    const existente = await tipoSimRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (
      existente &&
      String(existente.id_tiposim) !== String(id)
    ) {
      return res.status(400).json({
        message: `No se puede actualizar. El tipo de SIM [${descripcionNormalizada}] ya existe.`
      });
    }

    const actualizado = await tipoSimRepository.updateTipoSim(id, {
      descripcion: descripcionNormalizada
    });

    res.json(actualizado);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Elimina un tipo de SIM usando su id
const deleteTipoSim = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const eliminado = await tipoSimRepository.deleteTipoSim(id);

    if (!eliminado) {
      return res.status(404).json({
        message: 'Tipo de SIM no encontrado'
      });
    }

    res.json({
      message: 'Tipo SIM eliminado correctamente'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTiposSim,
  createTipoSim,
  updateTipoSim,
  deleteTipoSim
};
