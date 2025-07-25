const fs = require('fs');
const path = require('path');
const User = require('./User');

const dataFile = path.join(__dirname, '../../data/users.json');

function loadUsers() {
  if (!fs.existsSync(dataFile)) return [];
  try {
    const raw = fs.readFileSync(dataFile);
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Warning: Failed to load users.json, using empty user list. Error:', err.message);
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
}

function getAllUsers() {
  return loadUsers();
}

function addUser(user) {
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
}

function findUserByUsername(username) {
  const users = loadUsers();
  return users.find(u => u.username === username);
}

module.exports = { getAllUsers, addUser, findUserByUsername, saveUsers }; 