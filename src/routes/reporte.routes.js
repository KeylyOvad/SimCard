const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');

router.get('/excel-general', reporteController.descargarExcel);

module.exports = router;