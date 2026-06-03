const express = require('express');
const router = express.Router();
const cargaExcelController = require('../controllers/carga-excel.controller');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// SOLUCIÓN: Quitamos '/carga-excel' de aquí para que no se duplique con el app.use del servidor principal
router.post('/procesar', upload.single('archivoExcel'), cargaExcelController.procesarArchivoSims);

module.exports = router;