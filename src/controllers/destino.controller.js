const destinoRepository = require('../repositories/destino.repository');

// Trae todos los destinos registrados
const getDestinos = async (req, res) => {
  try {
    const destinos = await destinoRepository.getAllDestinos();
    
    return res.status(200).json(destinos);
  } catch (error) {
    console.error('Error en getDestinos:', error);
    
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crea un nuevo destino
const createDestino = async (req, res) => {
  try {
    const { descripcion } = req.body;

  
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del destino es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    // Valida si ya existe un destino idéntico
    const existente = await destinoRepository.findByDescripcion(descripcionNormalizada);

    if (existente) {
      // 409 Conflict (A01: Prevención XSS al no reflejar el input ingresado)
      return res.status(409).json({
        message: 'El destino ingresado ya se encuentra registrado.'
      });
    }

    const nuevo = await destinoRepository.createDestino({
      descripcion: descripcionNormalizada
    });

    // 201 Created
    return res.status(201).json(nuevo);

  } catch (error) {
    console.error('Error en createDestino:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualiza un destino existente usando su ID
const updateDestino = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Validación estricta de entero positivo
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del destino es obligatoria y debe ser texto'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length > 255) {
      return res.status(400).json({
        message: 'La descripción no puede superar los 255 caracteres'
      });
    }

    const existente = await destinoRepository.findByDescripcion(descripcionNormalizada);

    if (existente && String(existente.id_destino) !== String(id)) {
      return res.status(409).json({
        message: 'No se puede actualizar. El destino ingresado ya pertenece a otro registro.'
      });
    }

    const actualizado = await destinoRepository.updateDestino(id, {
      descripcion: descripcionNormalizada
    });

    if (!actualizado) {
      return res.status(404).json({ message: 'Destino no encontrado' });
    }

    // 200 OK
    return res.status(200).json(actualizado);

  } catch (error) {
    console.error('Error en updateDestino:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Elimina un destino usando su ID
const deleteDestino = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const eliminado = await destinoRepository.deleteDestino(id);

    if (!eliminado) {
      return res.status(404).json({ message: 'Destino no encontrado' });
    }


    return res.status(200).json({ message: 'Destino eliminado correctamente' });

  } catch (error) {
    console.error('Error en deleteDestino:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getDestinos,
  createDestino,
  updateDestino,
  deleteDestino
};