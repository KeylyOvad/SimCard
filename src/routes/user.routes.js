const express = require('express');
const router = express.Router();

const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/user.controller');

const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, getUsers);

router.post('/', verificarToken, esAdmin, createUser); 
router.put('/:id', verificarToken, esAdmin, updateUser); 
router.delete('/:id', verificarToken, esAdmin, deleteUser);

module.exports = router;