const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const consoleRoutes = require('./routes/console');
const playerRoutes = require('./routes/players');
const statusRoutes = require('./routes/status');
const rateLimit = require('./middleware/rateLimit');
const validateInput = require('./middleware/validateInput');

const app = express();

app.use(cors());
app.use(express.json());
app.use(rateLimit);

app.use('/api/auth', validateInput, authRoutes);
app.use('/api/console', consoleRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/status', statusRoutes);

// TODO: Add error handling middleware

module.exports = app;
