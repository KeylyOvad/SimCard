const express = require('express');
const router = express.Router();
const estadoController = require('../controllers/estado.controller');

const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, estadoController.getEstados);

router.post('/', verificarToken, esAdmin, estadoController.createEstado);
router.put('/:id', verificarToken, esAdmin, estadoController.updateEstado);
router.delete('/:id', verificarToken, esAdmin, estadoController.deleteEstado);

module.exports = router;