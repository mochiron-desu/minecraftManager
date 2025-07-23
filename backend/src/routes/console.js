const express = require('express');
const router = express.Router();
const consoleController = require('../controllers/consoleController');
const authenticateToken = require('../middleware/auth');

router.post('/', authenticateToken, consoleController.send);

module.exports = router; 