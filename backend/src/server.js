require('dotenv').config();
const app = require('./app');
const WebSocketService = require('./services/websocketService');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize WebSocket service
const wsService = new WebSocketService(server);

console.log('WebSocket service initialized');
