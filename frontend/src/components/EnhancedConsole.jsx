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
    
    const websocket = new WebSocket(wsUrl);
    
    // Set a timeout for the connection
    const connectionTimeout = setTimeout(() => {
      if (websocket.readyState === WebSocket.CONNECTING) {
        setError('WebSocket connection timeout - using HTTP fallback');
        websocket.close();
      }
    }, 5000);
    
    websocket.onopen = () => {
      clearTimeout(connectionTimeout);
      setConnected(true);
      setError(null);
      setReconnectAttempts(0); // Reset reconnect attempts on successful connection
    };
    
    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    websocket.onclose = (event) => {
      clearTimeout(connectionTimeout);
      setConnected(false);
      
      // Show error if it wasn't a normal closure
      if (event.code !== 1000) {
        setError(`WebSocket disconnected: ${event.reason || 'Unknown error'}`);
        
        // Attempt to reconnect if we haven't tried too many times
        if (reconnectAttempts < 3) {
          const timeout = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
          }, 2000 * (reconnectAttempts + 1)); // Exponential backoff
          
          return () => clearTimeout(timeout);
        }
      }
    };
    
    websocket.onerror = () => {
      clearTimeout(connectionTimeout);
      setError('WebSocket connection failed - using HTTP fallback');
      setConnected(false);
    };
    
    setWs(websocket);
    
    return () => {
      clearTimeout(connectionTimeout);
      websocket.close();
    };
  }, []); // Remove reconnectAttempts dependency to prevent reconnection loops

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
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: { xs: 1, sm: 2 }, 
      height: '100vh',
      p: { xs: 1, sm: 2, md: 3 },
      backgroundColor: '#f5f5f5',
      overflow: 'hidden'
    }}>
      {/* Header Section */}
      <Paper sx={{ p: { xs: 1, sm: 2 }, flexShrink: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: { xs: 1, sm: 0 },
          mb: 1 
        }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}
          >
            Enhanced Console
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip 
              label={connected ? 'Connected' : 'Disconnected'} 
              color={connected ? 'success' : 'error'}
              size="small"
              sx={{ fontWeight: 'medium', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            />
            <Chip 
              label={serverStatus.isRunning ? 'Running' : 'Stopped'} 
              color={serverStatus.isRunning ? 'success' : 'default'}
              size="small"
              sx={{ fontWeight: 'medium', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            />
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Server Controls Section */}
      <Paper sx={{ p: { xs: 1, sm: 2 }, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
          Server Controls
        </Typography>
        
        {/* Progress Indicator */}
        {(operationProgress.message || operationProgress.progress > 0) && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                {operationProgress.message}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                {operationProgress.progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={operationProgress.progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          flexWrap: 'wrap',
          justifyContent: { xs: 'center', sm: 'flex-start' }
        }}>
          <Button
            variant="contained"
            color="success"
            startIcon={operationStatus.starting ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
            onClick={startServer}
            disabled={operationStatus.starting || operationStatus.stopping || operationStatus.restarting || serverStatus.isRunning}
            sx={{ 
              minWidth: { xs: '120px', sm: '140px' }, 
              fontWeight: 'medium',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {operationStatus.starting ? 'Starting...' : 'Start Server'}
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={operationStatus.stopping ? <CircularProgress size={18} color="inherit" /> : <StopIcon />}
            onClick={stopServer}
            disabled={operationStatus.starting || operationStatus.stopping || operationStatus.restarting || !serverStatus.isRunning}
            sx={{ 
              minWidth: { xs: '120px', sm: '140px' }, 
              fontWeight: 'medium',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {operationStatus.stopping ? 'Stopping...' : 'Stop Server'}
          </Button>
          <Button
            variant="outlined"
            startIcon={operationStatus.restarting ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
            onClick={restartServer}
            disabled={operationStatus.starting || operationStatus.stopping || operationStatus.restarting}
            sx={{ 
              minWidth: { xs: '120px', sm: '140px' }, 
              fontWeight: 'medium',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {operationStatus.restarting ? 'Restarting...' : 'Restart Server'}
          </Button>
          <Button
            variant="outlined"
            startIcon={operationStatus.clearing ? <CircularProgress size={18} color="inherit" /> : <ClearIcon />}
            onClick={clearLogs}
            disabled={operationStatus.starting || operationStatus.stopping || operationStatus.restarting || operationStatus.clearing}
            sx={{ 
              minWidth: { xs: '120px', sm: '140px' }, 
              fontWeight: 'medium',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {operationStatus.clearing ? 'Clearing...' : 'Clear Logs'}
          </Button>
        </Box>
      </Paper>

      {/* Main Content Section */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: { xs: 'column', lg: 'row' },
        gap: { xs: 2, lg: 3 }, 
        minHeight: 0, 
        overflow: 'hidden' 
      }}>
        {/* Console Output Section */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: 0,
          order: { xs: 2, lg: 1 }
        }}>
          <Paper sx={{ p: { xs: 1, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' }, 
              mb: 2, 
              flexShrink: 0,
              gap: { xs: 1, sm: 0 }
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                Console Output ({getFilteredLogs().length} lines)
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1, sm: 2 }, 
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Auto-scroll"
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                    } 
                  }}
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
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                    } 
                  }}
                />
              </Box>
            </Box>

            {/* Filter Controls */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mb: 2, 
              flexShrink: 0,
              flexWrap: 'wrap'
            }}>
              {['all', 'stdout', 'stderr', 'input'].map((type) => (
                <Chip
                  key={type}
                  label={type.toUpperCase()}
                  color={filterType === type ? 'primary' : 'default'}
                  onClick={() => setFilterType(type)}
                  size="small"
                  sx={{ 
                    fontWeight: 'medium',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}
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
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                p: { xs: 1, sm: 2 },
                borderRadius: 1,
                border: '1px solid #333',
                minHeight: { xs: 200, sm: 0 },
                '&::-webkit-scrollbar': {
                  width: { xs: '6px', sm: '10px' },
                },
                '&::-webkit-scrollbar-track': {
                  background: '#2a2a2a',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#555',
                  borderRadius: '5px',
                  '&:hover': {
                    background: '#777',
                  },
                },
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
                      sx={{ 
                        mr: 1, 
                        height: { xs: 16, sm: 18 }, 
                        fontSize: { xs: '0.6rem', sm: '0.7rem' } 
                      }}
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
        </Box>

        {/* Sidebar Section */}
        <Box sx={{ 
          width: { xs: '100%', lg: 350 }, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: { xs: 1, sm: 2 }, 
          minHeight: 0,
          order: { xs: 1, lg: 2 },
          flex: { xs: 'none', lg: 'none' }
        }}>
          {/* Command Input */}
          <Paper sx={{ p: { xs: 1, sm: 2 }, flexShrink: 0 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#333', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Command Input
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
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
                sx={{ 
                  backgroundColor: '#1976d2',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                  '&:disabled': {
                    backgroundColor: '#e0e0e0',
                    color: '#9e9e9e',
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              Use ↑/↓ arrows to navigate command history
            </Typography>
          </Paper>

          {/* Quick Commands */}
          <Paper sx={{ p: { xs: 1, sm: 2 }, flexShrink: 0 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#333', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Quick Commands
            </Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', lg: '1fr' },
              gap: 0.5 
            }}>
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
                  sx={{ 
                    justifyContent: 'flex-start', 
                    textTransform: 'none',
                    py: 0.5,
                    fontWeight: 'medium',
                    fontSize: { xs: '0.7rem', sm: '0.875rem' }
                  }}
                >
                  <span style={{ marginRight: 4, fontSize: { xs: '0.8rem', sm: '1rem' } }}>{quickCmd.icon}</span>
                  {quickCmd.label}
                </Button>
              ))}
            </Box>
          </Paper>

          {/* Command History */}
          <Paper sx={{ p: { xs: 1, sm: 2 }, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#333', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Command History
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1, 
              flex: 1,
              overflow: 'auto',
              maxHeight: { xs: 150, sm: 'none' },
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '3px',
                '&:hover': {
                  background: '#a8a8a8',
                },
              },
            }}>
              {commandHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontStyle: 'italic' }}>
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
                      fontSize: { xs: '0.65rem', sm: '0.8rem' },
                      textAlign: 'left',
                      py: 0.25,
                      px: 0.5,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      }
                    }}
                  >
                    {cmd}
                  </Button>
                ))
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default EnhancedConsole; 