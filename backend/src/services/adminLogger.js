const fetch = require('node-fetch');
const path = require('path');

const logFile = path.join(__dirname, '../../logs/admin.log');
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

async function logAction(admin, action, details = '') {
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL is not set. Admin actions will not be sent to Discord.');
    return;
  }
  const entry = `${new Date().toISOString()} | ${admin} | ${action} | ${details}`;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: entry })
    });
  } catch (err) {
    console.error('Failed to send admin action to Discord:', err);
  }
}

module.exports = { logAction }; 