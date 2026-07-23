const destinoRepository = require('../repositories/destino.repository');

// Trae todos los destinos registrados
const getDestinos = async (req, res) => {
  try {
    const destinos = await destinoRepository.getAllDestinos();
    res.json(destinos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crea un nuevo destino
const createDestino = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del destino es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si ya existe un destino con esa misma descripción
    const existente = await destinoRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (existente) {
      return res.status(400).json({
        message: `El destino [${descripcionNormalizada}] ya se encuentra registrado.`
      });
    }

    const nuevo = await destinoRepository.createDestino({
      descripcion: descripcionNormalizada
    });

    res.status(201).json(nuevo);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualiza un destino existente usando su id
const updateDestino = async (req, res) => {
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
        message: 'La descripción del destino es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    const existente = await destinoRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (
      existente &&
      String(existente.id_destino) !== String(id)
    ) {
      return res.status(400).json({
        message: `No se puede actualizar. El destino [${descripcionNormalizada}] ya existe.`
      });
    }

    const actualizado = await destinoRepository.updateDestino(id, {
      descripcion: descripcionNormalizada
    });

    res.json(actualizado);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Elimina un destino usando su ID
const deleteDestino = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const eliminado = await destinoRepository.deleteDestino(id);

    if (!eliminado) {
      return res.status(404).json({
        message: 'Destino no encontrado'
      });
    }

    res.json({
      message: 'Destino eliminado correctamente'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDestinos,
  createDestino,
  updateDestino,
  deleteDestino
};
