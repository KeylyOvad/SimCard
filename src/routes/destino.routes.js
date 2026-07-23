const express = require('express');
const router = express.Router();
const destinoController = require('../controllers/destino.controller');

const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, destinoController.getDestinos);

router.post('/', verificarToken, esAdmin, destinoController.createDestino);
router.put('/:id', verificarToken, esAdmin, destinoController.updateDestino);
router.delete('/:id', verificarToken, esAdmin, destinoController.deleteDestino);

module.exports = router;