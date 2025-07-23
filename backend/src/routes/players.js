const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const authenticateToken = require('../middleware/auth');

router.get('/', playerController.list);
router.post('/kick', authenticateToken, playerController.kick);
router.post('/ban', authenticateToken, playerController.ban);
router.post('/whitelist', authenticateToken, playerController.whitelist);

module.exports = router; 