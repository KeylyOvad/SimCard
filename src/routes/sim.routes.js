const express = require('express');
const router = express.Router();

const simController = require('../controllers/sim.controller');

const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, simController.getSims);
router.get('/:id', verificarToken, simController.getSimById);
router.get('/:id/historial', verificarToken, simController.getHistorial);

router.post('/', verificarToken, esAdmin, simController.createSim);
router.put('/:id', verificarToken, esAdmin, simController.updateSim);
router.delete('/:id', verificarToken, esAdmin, simController.deleteSim);

module.exports = router;