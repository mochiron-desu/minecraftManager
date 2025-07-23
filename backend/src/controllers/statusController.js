const { connectRcon, sendCommand } = require('../services/rconService');

const rconOptions = {
  host: process.env.RCON_HOST || 'localhost',
  port: process.env.RCON_PORT || 25575,
  password: process.env.RCON_PASSWORD || 'changeme',
};

const statusController = {
  async info(req, res) {
    try {
      await connectRcon(rconOptions);
      const response = await sendCommand('list');
      // Accept both 'of a max of' and 'of a max' formats
      const match = response.match(/There are (\d+) of a max(?: of)? (\d+) players online: ?(.*)?/);
      if (match) {
        const [, online, max, names] = match;
        // Clean up player names: handle empty string or whitespace
        let players = [];
        if (names && names.trim().length > 0) {
          players = names.split(',').map(name => name.trim()).filter(Boolean);
        }
        res.json({ status: 'online', online: Number(online), max: Number(max), players });
      } else {
        // Fallback: try to extract numbers, but return empty players
        res.json({ status: 'online', online: 0, max: 0, players: [], raw: response });
      }
    } catch (err) {
      res.json({ status: 'offline', error: err.message });
    }
  },
};

module.exports = statusController; 