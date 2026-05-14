const responsableRepository = require('../repositories/responsable.repository');


const getResponsables = async (req, res) => {
    try {
    const responsables = await responsableRepository.getAllResponsables();
    res.json(responsables);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

const createResponsable = async (req, res) => {
    try {
    const nuevo = await responsableRepository.createResponsable(req.body);
    res.status(201).json(nuevo);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

const updateResponsable = async (req, res) => {
    try {
    const actualizado = await responsableRepository.updateResponsable(req.params.id, req.body);
    res.json(actualizado);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

const deleteResponsable = async (req, res) => {
    try {
    await responsableRepository.deleteResponsable(req.params.id);
    res.json({ message: 'Responsable eliminado correctamente' });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

module.exports = {
  getResponsables,
  createResponsable,
  updateResponsable,
  deleteResponsable
};