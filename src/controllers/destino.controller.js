const destinoRepository = require('../repositories/destino.repository');


const getDestinos = async (req, res) => {
    try {
    const destinos = await destinoRepository.getAllDestinos();
    res.json(destinos);

  } catch (error) {
    res.status(500).json({ error: error.message });
   }
};

const createDestino = async (req, res) => {
    try {
    const nuevo = await destinoRepository.createDestino(req.body);
    res.status(201).json(nuevo);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDestino = async (req, res) => {
    try {
    const actualizado = await destinoRepository.updateDestino(req.params.id, req.body);
    res.json(actualizado);
  } catch (error) {

    res.status(500).json({ error: error.message });
  }
};


const deleteDestino = async (req, res) => {
    try {
    await destinoRepository.deleteDestino(req.params.id);
    res.json({ message: 'Destino eliminado correctamente' });
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