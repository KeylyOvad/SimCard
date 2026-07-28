const estadoRepository = require('../repositories/estado.repository');

// Trae todos los estados registrados
const getEstados = async (req, res) => {
  try {
    const estados = await estadoRepository.getAllEstados();
    return res.status(200).json(estados);
  } catch (error) {
    console.error('Error en getEstados:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crea un nuevo estado
const createEstado = async (req, res) => {
  try {
    const { descripcion } = req.body;

   
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del estado es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    const existente = await estadoRepository.findByDescripcion(descripcionNormalizada);

    if (existente) {
  
      return res.status(409).json({
        message: 'El estado ingresado ya se encuentra registrado.'
      });
    }

    const nuevo = await estadoRepository.createEstado({
      descripcion: descripcionNormalizada
    });

    
    return res.status(201).json(nuevo);

  } catch (error) {
    console.error('Error en createEstado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualiza un estado existente usando su ID
const updateEstado = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del estado es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    const existente = await estadoRepository.findByDescripcion(descripcionNormalizada);

    if (existente && String(existente.id_estado) !== String(id)) {
      return res.status(409).json({
        message: 'No se puede actualizar. El estado ingresado ya pertenece a otro registro.'
      });
    }

    const actualizado = await estadoRepository.updateEstado(id, {
      descripcion: descripcionNormalizada
    });

    if (!actualizado) {
      return res.status(404).json({ message: 'Estado no encontrado' });
    }

    return res.status(200).json(actualizado);

  } catch (error) {
    console.error('Error en updateEstado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Elimina un estado usando su ID
const deleteEstado = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const eliminado = await estadoRepository.deleteEstado(id);

    if (!eliminado) {
      return res.status(404).json({ message: 'Estado no encontrado' });
    }

    return res.status(200).json({ message: 'Estado eliminado correctamente' });

  } catch (error) {
    console.error('Error en deleteEstado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getEstados,
  createEstado,
  updateEstado,
  deleteEstado
};