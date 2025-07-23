const { Rcon } = require('rcon-client');

let rcon = null;

async function connectRcon(options) {
  if (rcon && rcon.hasAuthed) return rcon;
  rcon = new Rcon(options);
  await rcon.connect();
  return rcon;
}

async function sendCommand(command) {
  if (!rcon || !rcon.hasAuthed) throw new Error('RCON not connected');
  return await rcon.send(command);
}

async function disconnectRcon() {
  if (rcon) await rcon.end();
  rcon = null;
}

module.exports = { connectRcon, sendCommand, disconnectRcon }; 