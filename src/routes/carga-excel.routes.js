const express = require('express');
const router = express.Router();

const upload = require('../middlewares/upload');
const { importarExcel } = require('../controllers/carga-excel.controller');

const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.post(
  '/importar',
  verificarToken,
  esAdmin,
  upload.single('archivo'),
  importarExcel
);

module.exports = router;