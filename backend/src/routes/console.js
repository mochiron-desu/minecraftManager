const express = require('express');
const router = express.Router();
const consoleController = require('../controllers/consoleController');

router.post('/', consoleController.send);

module.exports = router; 