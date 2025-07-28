const serverManager = require('../services/serverManager');
const { logAction } = require('../services/adminLogger');

const serverController = {
  async getStatus(req, res) {
    try {
      const status = serverManager.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async startServer(req, res) {
    try {
      const result = await serverManager.startServer();
      logAction(req.user?.username || 'unknown', 'server', 'start');
      res.json({ success: true, message: 'Server starting...', ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async stopServer(req, res) {
    try {
      const { graceful = true } = req.body;
      const result = await serverManager.stopServer(graceful);
      logAction(req.user?.username || 'unknown', 'server', `stop (${graceful ? 'graceful' : 'force'})`);
      res.json({ success: true, message: 'Server stopping...', ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async restartServer(req, res) {
    try {
      const result = await serverManager.restartServer();
      logAction(req.user?.username || 'unknown', 'server', 'restart');
      res.json({ success: true, message: 'Server restarting...', ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getLogs(req, res) {
    try {
      const { limit = 100 } = req.query;
      const logs = serverManager.getLogs(parseInt(limit));
      res.json({ logs });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async clearLogs(req, res) {
    try {
      serverManager.clearLogs();
      logAction(req.user?.username || 'unknown', 'server', 'clear logs');
      res.json({ success: true, message: 'Logs cleared' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async sendCommand(req, res) {
    try {
      const { command } = req.body;
      if (!command) {
        return res.status(400).json({ error: 'Command is required' });
      }

      const success = serverManager.sendInput(command);
      if (success) {
        logAction(req.user?.username || 'unknown', 'console', command);
        res.json({ success: true, message: 'Command sent to server' });
      } else {
        res.status(400).json({ error: 'Server is not running' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = serverController; 