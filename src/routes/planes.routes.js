const express = require('express');
const router = express.Router();

const planesController = require('../controllers/planes.controller');


router.get('/', planesController.getPlanes);        
router.post('/', planesController.createPlan);      
router.put('/:id', planesController.updatePlan);   
router.delete('/:id', planesController.deletePlan);

module.exports = router;


