const express = require('express');
const router = express.Router();
const capacidadController = require('../controllers/capacidad.controller');

const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, capacidadController.getCapacidades);

router.post('/', verificarToken, esAdmin, capacidadController.createCapacidad);
router.put('/:id', verificarToken, esAdmin, capacidadController.updateCapacidad);
router.delete('/:id', verificarToken, esAdmin, capacidadController.deleteCapacidad);

module.exports = router;