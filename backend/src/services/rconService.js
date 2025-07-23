const { Rcon } = require('rcon-client');

let rcon = null;

async function connectRcon(options) {
  if (rcon && rcon.authenticated) return rcon;
  rcon = new Rcon(options);
  // Add event handlers to clear rcon on disconnect or error
  rcon.on('end', () => {
    rcon = null;
  });
  rcon.on('error', (err) => {
    // Optionally log the error here
    rcon = null;
  });
  await rcon.connect();
  return rcon;
}

async function sendCommand(command) {
  if (!rcon || !rcon.authenticated) throw new Error('RCON not connected');
  return await rcon.send(command);
}

async function disconnectRcon() {
  if (rcon) await rcon.end();
  rcon = null;
}

module.exports = { connectRcon, sendCommand, disconnectRcon }; 