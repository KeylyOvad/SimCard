const express = require('express');
const router = express.Router();
const estadoController = require('../controllers/estado.controller');

router.get('/', estadoController.getEstados);
router.post('/', estadoController.createEstado);
router.put('/:id', estadoController.updateEstado);
router.delete('/:id', estadoController.deleteEstado);

module.exports = router;

