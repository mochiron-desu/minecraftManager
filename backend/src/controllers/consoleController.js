const { connectRcon, sendCommand, disconnectRcon } = require('../services/rconService');
const serverManager = require('../services/serverManager');
const { logAction } = require('../services/adminLogger');

const rconOptions = {
  host: process.env.RCON_HOST || 'localhost',
  port: process.env.RCON_PORT || 25575,
  password: process.env.RCON_PASSWORD || 'changeme',
};

const consoleController = {
  async send(req, res) {
    const { command } = req.body;
    if (!command) return res.status(400).json({ message: 'Command required' });
    
    try {
      // First try to send via server manager (if server is managed)
      const serverStatus = serverManager.getStatus();
      if (serverStatus.isRunning) {
        const success = serverManager.sendInput(command);
        if (success) {
          logAction(req.user?.username || 'unknown', 'console', command);
          res.json({ response: 'Command sent to server via stdin' });
          return;
        }
      }

      // Fallback to RCON if server manager failed or server not managed
      await connectRcon(rconOptions);
      const response = await sendCommand(command);
      logAction(req.user?.username || 'unknown', 'console', command);
      res.json({ response });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};

module.exports = consoleController; 