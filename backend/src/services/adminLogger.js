const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../../logs/admin.log');

function logAction(admin, action, details = '') {
  const entry = `${new Date().toISOString()} | ${admin} | ${action} | ${details}\n`;
  fs.appendFile(logFile, entry, err => {
    if (err) console.error('Failed to log admin action:', err);
  });
}

module.exports = { logAction }; 