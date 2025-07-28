const WebSocket = require('ws');
const serverManager = require('./serverManager');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      // Add CORS headers for WebSocket connections
      verifyClient: (info) => {
        // Allow connections from any origin for development
        return true;
      }
    });
    this.clients = new Set();
    
    this.setupWebSocket();
    this.setupServerManagerEvents();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log('WebSocket client connected from:', req.socket.remoteAddress);
      console.log('WebSocket headers:', req.headers);
      this.clients.add(ws);

      // Send initial server status
      const status = serverManager.getStatus();
      ws.send(JSON.stringify({
        type: 'serverStatus',
        data: status
      }));

      // Send recent logs
      const logs = serverManager.getLogs(50);
      ws.send(JSON.stringify({
        type: 'consoleLogs',
        data: logs
      }));

      ws.on('close', (code, reason) => {
        console.log('WebSocket client disconnected:', code, reason);
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
    });

    // Add error handling for the WebSocket server itself
    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    console.log('WebSocket server initialized and listening for connections');
  }

  setupServerManagerEvents() {
    // Listen for server status changes
    serverManager.on('statusChanged', (status) => {
      this.broadcast({
        type: 'serverStatus',
        data: { ...serverManager.getStatus(), ...status }
      });
    });

    // Listen for console output
    serverManager.on('consoleOutput', (output) => {
      this.broadcast({
        type: 'consoleOutput',
        data: output
      });
    });

    // Listen for operation progress updates
    serverManager.on('operationProgress', (progress) => {
      this.broadcast({
        type: 'operationProgress',
        data: progress
      });
    });

    // Listen for operation status updates
    serverManager.on('operationStatus', (status) => {
      this.broadcast({
        type: 'operationStatus',
        data: status
      });
    });
  }

  handleMessage(ws, message) {
    switch (message.type) {
      case 'sendCommand':
        if (message.data && message.data.command) {
          const success = serverManager.sendInput(message.data.command);
          ws.send(JSON.stringify({
            type: 'commandResult',
            data: { success, command: message.data.command }
          }));
        }
        break;

      case 'getLogs':
        const logs = serverManager.getLogs(message.data?.limit || 100);
        ws.send(JSON.stringify({
          type: 'consoleLogs',
          data: logs
        }));
        break;

      case 'clearLogs':
        serverManager.clearLogs();
        this.broadcast({
          type: 'logsCleared',
          data: { timestamp: new Date() }
        });
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  getConnectedClientsCount() {
    return this.clients.size;
  }
}

module.exports = WebSocketService; 