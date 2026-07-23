const express = require('express');
const router = express.Router();

const tipoSimController = require('../controllers/tipo-sim.controller');

const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, tipoSimController.getTiposSim);

router.post('/', verificarToken, esAdmin, tipoSimController.createTipoSim);
router.put('/:id', verificarToken, esAdmin, tipoSimController.updateTipoSim);
router.delete('/:id', verificarToken, esAdmin, tipoSimController.deleteTipoSim);

module.exports = router;