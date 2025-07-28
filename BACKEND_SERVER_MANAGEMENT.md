# Server Management Features

This document describes the new server management capabilities added to the Minecraft Manager backend.

## Overview

The backend now has the ability to:
- Start and stop the Minecraft server directly
- Capture and stream server console output in real-time
- Manage server state independently of RCON
- Provide WebSocket-based real-time communication

## New Components

### 1. Server Manager (`src/services/serverManager.js`)

The `ServerManager` class handles:
- Starting the Minecraft server process
- Stopping the server (graceful and force)
- Capturing stdout/stderr streams
- Managing server state
- Log buffering and management

**Key Methods:**
- `startServer()` - Starts the Minecraft server
- `stopServer(graceful)` - Stops the server (graceful by default)
- `restartServer()` - Restarts the server
- `getStatus()` - Returns current server status
- `getLogs(limit)` - Returns recent console logs
- `sendInput(command)` - Sends command to server stdin

### 2. WebSocket Service (`src/services/websocketService.js`)

Provides real-time communication for:
- Server status updates
- Console output streaming
- Command execution
- Log management

**Message Types:**
- `serverStatus` - Server running state
- `consoleOutput` - Real-time console logs
- `consoleLogs` - Historical logs
- `commandResult` - Command execution results

### 3. Server Controller (`src/controllers/serverController.js`)

REST API endpoints for server management:
- `GET /api/server/status` - Get server status
- `POST /api/server/start` - Start server
- `POST /api/server/stop` - Stop server
- `POST /api/server/restart` - Restart server
- `GET /api/server/logs` - Get console logs
- `DELETE /api/server/logs` - Clear logs
- `POST /api/server/command` - Send command

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Minecraft Server Configuration
MINECRAFT_SERVER_PATH=./minecraft-server
START_SCRIPT=run.bat

# RCON Configuration (for graceful shutdown)
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=changeme
```

### Server Path Structure

The backend expects the Minecraft server to be in a directory structure like:

```
minecraft-server/
├── run.bat          # Start script
├── server.jar       # Server JAR file
├── server.properties
└── ... (other server files)
```

## Usage

### Starting the Backend

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables in `.env`

3. Start the backend:
   ```bash
   npm start
   ```

### WebSocket Connection

The WebSocket service automatically starts with the HTTP server. Clients can connect to:

```
ws://localhost:3000
```

### API Usage

**Start Server:**
```bash
curl -X POST http://localhost:3000/api/server/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Stop Server:**
```bash
curl -X POST http://localhost:3000/api/server/stop \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"graceful": true}'
```

**Get Status:**
```bash
curl http://localhost:3000/api/server/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Integration

The frontend now includes:

1. **Enhanced Console Page** - Real-time console with WebSocket support
2. **Server Controls** - Start/stop/restart buttons in status page
3. **Live Console Output** - Real-time streaming of server logs
4. **Command History** - Persistent command history
5. **Log Filtering** - Filter by stdout/stderr/input

### WebSocket Message Format

**From Server:**
```json
{
  "type": "consoleOutput",
  "data": {
    "type": "stdout",
    "data": "Server started successfully",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "id": 1234567890
  }
}
```

**To Server:**
```json
{
  "type": "sendCommand",
  "data": {
    "command": "list"
  }
}
```

## Error Handling

The system includes comprehensive error handling:

- **Server Start Failures** - Invalid paths, missing scripts
- **Process Management** - Graceful shutdown, force kill
- **WebSocket Disconnections** - Automatic reconnection
- **RCON Failures** - Fallback to process management

## Security

- All server management endpoints require authentication
- Commands are logged for audit purposes
- Server process runs with appropriate permissions
- WebSocket connections are validated

## Monitoring

The system provides:
- Real-time server status
- Process uptime tracking
- Console log buffering (configurable size)
- Error logging and reporting

## Future Enhancements

Potential improvements:
- Log persistence to database
- Scheduled server restarts
- Performance monitoring
- Backup management
- Plugin management
- Multiple server support 