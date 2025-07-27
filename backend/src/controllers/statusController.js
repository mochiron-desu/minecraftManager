const { connectRcon, sendCommand, disconnectRcon } = require('../services/rconService');

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
      let online = 0, max = 0, players = [], raw = response;
      if (match) {
        [, online, max, names] = match;
        if (names && names.trim().length > 0) {
          players = names.split(',').map(name => name.trim()).filter(Boolean);
        }
      }
      // Fetch TPS (tick rate)
      let tps = null;
      try {
        const tpsResp = await sendCommand('forge tps', true); // For Forge servers
        console.log({tpsResp})
        
        // Parse detailed dimensional TPS data
        const lines = tpsResp.split('\n');
        const dimensions = [];
        let overall = null;
        
        for (const line of lines) {
          // Parse dimension-specific TPS data
          const dimMatch = line.match(/Dim ([^:]+):([^)]+)\): Mean tick time: ([\d.]+) ms\. Mean TPS: ([\d.]+)/);
          if (dimMatch) {
            dimensions.push({
              dimension: dimMatch[1] + ':' + dimMatch[2],
              meanTickTime: parseFloat(dimMatch[3]),
              meanTPS: parseFloat(dimMatch[4])
            });
          }
          
          // Parse overall TPS data
          const overallMatch = line.match(/Overall: Mean tick time: ([\d.]+) ms\. Mean TPS: ([\d.]+)/);
          if (overallMatch) {
            overall = {
              meanTickTime: parseFloat(overallMatch[1]),
              meanTPS: parseFloat(overallMatch[2])
            };
          }
        }
        
        if (dimensions.length > 0 || overall) {
          tps = { dimensions, overall };
        } else {
          // Fallback to simple TPS parsing for older formats
          const tpsMatch = tpsResp.match(/Mean tick time: ([\d.]+) ms. Mean TPS: ([\d.]+)/);
          if (tpsMatch) {
            tps = { meanTickTime: parseFloat(tpsMatch[1]), meanTPS: parseFloat(tpsMatch[2]) };
          } else {
            // Try vanilla /tps (for Paper/Spigot)
            const vanillaTpsResp = await sendCommand('tps', true);
            const vanillaTpsMatch = vanillaTpsResp.match(/TPS from last 1m, 5m, 15m: ([\d.]+), ([\d.]+), ([\d.]+)/);
            if (vanillaTpsMatch) {
              tps = {
                last1m: parseFloat(vanillaTpsMatch[1]),
                last5m: parseFloat(vanillaTpsMatch[2]),
                last15m: parseFloat(vanillaTpsMatch[3])
              };
            }
          }
        }
        disconnectRcon();
      } catch (e) {
        tps = null;
        console.log("Error fetching TPS:", e);
      }
      // Fetch RAM usage
      let ram = null;
      try {
        const memResp = await sendCommand('memory', true); // For some modded servers
        // Try to parse memory usage
        const memMatch = memResp.match(/Memory: (\d+) MB \(Allocated\), (\d+) MB \(Used\)/);
        if (memMatch) {
          ram = { allocated: parseInt(memMatch[1]), used: parseInt(memMatch[2]) };
        } else {
          // Try /gc (for Paper/Spigot)
          const gcResp = await sendCommand('gc', true);
          const gcMatch = gcResp.match(/Used: ([\d,]+) MB \(([\d,]+)%\)/);
          if (gcMatch) {
            ram = { used: parseInt(gcMatch[1].replace(/,/g, '')), percent: parseInt(gcMatch[2]) };
          }
        }
        disconnectRcon();
      } catch (e) {
        ram = null;
      }
      // Fetch ping (not a standard command, but try if available)
      let ping = null;
      try {
        const pingResp = await sendCommand('ping', true);
        const pingMatch = pingResp.match(/Pong! ([\d.]+)ms/);
        if (pingMatch) {
          ping = parseFloat(pingMatch[1]);
        }
      } catch (e) {
        ping = null;
      } finally {
        disconnectRcon();
      }
      res.json({
        status: 'online',
        online: Number(online),
        max: Number(max),
        players,
        tps,
        ram,
        ping,
        raw
      });
    } catch (err) {
      res.json({ status: 'offline', error: err.message });
    }
  },
};

module.exports = statusController; 