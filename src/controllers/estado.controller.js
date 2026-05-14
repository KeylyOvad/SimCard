const estadoRepository = require('../repositories/estado.repository');

const getEstados = async (req, res) => {
    try {
    const estados = await estadoRepository.getAllEstados();
    res.json(estados);
 } catch (error) {
    res.status(500).json({ error: error.message });
 }
};

const createEstado = async (req, res) => {
    try {
    const nuevo = await estadoRepository.createEstado(req.body);
    res.status(201).json(nuevo);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateEstado = async (req, res) => {
    try {
    const actualizado = await estadoRepository.updateEstado(req.params.id, req.body);
    res.json(actualizado);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteEstado = async (req, res) => {
    try {
    await estadoRepository.deleteEstado(req.params.id);
    res.json({ message: 'Estado eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getEstados,
  createEstado,
  updateEstado,
  deleteEstado
};