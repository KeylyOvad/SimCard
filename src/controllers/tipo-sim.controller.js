const tipoSimRepository = require('../repositories/tipo-sim.repository');

const getTiposSim = async (req, res) => {
    try {
    const tipos = await tipoSimRepository.getAllTiposSim();
    res.json(tipos);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

const createTipoSim = async (req, res) => {
   try {
    const nuevo = await tipoSimRepository.createTipoSim(req.body);
    res.status(201).json(nuevo);
   } catch (error) {
   res.status(500).json({ error: error.message });
   }
};

const updateTipoSim = async (req, res) => {
    try {
    const actualizado = await tipoSimRepository.updateTipoSim(req.params.id, req.body);
    res.json(actualizado);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

const deleteTipoSim = async (req, res) => {
    try {
    await tipoSimRepository.deleteTipoSim(req.params.id);
    res.json({ message: 'Tipo SIM eliminado correctamente' });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

module.exports = {
  getTiposSim,
  createTipoSim,
  updateTipoSim,
  deleteTipoSim

};
