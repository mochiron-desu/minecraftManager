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