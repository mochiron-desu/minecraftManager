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
      // Example response: 'There are 1 of a max 20 players online: Steve'
      const match = response.match(/There are (\d+) of a max (\d+) players online: ?(.*)?/);
      if (match) {
        const [, online, max, names] = match;
        res.json({ status: 'online', online: Number(online), max: Number(max), players: names ? names.split(', ') : [] });
      } else {
        res.json({ status: 'online', response });
      }
    } catch (err) {
      res.json({ status: 'offline', error: err.message });
    }
  },
};

module.exports = statusController; 