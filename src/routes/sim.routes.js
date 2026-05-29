const express = require('express');
const router = express.Router();

const simController = require('../controllers/sim.controller');

router.get('/', simController.getSims);
router.post('/', simController.createSim);
router.put('/:id', simController.updateSim);
router.delete('/:id', simController.deleteSim);
router.get('/:id', simController.getSimById);
router.get('/:id/historial', simController.getHistorial);

module.exports = router;