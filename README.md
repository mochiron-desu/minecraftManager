# 🎮 Minecraft Manager

A modern, responsive web dashboard for managing Minecraft servers with real-time monitoring, player management, and console access.

## 📋 Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🖥️ **Server Monitoring**
- **Real-time status** monitoring with auto-refresh
- **TPS (Ticks Per Second)** performance tracking with dimensional breakdown
- **Player count** and online player list
- **System resources** monitoring (RAM usage)
- **Server health** indicators with color-coded performance metrics

### 👥 **Player Management**
- **Live player list** with auto-refresh
- **Player actions**: Kick, Ban, Whitelist management
- **Player statistics** and server stats
- **Modern card-based** player interface with avatars

### 💻 **Console Access**
- **Full server console** access via RCON
- **Command history** with navigation (↑/↓ arrows)
- **Quick command buttons** for common operations
- **Output copying** and clearing functionality
- **Real-time command execution**

### 🎨 **Modern UI/UX**
- **Responsive design** that works on desktop, tablet, and mobile
- **Material-UI** theming with dark/light mode support
- **Auto-refresh** with smart caching to reduce API calls
- **Rate limiting** protection with user-friendly error messages
- **Professional dashboard** layout with cards and grids

### 🔒 **Security Features**
- **JWT-based authentication**
- **Rate limiting** with granular controls
- **Input validation** and sanitization
- **Secure RCON** communication


## 🏗️ Architecture


```
minecraftManager/
├── backend/                 # Node.js Express API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── middleware/      # Authentication, rate limiting, validation
│   │   ├── models/          # Data models and user management
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # RCON service and utilities
│   │   └── utils/           # Helper functions
│   ├── data/                # Persistent data storage
│   └── package.json
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── assets/          # Static assets
│   │   └── App.jsx          # Main application component
│   └── package.json
└── start-all.bat           # Windows startup script
```

## 📋 Prerequisites

### System Requirements
- **Node.js** 16.0 or higher
- **npm** 8.0 or higher
- **Minecraft Server** with RCON enabled
- **Windows, macOS, or Linux**

### Minecraft Server Setup
1. **Enable RCON** in your `server.properties`:
   ```properties
   enable-rcon=true
   rcon.password=your_secure_password
   rcon.port=25575
   ```

