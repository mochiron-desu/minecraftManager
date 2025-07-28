import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  IconButton, 
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  LinearProgress
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';

const EnhancedConsole = ({ token }) => {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState({ isRunning: false });
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, stdout, stderr, input
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  // Operation-specific loading states
  const [operationStatus, setOperationStatus] = useState({
    starting: false,
    stopping: false,
    restarting: false,
    clearing: false
  });
  const [operationProgress, setOperationProgress] = useState({
    message: '',
    progress: 0
  });
  
  const consoleRef = useRef(null);
  const commandInputRef = useRef(null);

  // WebSocket connection with reconnection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect directly to the backend server
    const wsUrl = `${protocol}//localhost:3001`;
    
    console.log('Attempting WebSocket connection to:', wsUrl);
    const websocket = new WebSocket(wsUrl);
    
    // Set a timeout for the connection
    const connectionTimeout = setTimeout(() => {
      if (websocket.readyState === WebSocket.CONNECTING) {
        console.log('WebSocket connection timeout');
        setError('WebSocket connection timeout - using HTTP fallback');
        websocket.close();
      }
    }, 5000);
    
    websocket.onopen = () => {
      console.log('WebSocket connected successfully');
      clearTimeout(connectionTimeout);
      setConnected(true);
      setError(null);
      setReconnectAttempts(0); // Reset reconnect attempts on successful connection
    };
    
    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message.type);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    websocket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      clearTimeout(connectionTimeout);
      setConnected(false);
      
      // Show error if it wasn't a normal closure
      if (event.code !== 1000) {
        setError(`WebSocket disconnected: ${event.reason || 'Unknown error'}`);
        
        // Attempt to reconnect if we haven't tried too many times
        if (reconnectAttempts < 3) {
          const timeout = setTimeout(() => {
            console.log(`Attempting to reconnect (attempt ${reconnectAttempts + 1})...`);
            setReconnectAttempts(prev => prev + 1);
          }, 2000 * (reconnectAttempts + 1)); // Exponential backoff
          
          return () => clearTimeout(timeout);
        }
      }
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      clearTimeout(connectionTimeout);
      setError('WebSocket connection failed - using HTTP fallback');
      setConnected(false);
    };
    
    setWs(websocket);
    
    return () => {
      console.log('Cleaning up WebSocket connection');
      clearTimeout(connectionTimeout);
      websocket.close();
    };
  }, [reconnectAttempts]); // Re-run effect when reconnect attempts change

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'serverStatus':
        setServerStatus(message.data);
        // Clear operation status when server status changes
        if (message.data.status === 'running' && operationStatus.starting) {
          setOperationStatus(prev => ({ ...prev, starting: false }));
          setOperationProgress({ message: 'Server started successfully!', progress: 100 });
          setTimeout(() => setOperationProgress({ message: '', progress: 0 }), 3000);
        } else if (message.data.status === 'stopped' && operationStatus.stopping) {
          setOperationStatus(prev => ({ ...prev, stopping: false }));
          setOperationProgress({ message: 'Server stopped successfully!', progress: 100 });
          setTimeout(() => setOperationProgress({ message: '', progress: 0 }), 3000);
        }
        break;
      case 'consoleLogs':
        setConsoleLogs(message.data);
        break;
      case 'consoleOutput':
        setConsoleLogs(prev => [...prev, message.data]);
        break;
      case 'logsCleared':
        setConsoleLogs([]);
        setOperationStatus(prev => ({ ...prev, clearing: false }));
        setOperationProgress({ message: 'Logs cleared successfully!', progress: 100 });
        setTimeout(() => setOperationProgress({ message: '', progress: 0 }), 3000);
        break;
      case 'commandResult':
        // Handle command result if needed
        break;
      case 'operationProgress':
        // Handle operation progress updates
        if (message.data) {
          setOperationProgress({
            message: message.data.message || '',
            progress: message.data.progress || 0
          });
        }
        break;
      case 'operationStatus':
        // Handle operation status updates
        if (message.data) {
          setOperationStatus(prev => ({
            ...prev,
            ...message.data
          }));
        }
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLogs, autoScroll]);

  const sendCommand = async () => {
    if (!command.trim()) return;
    
    setLoading(true);
    
    // Add to command history
    const newHistory = [command, ...commandHistory.filter(cmd => cmd !== command)].slice(0, 20);
    setCommandHistory(newHistory);
    setHistoryIndex(-1);
    
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Send via WebSocket if connected
        ws.send(JSON.stringify({
          type: 'sendCommand',
          data: { command: command.trim() }
        }));
      } else {
        // Fallback to HTTP API
        const response = await fetch('/api/server/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ command: command.trim() }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      }
      
      setCommand('');
    } catch (error) {
      setError(`Failed to send command: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const startServer = async () => {
    try {
      setOperationStatus(prev => ({ ...prev, starting: true }));
      setOperationProgress({ message: 'Starting server...', progress: 10 });
      setError(null);
      
      const response = await fetch('/api/server/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Server start response:', data);
      
      // Update progress based on response
      if (data.success) {
        setOperationProgress({ message: 'Server starting up...', progress: 50 });
        // The actual completion will be handled by WebSocket status updates
      } else {
        throw new Error(data.message || 'Failed to start server');
      }
    } catch (error) {
      setError(`Failed to start server: ${error.message}`);
      setOperationStatus(prev => ({ ...prev, starting: false }));
      setOperationProgress({ message: '', progress: 0 });
    }
  };

  const stopServer = async () => {
    try {
      setOperationStatus(prev => ({ ...prev, stopping: true }));
      setOperationProgress({ message: 'Stopping server...', progress: 10 });
      setError(null);
      
      const response = await fetch('/api/server/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ graceful: true }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Server stop response:', data);
      
      // Update progress based on response
      if (data.success) {
        setOperationProgress({ message: 'Server shutting down gracefully...', progress: 50 });
        // The actual completion will be handled by WebSocket status updates
      } else {
        throw new Error(data.message || 'Failed to stop server');
      }
    } catch (error) {
      setError(`Failed to stop server: ${error.message}`);
      setOperationStatus(prev => ({ ...prev, stopping: false }));
      setOperationProgress({ message: '', progress: 0 });
    }
  };

  const restartServer = async () => {
    try {
      setOperationStatus(prev => ({ ...prev, restarting: true }));
      setOperationProgress({ message: 'Restarting server...', progress: 10 });
      setError(null);
      
      const response = await fetch('/api/server/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Server restart response:', data);
      
      // Update progress based on response
      if (data.success) {
        setOperationProgress({ message: 'Server restarting...', progress: 50 });
        // The actual completion will be handled by WebSocket status updates
      } else {
        throw new Error(data.message || 'Failed to restart server');
      }
    } catch (error) {
      setError(`Failed to restart server: ${error.message}`);
      setOperationStatus(prev => ({ ...prev, restarting: false }));
      setOperationProgress({ message: '', progress: 0 });
    }
  };

  const clearLogs = async () => {
    try {
      setOperationStatus(prev => ({ ...prev, clearing: true }));
      setOperationProgress({ message: 'Clearing logs...', progress: 10 });
      setError(null);
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'clearLogs' }));
        setOperationProgress({ message: 'Logs cleared via WebSocket', progress: 100 });
      } else {
        const response = await fetch('/api/server/logs', {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        setConsoleLogs([]);
        setOperationProgress({ message: 'Logs cleared successfully!', progress: 100 });
        setTimeout(() => setOperationProgress({ message: '', progress: 0 }), 3000);
      }
    } catch (error) {
      setError(`Failed to clear logs: ${error.message}`);
      setOperationStatus(prev => ({ ...prev, clearing: false }));
      setOperationProgress({ message: '', progress: 0 });
    }
  };

  const getFilteredLogs = () => {
    if (filterType === 'all') return consoleLogs;
    return consoleLogs.filter(log => log.type === filterType);
  };

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'stdout': return 'primary';
      case 'stderr': return 'error';
      case 'input': return 'success';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Enhanced Console
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip 
            label={connected ? 'Connected' : 'Disconnected'} 
            color={connected ? 'success' : 'error'}
            size="small"
          />
          <Chip 
            label={serverStatus.isRunning ? 'Running' : 'Stopped'} 
            color={serverStatus.isRunning ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Server Controls */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Server Controls
        </Typography>
        
        {/* Progress Indicator */}
        {(operationProgress.message || operationProgress.progress > 0) && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {operationProgress.message}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {operationProgress.progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={operationProgress.progress} 
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={operationStatus.starting ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
            onClick={startServer}
            disabled={operationStatus.starting || operationStatus.stopping || operationStatus.restarting || serverStatus.isRunning}
          >
            {operationStatus.starting ? 'Starting...' : 'Start Server'}
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={operationStatus.stopping ? <CircularProgress size={16} color="inherit" /> : <StopIcon />}
            onClick={stopServer}
            disabled={operationStatus.starting || operationStatus.stopping || operationStatus.restarting || !serverStatus.isRunning}
          >
            {operationStatus.stopping ? 'Stopping...' : 'Stop Server'}
          </Button>
          <Button
            variant="outlined"
            startIcon={operationStatus.restarting ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={restartServer}
            disabled={operationStatus.starting || operationStatus.stopping || operationStatus.restarting}
          >
            {operationStatus.restarting ? 'Restarting...' : 'Restart Server'}
          </Button>
          <Button
            variant="outlined"
            startIcon={operationStatus.clearing ? <CircularProgress size={16} color="inherit" /> : <ClearIcon />}
            onClick={clearLogs}
            disabled={operationStatus.starting || operationStatus.stopping || operationStatus.restarting || operationStatus.clearing}
          >
            {operationStatus.clearing ? 'Clearing...' : 'Clear Logs'}
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        {/* Console Output */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Console Output ({getFilteredLogs().length} lines)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Auto-scroll"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showTimestamps}
                      onChange={(e) => setShowTimestamps(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Timestamps"
                />
              </Box>
            </Box>

            {/* Filter Controls */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {['all', 'stdout', 'stderr', 'input'].map((type) => (
                <Chip
                  key={type}
                  label={type.toUpperCase()}
                  color={filterType === type ? 'primary' : 'default'}
                  onClick={() => setFilterType(type)}
                  size="small"
                />
              ))}
            </Box>

            {/* Console Output */}
            <Box
              ref={consoleRef}
              sx={{
                flex: 1,
                overflow: 'auto',
                background: 'black',
                color: 'white',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                p: 2,
                borderRadius: 1,
                minHeight: 400,
              }}
            >
              {getFilteredLogs().length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No console output available
                </Typography>
              ) : (
                getFilteredLogs().map((log, index) => (
                  <Box key={log.id || index} sx={{ mb: 0.5 }}>
                    {showTimestamps && (
                      <span style={{ color: '#888', marginRight: 8 }}>
                        [{formatTimestamp(log.timestamp)}]
                      </span>
                    )}
                    <Chip
                      label={log.type}
                      size="small"
                      color={getLogTypeColor(log.type)}
                      sx={{ mr: 1, height: 16, fontSize: '0.7rem' }}
                    />
                    <span style={{ 
                      color: log.type === 'stderr' ? '#ff6b6b' : 
                             log.type === 'input' ? '#51cf66' : '#ffffff'
                    }}>
                      {log.data}
                    </span>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Command Input & Controls */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            {/* Command Input */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Command Input
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  ref={commandInputRef}
                  fullWidth
                  size="small"
                  placeholder="Enter command..."
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || !serverStatus.isRunning}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'monospace',
                    }
                  }}
                />
                <IconButton
                  onClick={sendCommand}
                  disabled={loading || !command.trim() || !serverStatus.isRunning}
                  color="primary"
                >
                  <SendIcon />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Use ↑/↓ arrows to navigate command history
              </Typography>
            </Paper>

            {/* Quick Commands */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Commands
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { cmd: 'list', label: 'List Players', icon: '👥' },
                  { cmd: 'forge tps', label: 'Check TPS', icon: '🚀' },
                  { cmd: 'save-all', label: 'Save World', icon: '💾' },
                  { cmd: 'time set day', label: 'Set Day', icon: '☀️' },
                  { cmd: 'weather clear', label: 'Clear Weather', icon: '🌤️' }
                ].map((quickCmd) => (
                  <Button
                    key={quickCmd.cmd}
                    variant="outlined"
                    size="small"
                    fullWidth
                    disabled={loading || !serverStatus.isRunning}
                    onClick={() => setCommand(quickCmd.cmd)}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    <span style={{ marginRight: 8 }}>{quickCmd.icon}</span>
                    {quickCmd.label}
                  </Button>
                ))}
              </Box>
            </Paper>

            {/* Command History */}
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Command History
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 200, overflow: 'auto' }}>
                {commandHistory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No commands executed yet
                  </Typography>
                ) : (
                  commandHistory.slice(0, 10).map((cmd, index) => (
                    <Button
                      key={index}
                      variant="text"
                      size="small"
                      fullWidth
                      onClick={() => setCommand(cmd)}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        textAlign: 'left'
                      }}
                    >
                      {cmd}
                    </Button>
                  ))
                )}
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedConsole; 