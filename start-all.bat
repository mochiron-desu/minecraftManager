@echo off

REM Start the backend server
start "Backend" cmd /k "cd /d D:\Coding\projects\minecraftManager\backend && npm start"

REM Start the frontend server
start "Frontend" cmd /k "cd /d D:\Coding\projects\minecraftManager\frontend && npm run dev"
