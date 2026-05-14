const planesRepository = require('../repositories/planes.repository');

const getPlanes = async (req, res) => {
    try {
    const planes = await planesRepository.getAllPlanes();
    res.json(planes);
   } catch (error) {

     console.error('Error al obtener planes:', error);
     res.status(500).json({ error: error.message });
   }
};

const createPlan = async (req, res) => {
    try {
    const nuevo = await planesRepository.createPlan(req.body);
    res.status(201).json(nuevo);
    } catch (error) {
    console.error('Error al crear plan:', error);
    res.status(500).json({ error: error.message });
    }
};

const updatePlan = async (req, res) => {
    try {
    const actualizado = await planesRepository.updatePlan(req.params.id, req.body);
    res.json(actualizado);
    } catch (error) {
    console.error('Error al actualizar plan:', error);
    res.status(500).json({ error: error.message });
 }

};

const deletePlan = async (req, res) => {
    try {
    await planesRepository.deletePlan(req.params.id);
    res.json({ message: 'Plan eliminado correctamente' });
    } catch (error) {
    console.error('Error al eliminar plan:', error);
    res.status(500).json({ error: error.message });
   }
};

module.exports = {
  getPlanes,
  createPlan,
  updatePlan,
  deletePlan
};
