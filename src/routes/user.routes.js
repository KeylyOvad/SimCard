
const express = require('express');
const router = express.Router();
const { getUsers, createUser, deleteUser } = require('../controllers/user.controller');


router.get('/', getUsers);
router.post('/', createUser); 
router.delete('/:id', deleteUser);

module.exports = router;