import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { CssBaseline, Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, AppBar, Typography, IconButton, Button, TextField, Paper, Divider, Snackbar, Alert, CircularProgress, ListItemSecondaryAction, Menu, MenuItem, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import TerminalIcon from '@mui/icons-material/Terminal';
import LoginIcon from '@mui/icons-material/Login';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState, useEffect } from 'react';

const drawerWidth = 220;

function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token');
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  });
  const login = (token) => {
    setToken(token);
    localStorage.setItem('token', token);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch {
      setUser(null);
    }
  };
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };
  return { token, user, login, logout };
}

function ProtectedRoute({ token, children }) {
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function StatusPage() {
  const theme = useTheme();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchStatus = () => {
      setLoading(true);
      fetch('/api/status')
        .then(r => r.json())
        .then(setStatus)
        .finally(() => setLoading(false));
    };

    fetchStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getTpsColor = (tps) => {
    if (tps >= 19) return 'success';
    if (tps >= 15) return 'warning';
    return 'error';
  };

  const getTickTimeColor = (tickTime) => {
    if (tickTime <= 50) return 'success';
    if (tickTime <= 100) return 'warning';
    return 'error';
  };

  const getStatusBackground = (isOnline) => {
    return isOnline 
      ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
      : `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`;
  };

  const getPerformanceBackground = (severity) => {
    const colorMap = {
      success: theme.palette.success,
      warning: theme.palette.warning,
      error: theme.palette.error
    };
    const color = colorMap[severity] || theme.palette.grey;
    return `linear-gradient(135deg, ${color.main} 0%, ${color.dark} 100%)`;
  };

  if (loading && !status) return <CircularProgress />;
  if (!status) return <Alert severity="error">Failed to load status</Alert>;

    return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header with refresh controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Server Status Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Server Status Card */}
      <Paper sx={{ p: 3, background: getStatusBackground(status.status === 'online'), color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              {status.status === 'online' ? '🟢 Server Online' : '🔴 Server Offline'}
            </Typography>
            {status.status === 'online' && (
              <Typography variant="body1">
                Players: {status.online} / {status.max} • Last updated: {new Date().toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          {status.status === 'online' && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {status.online}
              </Typography>
              <Typography variant="body2">
                Online Players
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {status.status === 'online' && (
        <>
          {/* Main Content Grid */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              md: '2fr 1fr',
              lg: '3fr 1fr'
            }, 
            gap: 3 
          }}>
            
            {/* Left Column - TPS Performance */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* TPS Overview Card */}
              {status.tps && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    🚀 Performance Overview
                  </Typography>
                  
                  {status.tps.overall && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Overall Server Performance
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', background: getPerformanceBackground(getTpsColor(status.tps.overall.meanTPS)), color: 'white' }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {status.tps.overall.meanTPS.toFixed(1)}
                          </Typography>
                          <Typography variant="body2">
                            TPS
                          </Typography>
                        </Paper>
                        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', background: getPerformanceBackground(getTickTimeColor(status.tps.overall.meanTickTime)), color: 'white' }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {status.tps.overall.meanTickTime.toFixed(1)}
                          </Typography>
                          <Typography variant="body2">
                            ms/tick
                          </Typography>
                        </Paper>
                      </Box>
                    </Box>
                  )}

                  {/* Dimension-specific TPS */}
                  {status.tps.dimensions && status.tps.dimensions.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Dimension Performance
                      </Typography>
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { 
                          xs: '1fr', 
                          sm: 'repeat(auto-fit, minmax(280px, 1fr))',
                          md: '1fr'
                        }, 
                        gap: 2 
                      }}>
                        {status.tps.dimensions.map((dim, index) => {
                          const severity = getTpsColor(dim.meanTPS);
                          const colorMap = {
                            success: theme.palette.success,
                            warning: theme.palette.warning,
                            error: theme.palette.error
                          };
                          const color = colorMap[severity];
                          
                          return (
                            <Paper key={index} sx={{ p: 2, border: `2px solid ${color.main}` }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                                {dim.dimension}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: color.main }}>
                                    {dim.meanTPS.toFixed(1)} TPS
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {dim.meanTickTime.toFixed(1)} ms/tick
                                  </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                  <Box sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    borderRadius: '50%', 
                                    background: getPerformanceBackground(severity),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}>
                                    {dim.meanTPS >= 19 ? '✓' : dim.meanTPS >= 15 ? '⚠' : '✗'}
                                  </Box>
                                </Box>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* Fallback for simple TPS format */}
                  {!status.tps.dimensions && !status.tps.overall && status.tps.meanTPS && (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', background: getPerformanceBackground(getTpsColor(status.tps.meanTPS)), color: 'white' }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {status.tps.meanTPS.toFixed(1)}
                        </Typography>
                        <Typography variant="body2">
                          TPS
                        </Typography>
                      </Paper>
                      <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', background: getPerformanceBackground(getTickTimeColor(status.tps.meanTickTime)), color: 'white' }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {status.tps.meanTickTime.toFixed(1)}
                        </Typography>
                        <Typography variant="body2">
                          ms/tick
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Paper>
              )}
            </Box>

            {/* Right Column - Players & Resources */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Players Card */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  👥 Online Players ({status.players?.length || 0})
                </Typography>
                {status.players && status.players.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {status.players.map((player, index) => (
                      <Paper key={index} sx={{ p: 1.5, px: 2, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {player}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No players currently online
                  </Typography>
                )}
              </Paper>

              {/* System Resources Card */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  💾 System Resources
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {status.ram ? (
                    <>
                      <Paper sx={{ p: 2, textAlign: 'center', background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`, color: 'white' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {status.ram.used || status.ram.allocated || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          RAM Used (MB)
                        </Typography>
                      </Paper>
                      {status.ram.allocated && (
                        <Paper sx={{ p: 2, textAlign: 'center', background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`, color: 'white' }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {status.ram.allocated}
                          </Typography>
                          <Typography variant="body2">
                            RAM Allocated (MB)
                          </Typography>
                        </Paper>
                      )}
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Memory usage data not available
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
        </>
      )}

      {status.status === 'offline' && (
        <Alert severity="error" sx={{ fontSize: '1.1rem' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Server Connection Failed
          </Typography>
          <Typography>
            {status.error || 'Unable to connect to the Minecraft server. Please check if the server is running and the RCON connection is properly configured.'}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}

function PlayersPage({ token }) {
  const theme = useTheme();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchPlayers = () => {
    setLoading(true);
    fetch('/api/players')
      .then(r => r.json())
      .then(data => {
        // Try to parse player list from response
        const match = data.response?.match(/There are (\d+) of a max(?: of)? (\d+) players online: ?(.*)?/);
        let players = [];
        if (match) {
          const names = match[3];
          if (names && names.trim().length > 0) {
            players = names.split(',').map(n => n.trim()).filter(Boolean);
          }
        }
        setPlayers(players);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    fetchPlayers(); 
    
    if (autoRefresh) {
      const interval = setInterval(fetchPlayers, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleMenu = (event, player) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlayer(player);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setSelectedPlayer(null);
  };
  const doAction = async (action) => {
    if (!selectedPlayer) return;
    setActionLoading(true);
    let url = '', body = {};
    if (action === 'kick' || action === 'ban') {
      url = `/api/players/${action}`;
      body = { username: selectedPlayer };
    } else if (action === 'whitelist-add' || action === 'whitelist-remove') {
      url = `/api/players/whitelist`;
      body = { username: selectedPlayer, action: action === 'whitelist-add' ? 'add' : 'remove' };
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setSnackbar({ message: data.message || data.response || 'Action complete', severity: res.ok ? 'success' : 'error' });
      fetchPlayers();
    } catch (e) {
      setSnackbar({ message: e.message, severity: 'error' });
    } finally {
      setActionLoading(false);
      handleClose();
    }
  };

  const getActionColor = (action) => {
    const colorMap = {
      kick: theme.palette.warning,
      ban: theme.palette.error,
      'whitelist-add': theme.palette.success,
      'whitelist-remove': theme.palette.info
    };
    return colorMap[action] || theme.palette.grey;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header with refresh controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Player Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={fetchPlayers}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '2fr 1fr',
          lg: '3fr 1fr'
        }, 
        gap: 3 
      }}>
        
        {/* Left Column - Player List */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              👥 Online Players ({players.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : players.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Players Online
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The server is currently empty
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(auto-fit, minmax(280px, 1fr))',
                md: '1fr'
              }, 
              gap: 2 
            }}>
              {players.map((player, index) => (
                <Paper 
                  key={player} 
                  sx={{ 
                    p: 2, 
                    border: `2px solid ${theme.palette.primary.main}`,
                    background: `linear-gradient(135deg, ${theme.palette.primary.light}10 0%, ${theme.palette.primary.main}10 100%)`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                      borderColor: theme.palette.primary.dark
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                      }}>
                        {player.charAt(0).toUpperCase()}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                          {player}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Online • Player #{index + 1}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton 
                      onClick={e => handleMenu(e, player)}
                      sx={{ 
                        color: theme.palette.primary.main,
                        '&:hover': {
                          background: theme.palette.primary.light + '20'
                        }
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>

        {/* Right Column - Quick Actions & Stats */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Quick Stats */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              📊 Server Stats
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`, 
                color: 'white' 
              }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {players.length}
                </Typography>
                <Typography variant="body2">
                  Players Online
                </Typography>
              </Paper>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`, 
                color: 'white' 
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Active
                </Typography>
                <Typography variant="body2">
                  Server Status
                </Typography>
              </Paper>
            </Box>
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              ⚡ Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {['kick', 'ban', 'whitelist-add', 'whitelist-remove'].map((action) => {
                const color = getActionColor(action);
                const actionLabels = {
                  kick: 'Kick Player',
                  ban: 'Ban Player', 
                  'whitelist-add': 'Add to Whitelist',
                  'whitelist-remove': 'Remove from Whitelist'
                };
                return (
                  <Button
                    key={action}
                    variant="outlined"
                    fullWidth
                    disabled={!selectedPlayer || actionLoading}
                    onClick={() => doAction(action)}
                    sx={{
                      borderColor: color.main,
                      color: color.main,
                      '&:hover': {
                        borderColor: color.dark,
                        background: color.main + '10'
                      }
                    }}
                  >
                    {actionLabels[action]}
                  </Button>
                );
              })}
            </Box>
            {selectedPlayer && (
              <Box sx={{ mt: 2, p: 2, background: theme.palette.primary.light + '20', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected: <strong>{selectedPlayer}</strong>
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {['kick', 'ban', 'whitelist-add', 'whitelist-remove'].map((action) => {
          const color = getActionColor(action);
          const actionLabels = {
            kick: 'Kick',
            ban: 'Ban',
            'whitelist-add': 'Add to Whitelist',
            'whitelist-remove': 'Remove from Whitelist'
          };
          return (
            <MenuItem 
              key={action}
              onClick={() => doAction(action)} 
              disabled={actionLoading}
              sx={{ color: color.main }}
            >
              {actionLabels[action]}
            </MenuItem>
          );
        })}
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
        {snackbar && <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity}>{snackbar.message}</Alert>}
      </Snackbar>
    </Box>
  );
}

function ConsolePage({ token }) {
  const theme = useTheme();
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const sendCommand = async () => {
    if (!command.trim()) return;
    
    setLoading(true);
    setOutput('');
    
    // Add to command history
    const newHistory = [command, ...commandHistory.filter(cmd => cmd !== command)].slice(0, 10);
    setCommandHistory(newHistory);
    setHistoryIndex(-1);
    
    try {
      const res = await fetch('/api/console', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      setOutput(data.response || data.message || 'No output');
      if (!res.ok) setSnackbar({ message: data.message || 'Error', severity: 'error' });
      else setSnackbar({ message: 'Command executed successfully', severity: 'success' });
    } catch (e) {
      setSnackbar({ message: e.message, severity: 'error' });
    } finally {
      setLoading(false);
      setCommand('');
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

  const clearOutput = () => {
    setOutput('');
  };

  const copyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setSnackbar({ message: 'Output copied to clipboard', severity: 'success' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header with controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Server Console
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {output && (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={copyOutput}
                startIcon={<span>📋</span>}
              >
                Copy
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={clearOutput}
                startIcon={<span>🗑️</span>}
              >
                Clear
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '2fr 1fr',
          lg: '3fr 1fr'
        }, 
        gap: 3 
      }}>
        
        {/* Left Column - Console Interface */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Command Input */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              💻 Command Input
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField 
                label="Enter command..." 
                value={command} 
                onChange={e => setCommand(e.target.value)} 
                onKeyDown={handleKeyDown}
                fullWidth 
                multiline
                maxRows={3}
                variant="outlined"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.9rem'
                  }
                }}
              />
              <Button 
                variant="contained" 
                onClick={sendCommand} 
                disabled={loading || !command.trim()}
                sx={{ 
                  minWidth: 100,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                  }
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Send'}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              💡 Tip: Use ↑/↓ arrows to navigate command history • Press Enter to execute
            </Typography>
          </Paper>

          {/* Console Output */}
          <Paper sx={{ p: 3, flex: 1, minHeight: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                📤 Console Output
              </Typography>
              {output && (
                <Typography variant="body2" color="text.secondary">
                  {output.split('\n').length} lines
                </Typography>
              )}
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Executing command...
                  </Typography>
                </Box>
              </Box>
            ) : output ? (
              <Paper 
                sx={{ 
                  p: 2, 
                  whiteSpace: 'pre-wrap', 
                  background: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  maxHeight: 500,
                  overflow: 'auto',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1
                }}
              >
                {output}
              </Paper>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 200,
                background: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                borderRadius: 1,
                border: `1px dashed ${theme.palette.divider}`
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No Output
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Execute a command to see the output here
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Right Column - Quick Commands & History */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Quick Commands */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              ⚡ Quick Commands
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { cmd: 'list', label: 'List Players', icon: '👥' },
                { cmd: 'forge tps', label: 'Check TPS', icon: '🚀' },
                { cmd: 'save-all', label: 'Save World', icon: '💾' },
                { cmd: 'stop', label: 'Stop Server', icon: '🛑' },
                { cmd: 'time set day', label: 'Set Day', icon: '☀️' },
                { cmd: 'weather clear', label: 'Clear Weather', icon: '🌤️' }
              ].map((quickCmd) => (
                <Button
                  key={quickCmd.cmd}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                  onClick={() => setCommand(quickCmd.cmd)}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      background: theme.palette.primary.main + '10'
                    }
                  }}
                >
                  <span style={{ marginRight: 8 }}>{quickCmd.icon}</span>
                  {quickCmd.label}
                </Button>
              ))}
            </Box>
          </Paper>

          {/* Command History */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              📜 Command History
            </Typography>
            {commandHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No commands executed yet
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {commandHistory.slice(0, 8).map((cmd, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      background: index === historyIndex ? theme.palette.primary.light + '20' : 'transparent',
                      border: `1px solid ${index === historyIndex ? theme.palette.primary.main : theme.palette.divider}`,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        background: theme.palette.primary.light + '10',
                        borderColor: theme.palette.primary.main
                      }
                    }}
                    onClick={() => {
                      setCommand(cmd);
                      setHistoryIndex(index);
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: index === historyIndex ? theme.palette.primary.main : 'text.primary'
                      }}
                    >
                      {cmd}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>

          {/* Console Status */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              🔧 Console Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`, 
                color: 'white' 
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Connected
                </Typography>
                <Typography variant="body2">
                  RCON Status
                </Typography>
              </Paper>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`, 
                color: 'white' 
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {commandHistory.length}
                </Typography>
                <Typography variant="body2">
                  Commands Executed
                </Typography>
              </Paper>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
        {snackbar && <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity}>{snackbar.message}</Alert>}
      </Snackbar>
    </Box>
  );
}

function LoginPage({ login, token }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/');
  }, [token, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        login(data.token);
        navigate('/');
      } else {
        setSnackbar({ message: data.message || 'Login failed', severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ message: e.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Paper sx={{ p: 4, minWidth: 320 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Login</Typography>
        <form onSubmit={handleLogin}>
          <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} fullWidth sx={{ mb: 2 }} autoFocus />
          <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth sx={{ mb: 2 }} />
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>Login</Button>
        </form>
        <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
          {snackbar && <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity}>{snackbar.message}</Alert>}
        </Snackbar>
      </Paper>
    </Box>
  );
}

function App() {
  const { token, user, login, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawer = (
    <div>
      <Toolbar />
      <List>
        <ListItem button component={Link} to="/" onClick={() => setMobileOpen(false)}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Status" />
        </ListItem>
        <ListItem button component={Link} to="/players" onClick={() => setMobileOpen(false)}>
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Players" />
        </ListItem>
        <ListItem button component={Link} to="/console" onClick={() => setMobileOpen(false)}>
          <ListItemIcon><TerminalIcon /></ListItemIcon>
          <ListItemText primary="Console" />
        </ListItem>
        {!token && (
          <ListItem button component={Link} to="/login" onClick={() => setMobileOpen(false)}>
            <ListItemIcon><LoginIcon /></ListItemIcon>
            <ListItemText primary="Login" />
          </ListItem>
        )}
        {token && (
          <ListItem button onClick={logout}>
            <ListItemIcon><LoginIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        )}
      </List>
    </div>
  );

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Minecraft Manager Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
          <Toolbar />
          <Routes>
            <Route path="/" element={<StatusPage />} />
            <Route path="/players" element={<ProtectedRoute token={token}><PlayersPage token={token} /></ProtectedRoute>} />
            <Route path="/console" element={<ProtectedRoute token={token}><ConsolePage token={token} /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage login={login} token={token} />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
