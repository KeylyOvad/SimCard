const simService = require('../services/sim.service');

const getSims = async (req, res) => {
  try {
  const sims = await simService.getSims();
  res.json(sims);
  } catch (error) {
  console.error('Error al obtener SIMs:', error);
  res.status(500).json({ error: error.message });
  }
};

const createSim = async (req, res) => {
    try {
    const nuevo = await simService.createSim(req.body);
    res.status(201).json(nuevo);
    } catch (error) {
    console.error('Error al crear SIM:', error);
    res.status(500).json({ error: error.message });
    }
};

const updateSim = async (req, res) => {
    try {
    const actualizado = await simService.updateSim(req.params.id, req.body);
    res.json(actualizado);
    } catch (error) {
    console.error('Error al actualizar SIM:', error);
    res.status(500).json({ error: error.message });
    }
};

const deleteSim = async (req, res) => {
    try {
    await simService.deleteSim(req.params.id);
    res.json({ message: 'SIM eliminado correctamente' });
    } catch (error) {
    console.error('Error al eliminar SIM:', error);
    res.status(500).json({ error: error.message });
    }
};

module.exports = {
  getSims,
  createSim,
  updateSim,
  deleteSim

};
