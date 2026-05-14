const express = require('express');
const router = express.Router();
const responsableController = require('../controllers/responsable.controller');

router.get('/', responsableController.getResponsables);
router.post('/', responsableController.createResponsable);
router.put('/:id', responsableController.updateResponsable);
router.delete('/:id', responsableController.deleteResponsable);

module.exports = router;