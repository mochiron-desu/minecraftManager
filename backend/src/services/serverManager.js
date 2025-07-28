const { spawn, exec } = require('child_process');
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs');

class ServerManager extends EventEmitter {
  constructor() {
    super();
    this.serverProcess = null;
    this.isRunning = false;
    this.serverPath = process.env.MINECRAFT_SERVER_PATH || './minecraft-server';
    this.startScript = process.env.START_SCRIPT || 'start.bat';
    this.logBuffer = [];
    this.maxLogBuffer = 1000; // Keep last 1000 lines
    this.startTime = null;
  }

  async startServer() {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    try {
      const scriptPath = path.join(this.serverPath, this.startScript);
      
      // Check if the start script exists
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Start script not found: ${scriptPath}`);
      }

      // Check if server directory exists
      if (!fs.existsSync(this.serverPath)) {
        throw new Error(`Server directory not found: ${this.serverPath}`);
      }

      console.log(`Starting server from: ${this.serverPath}`);
      console.log(`Using start script: ${scriptPath}`);

      // Start the server process
      this.serverProcess = spawn(scriptPath, [], {
        cwd: this.serverPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        windowsHide: true,
        env: { ...process.env }
      });

      this.isRunning = true;
      this.startTime = Date.now();
      this.emit('statusChanged', { status: 'starting', pid: this.serverProcess.pid });

      console.log(`Server process started with PID: ${this.serverProcess.pid}`);

      // Handle stdout
      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.addLog('stdout', output);
          this.emit('consoleOutput', { type: 'stdout', data: output, timestamp: new Date() });
          console.log(`[STDOUT] ${output}`);
        }
      });

      // Handle stderr
      this.serverProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.addLog('stderr', output);
          this.emit('consoleOutput', { type: 'stderr', data: output, timestamp: new Date() });
          console.log(`[STDERR] ${output}`);
        }
      });

      // Handle process exit
      this.serverProcess.on('close', (code, signal) => {
        console.log(`Server process closed with code: ${code}, signal: ${signal}`);
        this.isRunning = false;
        this.serverProcess = null;
        this.startTime = null;
        this.emit('statusChanged', { 
          status: 'stopped', 
          code, 
          signal,
          message: signal ? `Server stopped by signal: ${signal}` : `Server stopped with code: ${code}`
        });
      });

      // Handle process errors
      this.serverProcess.on('error', (error) => {
        console.error(`Server process error: ${error.message}`);
        this.isRunning = false;
        this.serverProcess = null;
        this.startTime = null;
        this.emit('statusChanged', { 
          status: 'error', 
          error: error.message 
        });
      });

      return { success: true, pid: this.serverProcess.pid };

    } catch (error) {
      console.error(`Failed to start server: ${error.message}`);
      this.isRunning = false;
      this.serverProcess = null;
      this.startTime = null;
      throw error;
    }
  }

  async stopServer(graceful = true) {
    if (!this.isRunning || !this.serverProcess) {
      throw new Error('Server is not running');
    }

    try {
      console.log(`Stopping server (graceful: ${graceful})...`);

      if (graceful) {
        // Try graceful shutdown first via RCON
        const { sendCommand } = require('./rconService');
        try {
          console.log('Attempting graceful shutdown via RCON...');
          await sendCommand('stop');
          // Wait a bit for graceful shutdown
          await new Promise(resolve => setTimeout(resolve, 10000)); // Increased wait time for Forge
        } catch (error) {
          console.log('RCON graceful shutdown failed, using force stop:', error.message);
        }
      }

      // Force kill if still running
      if (this.serverProcess && !this.serverProcess.killed) {
        console.log('Sending SIGTERM to server process...');
        this.serverProcess.kill('SIGTERM');
        
        // Wait for graceful termination
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Force kill if still running
        if (this.serverProcess && !this.serverProcess.killed) {
          console.log('Sending SIGKILL to server process...');
          this.serverProcess.kill('SIGKILL');
        }
      }

      console.log('Server stop completed');
      return { success: true };

    } catch (error) {
      console.error(`Failed to stop server: ${error.message}`);
      throw error;
    }
  }

  async restartServer() {
    try {
      console.log('Restarting server...');
      await this.stopServer();
      // Wait a bit before restarting
      await new Promise(resolve => setTimeout(resolve, 3000));
      return await this.startServer();
    } catch (error) {
      console.error(`Failed to restart server: ${error.message}`);
      throw error;
    }
  }

  getStatus() {
    const uptime = this.startTime ? Date.now() - this.startTime : null;
    return {
      isRunning: this.isRunning,
      pid: this.serverProcess?.pid || null,
      uptime: uptime,
      uptimeFormatted: uptime ? this.formatUptime(uptime) : null,
      serverPath: this.serverPath,
      startScript: this.startScript
    };
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  getLogs(limit = 100) {
    return this.logBuffer.slice(-limit);
  }

  addLog(type, data) {
    const logEntry = {
      type,
      data,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    };

    this.logBuffer.push(logEntry);

    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxLogBuffer) {
      this.logBuffer = this.logBuffer.slice(-this.maxLogBuffer);
    }
  }

  clearLogs() {
    this.logBuffer = [];
  }

  // Send input to the server process
  sendInput(input) {
    if (this.serverProcess && this.isRunning) {
      try {
        this.serverProcess.stdin.write(input + '\n');
        this.addLog('input', input);
        this.emit('consoleOutput', { type: 'input', data: input, timestamp: new Date() });
        console.log(`[INPUT] ${input}`);
        return true;
      } catch (error) {
        console.error(`Failed to send input: ${error.message}`);
        return false;
      }
    }
    return false;
  }

  // Get server info
  getServerInfo() {
    return {
      serverPath: this.serverPath,
      startScript: this.startScript,
      scriptExists: fs.existsSync(path.join(this.serverPath, this.startScript)),
      directoryExists: fs.existsSync(this.serverPath)
    };
  }
}

// Create singleton instance
const serverManager = new ServerManager();

module.exports = serverManager; 