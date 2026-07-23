const express = require('express');
const router = express.Router();

const planesController = require('../controllers/planes.controller');

const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, planesController.getPlanes);        

router.post('/', verificarToken, esAdmin, planesController.createPlan);      
router.put('/:id', verificarToken, esAdmin, planesController.updatePlan);   
router.delete('/:id', verificarToken, esAdmin, planesController.deletePlan);

module.exports = router;