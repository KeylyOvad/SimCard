const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');

const { verificarToken } = require('../middlewares/auth.middleware'); 


router.get('/excel-general', verificarToken, reporteController.descargarExcel);

module.exports = router;