2. **Restart** your Minecraft server

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/mochiron-desu/minecraftManager.git
cd minecraftManager
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables
Create `.env` files in both backend and frontend directories (see [Configuration](#-configuration) section).

### 5. Start the Application

#### Option A: Using the Batch Script (Windows)
```bash
# From the root directory
start-all.bat
```

#### Option B: Manual Start
```bash
# Terminal 1 - Start Backend
cd backend
npm start

# Terminal 2 - Start Frontend
cd frontend
npm run dev
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# RCON Configuration
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=your_minecraft_rcon_password
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_TITLE=Minecraft Manager

# Development
VITE_DEV_MODE=true
```

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend server port | `3001` | No |
| `JWT_SECRET` | Secret key for JWT tokens | - | **Yes** |
| `RCON_HOST` | Minecraft server hostname | `localhost` | No |
| `RCON_PORT` | RCON port number | `25575` | No |
| `RCON_PASSWORD` | RCON password | - | **Yes** |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` | No |

## 🎯 Usage

### 1. Access the Dashboard
Open your browser and navigate to `http://localhost:5173`

### 2. Initial Setup
- **First time users**: Create an admin account through the console
- **Default credentials**: Use the credentials you set up during installation

### 3. Dashboard Features

#### Status Page
- **Real-time monitoring** of server status
- **TPS performance** metrics with dimensional breakdown
- **Player count** and online players
- **System resources** monitoring

#### Player Management
- **View online players** with real-time updates
- **Execute actions**: Kick, Ban, Whitelist management
- **Player statistics** and server information

#### Console Access
- **Execute server commands** directly
- **View command history** and reuse previous commands
- **Quick commands** for common operations
- **Copy and clear** console output

### 4. API Rate Limiting
The application implements intelligent rate limiting:
- **GET requests**: 300 per 15 minutes
- **POST requests**: 100 per 15 minutes
- **Auth requests**: 10 per 15 minutes

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

### Server Status Endpoints

#### GET `/api/status`
Get current server status and performance metrics.

**Response:**
```json
{
  "status": "online",
  "online": 5,
  "max": 20,
  "players": ["player1", "player2"],
  "tps": {
    "dimensions": [
      {
        "dimension": "minecraft:overworld",
        "meanTickTime": 0.597,
        "meanTPS": 20.000
      }
    ],
    "overall": {
      "meanTickTime": 0.733,
      "meanTPS": 20.000
    }
  },
  "ram": {
    "used": 2048,
    "allocated": 4096
  }
}
```

### Player Management Endpoints

#### GET `/api/players`
Get list of online players.

#### POST `/api/players/kick`
Kick a player from the server.

**Request Body:**
```json
{
  "username": "player1"
}
```

#### POST `/api/players/ban`
Ban a player from the server.

#### POST `/api/players/whitelist`
Manage player whitelist.

**Request Body:**
```json
{
  "username": "player1",
  "action": "add"
}
```

### Console Endpoints

#### POST `/api/console`
Execute a server command.

**Request Body:**
```json
{
  "command": "list"
}
```

**Response:**
```json
{
  "response": "There are 2 of a max of 20 players online: player1, player2"
}
```

## 🛠️ Development

### Project Structure

```
minecraftManager/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   │   ├── authController.js
│   │   │   ├── consoleController.js
│   │   │   ├── playerController.js
│   │   │   └── statusController.js
│   │   ├── middleware/      # Request processing
│   │   │   ├── auth.js
│   │   │   ├── rateLimit.js
│   │   │   └── validateInput.js
│   │   ├── models/          # Data models
│   │   │   ├── User.js
│   │   │   └── UserStore.js
│   │   ├── routes/          # API routes
│   │   │   ├── auth.js
│   │   │   ├── console.js
│   │   │   ├── players.js
│   │   │   └── status.js
│   │   ├── services/        # External services
│   │   │   ├── adminLogger.js
│   │   │   └── rconService.js
│   │   └── utils/           # Helper functions
│   ├── data/                # Data storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main application
│   │   ├── index.css        # Global styles
│   │   └── main.jsx         # Entry point
│   ├── public/              # Static assets
│   └── package.json
└── README.md
```

### Development Commands

#### Backend
```bash
cd backend

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

#### Frontend
```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Style

- **Backend**: ESLint with Node.js best practices
- **Frontend**: ESLint with React best practices
- **Formatting**: Prettier for consistent code style

## 🔧 Troubleshooting

### Common Issues

#### 1. RCON Connection Failed
**Symptoms**: "Server offline" status
**Solutions**:
- Verify RCON is enabled in `server.properties`
- Check RCON password and port
- Ensure firewall allows RCON port
- Restart Minecraft server

#### 2. Rate Limiting Errors
**Symptoms**: "Rate limit exceeded" messages
**Solutions**:
- Wait for rate limit window to reset
- Reduce auto-refresh frequency
- Check for multiple browser tabs

#### 3. Authentication Issues
**Symptoms**: Login failures
**Solutions**:
- Verify JWT_SECRET is set
- Check user credentials
- Clear browser cache and cookies

#### 4. Frontend Not Loading
**Symptoms**: Blank page or connection errors
**Solutions**:
- Verify backend is running on correct port
- Check CORS configuration
- Ensure environment variables are set

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Logs

Backend logs are available in the console. For production, consider using a logging service.

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Code Guidelines
- Follow existing code style
- Add comments for complex logic
- Include error handling
- Write meaningful commit messages
- Test your changes thoroughly

### Testing
- Backend: Unit tests with Jest
- Frontend: Component tests with React Testing Library
- Integration: Manual testing of all features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Material-UI** for the beautiful component library
- **React** for the frontend framework
- **Express.js** for the backend framework
- **Minecraft RCON Protocol** for server communication

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/mochiron-desu/minecraftManager/issues)


---

**Made with ❤️ for the Minecraft community** 