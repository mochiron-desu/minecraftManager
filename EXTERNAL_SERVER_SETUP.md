# External Minecraft Server Setup

You can place your Minecraft server in any directory on your system. Here's how to configure it:

## Option 1: Absolute Path (Recommended)

Edit your `backend/.env` file and set the absolute path to your server:

```env
# Server Configuration
PORT=3000

# Minecraft Server Configuration
MINECRAFT_SERVER_PATH=C:/Games/Minecraft/ForgeServer
START_SCRIPT=start.bat

# RCON Configuration
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=changeme

# JWT Secret (change this in production!)
JWT_SECRET=your-secret-key-here
```

## Option 2: Relative Path from Backend

If you want to keep it relative to the backend directory:

```env
MINECRAFT_SERVER_PATH=../minecraft-server
# or
MINECRAFT_SERVER_PATH=../../Games/Minecraft/ForgeServer
```

## Example Directory Structures

### Structure 1: Server in Different Drive
```
C:/Games/Minecraft/ForgeServer/
├── start.bat
├── user_jvm_args.txt
├── server.jar
├── server.properties
└── ... (other server files)

D:/Coding/minecraftManager/
├── backend/
├── frontend/
└── README.md
```

### Structure 2: Server in Parent Directory
```
minecraftManager/
├── backend/
├── frontend/
└── README.md

minecraft-server/          # Sibling directory
├── start.bat
├── user_jvm_args.txt
├── server.jar
├── server.properties
└── ... (other server files)
```

### Structure 3: Server in Completely Different Location
```
C:/Users/YourName/Documents/Minecraft/Server/
├── start.bat
├── user_jvm_args.txt
├── server.jar
├── server.properties
└── ... (other server files)

D:/Projects/minecraftManager/
├── backend/
├── frontend/
└── README.md
```

## Configuration Examples

### For Structure 1:
```env
MINECRAFT_SERVER_PATH=C:/Games/Minecraft/ForgeServer
```

### For Structure 2:
```env
MINECRAFT_SERVER_PATH=../minecraft-server
```

### For Structure 3:
```env
MINECRAFT_SERVER_PATH=C:/Users/YourName/Documents/Minecraft/Server
```

## Testing the Configuration

After updating your `.env` file, test the configuration:

```bash
cd backend
node test-server-manager.js
```

You should see:
```
1. Server Configuration:
   Server Path: C:/path/to/your/server
   Start Script: start.bat
   Directory Exists: ✅
   Script Exists: ✅
```

## Important Notes

1. **Path Format**: Use forward slashes (`/`) even on Windows for better compatibility
2. **Permissions**: Ensure the backend has read/write access to the server directory
3. **Working Directory**: The server will run from its own directory, not the backend directory
4. **File Paths**: All server files (logs, world, etc.) will be relative to the server directory

## Troubleshooting

### "Server directory not found" Error
- Check the path spelling and case sensitivity
- Ensure the directory actually exists
- Verify the backend has access permissions

### "Start script not found" Error
- Verify `start.bat` exists in the specified server directory
- Check that the script name matches exactly (case-sensitive)

### Permission Errors
- Run the backend with appropriate permissions
- Ensure the server directory is not read-only
- Check Windows User Account Control (UAC) settings

## Security Considerations

- Keep your server directory secure
- Don't expose sensitive server files through the web interface
- Use strong RCON passwords
- Consider firewall rules for the server ports 