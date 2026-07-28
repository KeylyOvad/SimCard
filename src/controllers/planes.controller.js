const planesRepository = require('../repositories/planes.repository');

// Trae todos los planes registrados
const getPlanes = async (req, res) => {
  try {
    const planes = await planesRepository.getAllPlanes();
    
    return res.status(200).json(planes);
  } catch (error) {
    console.error('Error al obtener planes:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crea un nuevo plan
const createPlan = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del plan es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    // Valida si ya existe un plan con esa misma descripciOn
    const existente = await planesRepository.findByDescripcion(descripcionNormalizada);

    if (existente) {
     
      return res.status(409).json({
        message: 'El plan ingresado ya se encuentra registrado.'
      });
    }

    const nuevo = await planesRepository.createPlan({
      descripcion: descripcionNormalizada
    });

    return res.status(201).json(nuevo);

  } catch (error) {
    console.error('Error al crear plan:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualiza un plan existente usando su ID
const updatePlan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del plan es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    const existente = await planesRepository.findByDescripcion(descripcionNormalizada);

    if (existente && String(existente.id_plan) !== String(id)) {
      return res.status(409).json({
        message: 'No se puede actualizar. El plan ingresado ya pertenece a otro registro.'
      });
    }

    const actualizado = await planesRepository.updatePlan(id, {
      descripcion: descripcionNormalizada
    });

    if (!actualizado) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

  
    return res.status(200).json(actualizado);

  } catch (error) {
    console.error('Error al actualizar plan:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const deletePlan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const eliminado = await planesRepository.deletePlan(id);

    if (!eliminado) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    // 200 OK
    return res.status(200).json({ message: 'Plan eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar plan:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getPlanes,
  createPlan,
  updatePlan,
  deletePlan
};