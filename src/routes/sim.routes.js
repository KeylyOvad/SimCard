const express = require('express');
const router = express.Router();

const simController = require('../controllers/sim.controller');
router.get('/', simController.getSims);

module.exports = router;
