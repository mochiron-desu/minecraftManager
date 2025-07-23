const { connectRcon, sendCommand, disconnectRcon } = require('../services/rconService');
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