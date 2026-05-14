const express = require('express');
const router = express.Router();
const destinoController = require('../controllers/destino.controller');

router.get('/', destinoController.getDestinos);
router.post('/', destinoController.createDestino);
router.put('/:id', destinoController.updateDestino);
router.delete('/:id', destinoController.deleteDestino);

module.exports = router;