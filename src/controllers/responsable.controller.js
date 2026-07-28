const responsableRepository = require('../repositories/responsable.repository');

// Trae todos los responsables registrados
const getResponsables = async (req, res) => {
  try {
    const responsables = await responsableRepository.getAllResponsables();
    return res.status(200).json(responsables);
  } catch (error) {
    console.error('Error al obtener responsables:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crea un nuevo responsable
const createResponsable = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del responsable es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    // Valida si ya existe un responsable con esa misma descripcion
    const existente = await responsableRepository.findByDescripcion(descripcionNormalizada);

    if (existente) {
      return res.status(409).json({
        message: 'El responsable ingresado ya se encuentra registrado.'
      });
    }

    const nuevo = await responsableRepository.createResponsable({
      descripcion: descripcionNormalizada
    });

    return res.status(201).json(nuevo);

  } catch (error) {
    console.error('Error al crear responsable:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualiza un responsable existente usando su ID
const updateResponsable = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del responsable es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    const existente = await responsableRepository.findByDescripcion(descripcionNormalizada);

    if (existente && String(existente.id_responsable) !== String(id)) {
      return res.status(409).json({
        message: 'No se puede actualizar. El responsable ingresado ya pertenece a otro registro.'
      });
    }

    const actualizado = await responsableRepository.updateResponsable(id, {
      descripcion: descripcionNormalizada
    });

    if (!actualizado) {
      return res.status(404).json({ message: 'Responsable no encontrado' });
    }

    return res.status(200).json(actualizado);

  } catch (error) {
    console.error('Error al actualizar responsable:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Elimina un responsable usando su ID 
const deleteResponsable = async (req, res) => {
  try {
    const id = Number(req.params.id);
     if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const eliminado = await responsableRepository.deleteResponsable(id);

    if (!eliminado) {
      return res.status(404).json({ message: 'Responsable no encontrado' });
    }

    return res.status(200).json({ message: 'Responsable eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar responsable:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getResponsables,
  createResponsable,
  updateResponsable,
  deleteResponsable
};