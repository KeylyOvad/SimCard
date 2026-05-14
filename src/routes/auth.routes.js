const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

console.log("TYPE login:", typeof authController.login);
console.log("TYPE getUserInfo:", typeof authController.getUserInfo);
console.log("TYPE middleware:", typeof authMiddleware);

router.post('/login', authController.login);

router.get('/me', authMiddleware, authController.getUserInfo);

module.exports = router;