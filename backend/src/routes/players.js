const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

router.get('/', playerController.list);
router.post('/kick', playerController.kick);
router.post('/ban', playerController.ban);
router.post('/whitelist', playerController.whitelist);

module.exports = router; 