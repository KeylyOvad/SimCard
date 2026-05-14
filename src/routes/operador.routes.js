const express = require('express');
const router = express.Router();

const operadorController = require('../controllers/operador.controller');

router.get('/', operadorController.getOperadores);       
router.post('/', operadorController.createOperador);     
router.put('/:id', operadorController.updateOperador);   
router.delete('/:id', operadorController.deleteOperador);

module.exports = router;