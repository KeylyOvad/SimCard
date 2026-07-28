const capacidadRepository = require('../repositories/capacidad.repository');

// Trae todas las capacidades registradas
const getCapacidades = async (req, res) => {
  try {
    const capacidades = await capacidadRepository.getAllCapacidades();
    return res.status(200).json(capacidades);
  } catch (error) {
    console.error('Error en getCapacidades:', error); 
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crea una nueva capacidad
const createCapacidad = async (req, res) => {
  try {
    const { descripcion } = req.body;

    // Validación de tipo y contenido
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción de la capacidad es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

  
    const existente = await capacidadRepository.findByDescripcion(descripcionNormalizada);

    if (existente) {
      
      return res.status(409).json({
        message: 'La capacidad ingresada ya se encuentra registrada.'
      });
    }

    const nueva = await capacidadRepository.createCapacidad({
      descripcion: descripcionNormalizada
    });

    return res.status(201).json(nueva);

  } catch (error) {
    console.error('Error en createCapacidad:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualiza una capacidad existente usando su ID
const updateCapacidad = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Validar entero positivo
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción de la capacidad es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    const existente = await capacidadRepository.findByDescripcion(descripcionNormalizada);

    if (existente && String(existente.id_capacidad) !== String(id)) {
      return res.status(409).json({
        message: 'No se puede actualizar. La capacidad ingresada ya pertenece a otro registro.'
      });
    }

    const actualizada = await capacidadRepository.updateCapacidad(id, {
      descripcion: descripcionNormalizada
    });

    if (!actualizada) {
      return res.status(404).json({ message: 'Capacidad no encontrada' });
    }

    return res.status(200).json(actualizada);

  } catch (error) {
    console.error('Error en updateCapacidad:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Elimina una capacidad usando su ID
const deleteCapacidad = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const eliminada = await capacidadRepository.deleteCapacidad(id);

    if (!eliminada) {
      return res.status(404).json({ message: 'Capacidad no encontrada' });
    }

    return res.status(200).json({ message: 'Capacidad eliminada correctamente' });

  } catch (error) {
    console.error('Error en deleteCapacidad:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getCapacidades,
  createCapacidad,
  updateCapacidad,
  deleteCapacidad
};