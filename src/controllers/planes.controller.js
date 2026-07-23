const planesRepository = require('../repositories/planes.repository');

// Trae todos los planes registrados
const getPlanes = async (req, res) => {
  try {
    const planes = await planesRepository.getAllPlanes();
    res.json(planes);
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crea un nuevo plan
const createPlan = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del plan es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si ya existe un plan con esa misma descripción
    const existente = await planesRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (existente) {
      return res.status(400).json({
        message: `El plan [${descripcionNormalizada}] ya se encuentra registrado.`
      });
    }

    const nuevo = await planesRepository.createPlan({
      descripcion: descripcionNormalizada
    });

    res.status(201).json(nuevo);

  } catch (error) {
    console.error('Error al crear plan:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualiza un plan existente usando su id
const updatePlan = async (req, res) => {
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
        message: 'La descripción del plan es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si el nombre ya pertenece a otro plan diferente al que estamos editando
    const existente = await planesRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (
      existente &&
      String(existente.id_plan) !== String(id)
    ) {
      return res.status(400).json({
        message: `No se puede actualizar. El plan [${descripcionNormalizada}] ya existe.`
      });
    }

    const actualizado = await planesRepository.updatePlan(id, {
      descripcion: descripcionNormalizada
    });

    res.json(actualizado);

  } catch (error) {
    console.error('Error al actualizar plan:', error);
    res.status(500).json({ error: error.message });
  }
};

// Elimina un plan usando su id
const deletePlan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const eliminado = await planesRepository.deletePlan(id);

    if (!eliminado) {
      return res.status(404).json({
        message: 'Plan no encontrado'
      });
    }

    res.json({
      message: 'Plan eliminado correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar plan:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPlanes,
  createPlan,
  updatePlan,
  deletePlan
};