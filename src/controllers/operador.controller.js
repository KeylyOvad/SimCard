const operadorRepository = require('../repositories/operador.repository');

// Trae todos los operadores registrados
const getOperadores = async (req, res) => {
  try {
    const operadores = await operadorRepository.getAllOperadores();
    
    return res.status(200).json(operadores);
  } catch (error) {
    console.error('Error al obtener operadores:', error);
   
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crea un nuevo operador
const createOperador = async (req, res) => {
  try {
    const { descripcion } = req.body;

    
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del operador es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    
    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    // Valida si ya existe
    const existente = await operadorRepository.findByDescripcion(descripcionNormalizada);

    if (existente) {
      
      return res.status(409).json({
        message: 'El operador ingresado ya se encuentra registrado.'
      });
    }

    const nuevo = await operadorRepository.createOperador({
      descripcion: descripcionNormalizada
    });

    // 201 Created: CreaciOn exitosa
    return res.status(201).json(nuevo);

  } catch (error) {
    console.error('Error al crear operador:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualiza un operador existente usando su ID
const updateOperador = async (req, res) => {
  try {
    const id = Number(req.params.id);

    
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del operador es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    const existente = await operadorRepository.findByDescripcion(descripcionNormalizada);

    if (existente && String(existente.id_operador) !== String(id)) {
      return res.status(409).json({
        message: 'No se puede actualizar. El operador ingresado ya pertenece a otro registro.'
      });
    }

    const actualizado = await operadorRepository.updateOperador(id, {
      descripcion: descripcionNormalizada
    });

    if (!actualizado) {
      return res.status(404).json({ message: 'Operador no encontrado' });
    }

    
    return res.status(200).json(actualizado);

  } catch (error) {
    console.error('Error al actualizar operador:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Elimina un operador usando su ID
const deleteOperador = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const eliminado = await operadorRepository.deleteOperador(id);

    if (!eliminado) {
      return res.status(404).json({ message: 'Operador no encontrado' });
    }

  
    return res.status(200).json({ message: 'Operador eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar operador:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getOperadores,
  createOperador,
  updateOperador,
  deleteOperador
};