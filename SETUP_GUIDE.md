# Setup Guide for Forge Minecraft Server

## Environment Configuration

Create a `.env` file in the `backend` directory with the following configuration:

```env
# Server Configuration
PORT=3000

# Minecraft Server Configuration
MINECRAFT_SERVER_PATH=./minecraft-server
START_SCRIPT=start.bat

# RCON Configuration
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=changeme

# JWT Secret (change this in production!)
JWT_SECRET=your-secret-key-here
```

## Directory Structure

Your project should look like this:

```
minecraftManager/
├── backend/
│   ├── .env                    # Create this file
│   ├── src/
│   └── package.json
├── frontend/
├── minecraft-server/           # Your Forge server directory
│   ├── start.bat              # Your existing start script
│   ├── user_jvm_args.txt
│   ├── server.jar
│   ├── server.properties
│   └── ... (other server files)
└── README.md
```

## Server Properties Configuration

Make sure your `minecraft-server/server.properties` has RCON enabled:

```properties
# RCON Configuration
enable-rcon=true
rcon.password=changeme
rcon.port=25575
```

## Testing the Setup

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start the Backend:**
   ```bash
   npm start
   ```

3. **Test Server Manager:**
   ```bash
   node test-server-manager.js
   ```

4. **Start the Frontend:**
   ```bash
   cd ../frontend
   npm run dev
   ```

## Features Available

### Backend Features
- ✅ Server start/stop/restart via `start.bat`
- ✅ Real-time console output capture
- ✅ WebSocket streaming
- ✅ RCON integration for graceful shutdown
- ✅ Process management and monitoring

### Frontend Features
- ✅ Enhanced console with real-time logs
- ✅ Server control buttons
- ✅ Command history
- ✅ Log filtering
- ✅ WebSocket connection status

## Troubleshooting

### Common Issues

1. **"Start script not found" error:**
   - Check that `MINECRAFT_SERVER_PATH` points to the correct directory
   - Verify `start.bat` exists in the server directory

2. **RCON connection failed:**
   - Ensure RCON is enabled in `server.properties`
   - Check RCON password matches in `.env`
   - Verify RCON port is not blocked by firewall

3. **WebSocket connection failed:**
   - Check that the backend is running on the correct port
   - Verify CORS settings if accessing from different domain

4. **Java not found:**
   - Ensure Amazon Corretto JDK 17 is installed
   - Check the path in `start.bat` matches your Java installation

### Testing Commands

Test the server manager without starting the actual server:

```bash
cd backend
node -e "
const serverManager = require('./src/services/serverManager');
console.log('Status:', serverManager.getStatus());
console.log('Logs:', serverManager.getLogs(5));
"
```

## Security Notes

- Change the default RCON password
- Use a strong JWT secret in production
- Consider firewall rules for RCON port
- Regularly update Forge and mods

## Next Steps

1. Configure your `.env` file
2. Test the server manager
3. Start the backend and frontend
4. Try the enhanced console features
5. Test server start/stop functionality 