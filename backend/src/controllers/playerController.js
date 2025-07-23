const { connectRcon, sendCommand } = require('../services/rconService');

const rconOptions = {
  host: process.env.RCON_HOST || 'localhost',
  port: process.env.RCON_PORT || 25575,
  password: process.env.RCON_PASSWORD || 'changeme',
};

const playerController = {
  async list(req, res) {
    try {
      await connectRcon(rconOptions);
      const response = await sendCommand('list');
      res.json({ response });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async kick(req, res) {
    const { username, reason } = req.body;
    if (!username) return res.status(400).json({ message: 'Username required' });
    try {
      await connectRcon(rconOptions);
      const cmd = `kick ${username}${reason ? ' ' + reason : ''}`;
      const response = await sendCommand(cmd);
      res.json({ response });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async ban(req, res) {
    const { username, reason } = req.body;
    if (!username) return res.status(400).json({ message: 'Username required' });
    try {
      await connectRcon(rconOptions);
      const cmd = `ban ${username}${reason ? ' ' + reason : ''}`;
      const response = await sendCommand(cmd);
      res.json({ response });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async whitelist(req, res) {
    const { username, action } = req.body;
    if (!username || !['add','remove'].includes(action)) return res.status(400).json({ message: 'Username and valid action required' });
    try {
      await connectRcon(rconOptions);
      const cmd = `whitelist ${action} ${username}`;
      const response = await sendCommand(cmd);
      res.json({ response });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};

module.exports = playerController; 