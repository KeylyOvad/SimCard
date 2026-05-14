const express = require('express');
const router = express.Router();
const capacidadController = require('../controllers/capacidad.controller');

router.get('/', capacidadController.getCapacidades);
router.post('/', capacidadController.createCapacidad);
router.put('/:id', capacidadController.updateCapacidad);
router.delete('/:id', capacidadController.deleteCapacidad);

module.exports = router;

