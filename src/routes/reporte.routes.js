const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');
const authMiddleware = require('../middlewares/auth.middleware'); 


router.get('/excel-general', authMiddleware, reporteController.descargarExcel);

module.exports = router;