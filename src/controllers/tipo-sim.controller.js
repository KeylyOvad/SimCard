const tipoSimRepository = require('../repositories/tipo-sim.repository');

// Trae todos los tipos de sim registrados
const getTiposSim = async (req, res) => {
  try {
    const tipos = await tipoSimRepository.getAllTiposSim();
    return res.status(200).json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de SIM:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crea un nuevo tipo de sim
const createTipoSim = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del tipo de SIM es obligatoria y debe ser texto'
      });
    }
    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    // Valida si ya existe un tipo de sim con esa misma descripcion
    const existente = await tipoSimRepository.findByDescripcion(descripcionNormalizada);

    if (existente) {
      return res.status(409).json({
        message: 'El tipo de SIM ingresado ya se encuentra registrado.'
      });
    }

    const nuevo = await tipoSimRepository.createTipoSim({
      descripcion: descripcionNormalizada
    });

    return res.status(201).json(nuevo);

  } catch (error) {
    console.error('Error al crear tipo de SIM:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualiza un tipo de sim existente usando su id
const updateTipoSim = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del tipo de SIM es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    const existente = await tipoSimRepository.findByDescripcion(descripcionNormalizada);

    if (existente && String(existente.id_tiposim) !== String(id)) {
      return res.status(409).json({
        message: 'No se puede actualizar. El tipo de SIM ingresado ya pertenece a otro registro.'
      });
    }

    const actualizado = await tipoSimRepository.updateTipoSim(id, {
      descripcion: descripcionNormalizada
    });

    if (!actualizado) {
      return res.status(404).json({ message: 'Tipo de SIM no encontrado' });
    }

    return res.status(200).json(actualizado);

  } catch (error) {
    console.error('Error al actualizar tipo de SIM:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Elimina un tipo de sim usando su id
const deleteTipoSim = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const eliminado = await tipoSimRepository.deleteTipoSim(id);

    if (!eliminado) {
      return res.status(404).json({ message: 'Tipo de SIM no encontrado' });
    }

    return res.status(200).json({ message: 'Tipo de SIM eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar tipo de SIM:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getTiposSim,
  createTipoSim,
  updateTipoSim,
  deleteTipoSim
};