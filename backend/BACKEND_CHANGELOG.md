# Backend Change Log

## Planned Tasks (Upcoming Features)
- Multi-admin authentication system (register/login, JWT, user model)
- RCON integration service (connect, send commands, handle responses)
- API endpoints: /api/auth, /api/console, /api/players, /api/status
- Player management (list, kick, ban, whitelist)
- Server status/info endpoint
- Admin activity logging (optional)
- Persistent user store (upgradeable to DB)
- Security hardening (rate limiting, input validation)
- API documentation

This file tracks all changes, modules, and features added to the backend.

---

## [2024-06-09] Project Initialization
- Created backend directory
- Initialized Node.js project
- Installed dependencies: express, rcon-client, jsonwebtoken, bcryptjs, cors, dotenv 

## [2024-06-09] Express App & Config
- Set up basic Express app with CORS, JSON parsing, and error handling (src/app.js)
- Created server entry point (src/server.js) to start app and load config from .env
- Added sample environment variables to .env 

## [2024-06-09] Git Ignore
- Added .gitignore to exclude node_modules, .env, logs, and other common files/folders 

## [2024-06-10] Authentication System Implementation Started
- Started implementation of multi-admin authentication system.
- Preparing initial files: user model, auth controller, auth routes. 
- Created initial files: models/User.js, controllers/authController.js, routes/auth.js using standard conventions. 
- Implemented registration and login logic in auth controller, including password hashing (bcryptjs) and JWT issuance (jsonwebtoken). 
- Implemented RCON integration service (connect, send commands, handle responses) in services/rconService.js. 
- Created /api/console endpoint for sending commands to Minecraft server via RCON. 
- Implemented player management endpoints: list, kick, ban, whitelist. 
- Implemented server status/info endpoint. 
- Implemented optional admin activity logging service. 
- Implemented persistent user store using a JSON file, upgradeable to DB. 
- Implemented security hardening: rate limiting and input validation middleware. 
- Created API documentation (API.md) in backend/. 