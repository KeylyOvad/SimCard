const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.post('/login', authController.login);

router.get('/me', verificarToken, authController.getUserInfo);

module.exports = router;