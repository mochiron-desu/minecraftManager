const { connectRcon, sendCommand, disconnectRcon } = require('../services/rconService');
const serverManager = require('../services/serverManager');

const rconOptions = {
  host: process.env.RCON_HOST || 'localhost',
  port: process.env.RCON_PORT || 25575,
  password: process.env.RCON_PASSWORD || 'changeme',
};

const statusController = {
  async info(req, res) {
    try {
      // First check if our managed server is running
      const serverStatus = serverManager.getStatus();
      
      if (!serverStatus.isRunning) {
        return res.json({ 
          status: 'offline', 
          error: 'Server is not running',
          managed: true,
          serverStatus 
        });
      }

      // Try to connect via RCON to get detailed info
      try {
        await connectRcon(rconOptions);
        const response = await sendCommand('list', true);
        
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
        } catch (e) {
          tps = null;
          console.log("Error fetching TPS:", e);
        }
        
        // RAM usage fetch removed for now - was causing hangs
        let ram = null;
        
        // Ping fetch removed for now - was causing hangs
        let ping = null;
        
        disconnectRcon();
        
        res.json({
          status: 'online',
          online: Number(online),
          max: Number(max),
          players,
          tps,
          ram,
          ping,
          raw,
          managed: true,
          serverStatus
        });
        
      } catch (rconError) {
        // RCON failed but server is running (managed)
        res.json({
          status: 'starting', // Server is starting up
          online: 0,
          max: 0,
          players: [],
          tps: null,
          ram: null,
          ping: null,
          error: 'Server is starting up, RCON not yet available',
          managed: true,
          serverStatus
        });
      }
      
    } catch (err) {
      res.json({ 
        status: 'offline', 
        error: err.message,
        managed: true,
        serverStatus: serverManager.getStatus()
      });
    }
  },
};

module.exports = statusController; 