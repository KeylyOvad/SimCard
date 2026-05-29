const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');
// const authMiddleware = require('../middlewares/auth.middleware'); // Opcional si quieres seguridad

router.get('/excel-general', reporteController.descargarExcel);

module.exports = router;