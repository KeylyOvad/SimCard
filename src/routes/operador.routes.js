const express = require('express');
const router = express.Router();

const operadorController = require('../controllers/operador.controller');

const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, operadorController.getOperadores);       

router.post('/', verificarToken, esAdmin, operadorController.createOperador);     
router.put('/:id', verificarToken, esAdmin, operadorController.updateOperador);   
router.delete('/:id', verificarToken, esAdmin, operadorController.deleteOperador);

module.exports = router;