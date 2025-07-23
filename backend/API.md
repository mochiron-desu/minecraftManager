# Minecraft Manager Backend API Documentation

## Authentication

### POST /api/auth/register
- Register a new admin user
- Body: `{ "username": "admin", "password": "secret" }`
- Response: `{ "message": "User registered" }`

### POST /api/auth/login
- Login as admin
- Body: `{ "username": "admin", "password": "secret" }`
- Response: `{ "token": "<JWT>" }`

## Console

### POST /api/console
- Send a command to the Minecraft server via RCON
- Requires authentication: Bearer token in Authorization header
- Body: `{ "command": "say Hello" }`
- Response: `{ "response": "..." }`

## Player Management

### GET /api/players
- List online players
- Response: `{ "response": "There are 1 of a max 20 players online: Steve" }`

### POST /api/players/kick
- Kick a player
- Requires authentication: Bearer token in Authorization header
- Body: `{ "username": "Steve", "reason": "Spamming" }`
- Response: `{ "response": "Kicked Steve" }`

### POST /api/players/ban
- Ban a player
- Requires authentication: Bearer token in Authorization header
- Body: `{ "username": "Steve", "reason": "Griefing" }`
- Response: `{ "response": "Banned Steve" }`

### POST /api/players/whitelist
- Add or remove a player from the whitelist
- Requires authentication: Bearer token in Authorization header
- Body: `{ "username": "Steve", "action": "add" }` or `{ "username": "Steve", "action": "remove" }`
- Response: `{ "response": "Added Steve to whitelist" }`

## Server Status

### GET /api/status
- Get server status and online players, plus server performance details
- Response: 
```
{
  "status": "online", // or "offline"
  "online": 1,         // number of online players
  "max": 20,           // max players
  "players": ["Steve"],
  "tps": {             // may be null if unavailable
    "meanTickTime": 1.23, // ms, for Forge
    "meanTPS": 20.0       // for Forge
    // or
    // "last1m": 20.0, "last5m": 19.9, "last15m": 19.8 // for Paper/Spigot
  },
  "ram": {             // may be null if unavailable
    "allocated": 2048, // MB, for some modded servers
    "used": 1024,      // MB
    "percent": 50      // % used, for Paper/Spigot (optional)
  },
  "ping": 123.4,       // ms, may be null if unavailable
  "raw": "..."         // raw response from 'list' command
}
``` 