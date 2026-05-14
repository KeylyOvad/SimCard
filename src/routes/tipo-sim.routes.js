const express = require('express');
const router = express.Router();

const tipoSimController = require('../controllers/tipo-sim.controller');
router.get('/', tipoSimController.getTiposSim);
router.post('/', tipoSimController.createTipoSim);
router.put('/:id', tipoSimController.updateTipoSim);
router.delete('/:id', tipoSimController.deleteTipoSim);

module.exports = router;