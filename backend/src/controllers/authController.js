// Auth Controller
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserStore = require('../models/UserStore');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

const authController = {
  async register(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    const existing = UserStore.findUserByUsername(username);
    if (existing) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, passwordHash });
    UserStore.addUser(user);
    res.status(201).json({ message: 'User registered' });
  },
  async login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    const user = UserStore.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  },
};

module.exports = authController; 