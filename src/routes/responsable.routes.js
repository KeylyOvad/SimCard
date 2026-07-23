const express = require('express');
const router = express.Router();
const responsableController = require('../controllers/responsable.controller');

const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, responsableController.getResponsables);

router.post('/', verificarToken, esAdmin, responsableController.createResponsable);
router.put('/:id', verificarToken, esAdmin, responsableController.updateResponsable);
router.delete('/:id', verificarToken, esAdmin, responsableController.deleteResponsable);

module.exports = router;