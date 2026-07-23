const express = require('express');
const router = express.Router();
const ubicacionController = require('../controllers/ubicacion.controller');

const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');
router.get('/', verificarToken, ubicacionController.getUbicaciones);
router.post('/', verificarToken, esAdmin, ubicacionController.createUbicacion);
router.put('/:id', verificarToken, esAdmin, ubicacionController.updateUbicacion);
router.delete('/:id', verificarToken, esAdmin, ubicacionController.deleteUbicacion);

module.exports = router;