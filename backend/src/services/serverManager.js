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
      // Emit operation status
      this.emit('operationStatus', { starting: true });
      
      // Emit progress update
      this.emit('operationProgress', { 
        message: 'Initializing server startup...', 
        progress: 10 
      });

      // Resolve the server path to handle relative paths and spaces
      const resolvedServerPath = path.resolve(this.serverPath);
      const scriptPath = path.join(resolvedServerPath, this.startScript);
      
      // Check if the start script exists
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Start script not found: ${scriptPath}`);
      }

      // Check if server directory exists
      if (!fs.existsSync(resolvedServerPath)) {
        throw new Error(`Server directory not found: ${resolvedServerPath}`);
      }

      // Emit progress update
      this.emit('operationProgress', { 
        message: 'Starting server process...', 
        progress: 30 
      });

      // Start the server process with proper handling for paths with spaces
      let spawnOptions;
      
      if (process.platform === 'win32') {
        // Windows: Use cmd /c with the script name only, let cwd handle the path
        const scriptName = path.basename(scriptPath);
        spawnOptions = {
          command: 'cmd',
          args: ['/c', scriptName],
          options: {
            cwd: resolvedServerPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false,
            windowsHide: true,
            env: { ...process.env }
          }
        };
      } else {
        // Unix-like: Use shell with proper quoting
        spawnOptions = {
          command: scriptPath,
          args: [],
          options: {
            cwd: resolvedServerPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            env: { ...process.env }
          }
        };
      }

      this.serverProcess = spawn(
        spawnOptions.command, 
        spawnOptions.args, 
        spawnOptions.options
      );

      // Emit progress update
      this.emit('operationProgress', { 
        message: 'Server process started, waiting for initialization...', 
        progress: 60 
      });

      this.isRunning = true;
      this.startTime = Date.now();
      this.emit('statusChanged', { status: 'starting', pid: this.serverProcess.pid });

      // Handle stdout
      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.addLog('stdout', output);
          this.emit('consoleOutput', { type: 'stdout', data: output, timestamp: new Date() });
          
          // Check for server startup indicators
          if (output.includes('Starting minecraft server') || output.includes('Starting server')) {
            this.emit('operationProgress', { 
              message: 'Minecraft server starting up...', 
              progress: 80 
            });
          }
        }
      });

      // Handle stderr
      this.serverProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.addLog('stderr', output);
          this.emit('consoleOutput', { type: 'stderr', data: output, timestamp: new Date() });
        }
      });

      // Handle process exit
      this.serverProcess.on('close', (code, signal) => {
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

      // Emit final progress update
      this.emit('operationProgress', { 
        message: 'Server startup initiated successfully', 
        progress: 90 
      });

      return { success: true, pid: this.serverProcess.pid };

    } catch (error) {
      console.error(`Failed to start server: ${error.message}`);
      this.isRunning = false;
      this.serverProcess = null;
      this.startTime = null;
      this.emit('operationProgress', { 
        message: `Startup failed: ${error.message}`, 
        progress: 0 
      });
      // Emit operation status end
      this.emit('operationStatus', { starting: false });
      throw error;
    }
  }

  async stopServer(graceful = true) {
    if (!this.isRunning || !this.serverProcess) {
      throw new Error('Server is not running');
    }

    try {
      // Emit operation status
      this.emit('operationStatus', { stopping: true });
      
      // Emit progress update
      this.emit('operationProgress', { 
        message: 'Initiating server shutdown...', 
        progress: 10 
      });

      if (graceful) {
        // Try graceful shutdown first via RCON
        const { connectRcon, sendCommand, disconnectRcon } = require('./rconService');
        try {
          this.emit('operationProgress', { 
            message: 'Attempting graceful shutdown via RCON...', 
            progress: 30 
          });
          
          // Connect to RCON first
          const rconOptions = {
            host: process.env.RCON_HOST || 'localhost',
            port: process.env.RCON_PORT || 25575,
            password: process.env.RCON_PASSWORD || 'changeme',
          };
          
          await connectRcon(rconOptions);
          await sendCommand('stop', true); // Keep connection open
          
          // Wait a bit for graceful shutdown
          this.emit('operationProgress', { 
            message: 'Waiting for graceful shutdown...', 
            progress: 60 
          });
          await new Promise(resolve => setTimeout(resolve, 10000)); // Increased wait time for Forge
          
          // Disconnect RCON
          await disconnectRcon();
        } catch (error) {
          console.log('RCON shutdown failed:', error.message);
          this.emit('operationProgress', { 
            message: 'RCON shutdown failed, using force stop...', 
            progress: 40 
          });
        }
      }

      // Force kill if still running
      if (this.serverProcess && this.serverProcess.pid) {
        this.emit('operationProgress', { 
          message: 'Sending termination signal...', 
          progress: 70 
        });
        
        // Use SIGTERM for graceful termination
        this.serverProcess.kill('SIGTERM');
        
        // Wait for graceful termination with timeout
        let terminated = false;
        const waitForTermination = new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve(false);
          }, 5000);
          
          this.serverProcess.once('exit', (code, signal) => {
            clearTimeout(timeout);
            resolve(true);
          });
        });
        
        terminated = await waitForTermination;
        
        // Force kill if still running
        if (!terminated && this.serverProcess && this.serverProcess.pid) {
          this.emit('operationProgress', { 
            message: 'Force killing server process...', 
            progress: 85 
          });
          
          try {
            this.serverProcess.kill('SIGKILL');
            
            // Wait a bit more for force kill
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.log('Force kill failed:', error.message);
          }
        }
      }

      // Update server state
      this.isRunning = false;
      this.serverProcess = null;
      this.startTime = null;

      this.emit('operationProgress', { 
        message: 'Server shutdown completed', 
        progress: 100 
      });

      // Emit status change
      this.emit('statusChanged', { 
        status: 'stopped', 
        message: 'Server stopped successfully' 
      });

      // Emit operation status end
      this.emit('operationStatus', { stopping: false });
      
      return { success: true };

    } catch (error) {
      console.error(`Failed to stop server: ${error.message}`);
      this.emit('operationProgress', { 
        message: `Stop failed: ${error.message}`, 
        progress: 0 
      });
      // Emit operation status end
      this.emit('operationStatus', { stopping: false });
      throw error;
    }
  }

  async restartServer() {
    try {
      // Emit operation status
      this.emit('operationStatus', { restarting: true });
      
      // Emit progress update
      this.emit('operationProgress', { 
        message: 'Initiating server restart...', 
        progress: 10 
      });
      
      await this.stopServer();
      
      // Emit progress update
      this.emit('operationProgress', { 
        message: 'Server stopped, waiting before restart...', 
        progress: 50 
      });
      
      // Wait a bit before restarting
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Emit progress update
      this.emit('operationProgress', { 
        message: 'Starting server after restart...', 
        progress: 70 
      });
      
      const result = await this.startServer();
      
      // Emit progress update
      this.emit('operationProgress', { 
        message: 'Server restart completed', 
        progress: 100 
      });
      
      // Emit operation status end
      this.emit('operationStatus', { restarting: false });
      
      return result;
    } catch (error) {
      console.error(`Failed to restart server: ${error.message}`);
      this.emit('operationProgress', { 
        message: `Restart failed: ${error.message}`, 
        progress: 0 
      });
      // Emit operation status end
      this.emit('operationStatus', { restarting: false });
      throw error;
    }
  }

  getStatus() {
    const uptime = this.startTime ? Date.now() - this.startTime : null;
    const resolvedServerPath = path.resolve(this.serverPath);
    return {
      isRunning: this.isRunning,
      pid: this.serverProcess?.pid || null,
      uptime: uptime,
      uptimeFormatted: uptime ? this.formatUptime(uptime) : null,
      serverPath: this.serverPath,
      resolvedServerPath: resolvedServerPath,
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
    this.emit('operationStatus', { clearing: true });
    this.logBuffer = [];
    this.emit('operationStatus', { clearing: false });
  }

  // Send input to the server process
  sendInput(input) {
    if (this.serverProcess && this.isRunning) {
      try {
        this.serverProcess.stdin.write(input + '\n');
        this.addLog('input', input);
        this.emit('consoleOutput', { type: 'input', data: input, timestamp: new Date() });
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
    const resolvedServerPath = path.resolve(this.serverPath);
    return {
      serverPath: this.serverPath,
      resolvedServerPath: resolvedServerPath,
      startScript: this.startScript,
      scriptExists: fs.existsSync(path.join(resolvedServerPath, this.startScript)),
      directoryExists: fs.existsSync(resolvedServerPath)
    };
  }
}

// Create singleton instance
const serverManager = new ServerManager();

module.exports = serverManager; 