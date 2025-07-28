const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get server status
router.get('/status', serverController.getStatus);

// Server control operations
router.post('/start', serverController.startServer);
router.post('/stop', serverController.stopServer);
router.post('/restart', serverController.restartServer);

// Log management
router.get('/logs', serverController.getLogs);
router.delete('/logs', serverController.clearLogs);

// Send command to server
router.post('/command', serverController.sendCommand);

module.exports = router; 