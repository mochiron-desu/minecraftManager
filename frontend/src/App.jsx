import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { CssBaseline, Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, AppBar, Typography, IconButton, Button, TextField, Paper, Divider, Snackbar, Alert, CircularProgress, ListItemSecondaryAction, Menu, MenuItem } from '@mui/material';
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
      <Paper sx={{ p: 3, background: status.status === 'online' ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)' : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', color: 'white' }}>
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
                    <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', background: `linear-gradient(135deg, ${getTpsColor(status.tps.overall.meanTPS) === 'success' ? '#4caf50' : getTpsColor(status.tps.overall.meanTPS) === 'warning' ? '#ff9800' : '#f44336'} 0%, ${getTpsColor(status.tps.overall.meanTPS) === 'success' ? '#45a049' : getTpsColor(status.tps.overall.meanTPS) === 'warning' ? '#f57c00' : '#d32f2f'} 100%)`, color: 'white' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {status.tps.overall.meanTPS.toFixed(1)}
                      </Typography>
                      <Typography variant="body2">
                        TPS
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', background: `linear-gradient(135deg, ${getTickTimeColor(status.tps.overall.meanTickTime) === 'success' ? '#4caf50' : getTickTimeColor(status.tps.overall.meanTickTime) === 'warning' ? '#ff9800' : '#f44336'} 0%, ${getTickTimeColor(status.tps.overall.meanTickTime) === 'success' ? '#45a049' : getTickTimeColor(status.tps.overall.meanTickTime) === 'warning' ? '#f57c00' : '#d32f2f'} 100%)`, color: 'white' }}>
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
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fit, minmax(300px, 1fr))' }, gap: 2 }}>
                    {status.tps.dimensions.map((dim, index) => (
                      <Paper key={index} sx={{ p: 2, border: `2px solid ${getTpsColor(dim.meanTPS) === 'success' ? '#4caf50' : getTpsColor(dim.meanTPS) === 'warning' ? '#ff9800' : '#f44336'}` }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                          {dim.dimension}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: getTpsColor(dim.meanTPS) === 'success' ? '#4caf50' : getTpsColor(dim.meanTPS) === 'warning' ? '#ff9800' : '#f44336' }}>
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
                              background: `linear-gradient(135deg, ${getTpsColor(dim.meanTPS) === 'success' ? '#4caf50' : getTpsColor(dim.meanTPS) === 'warning' ? '#ff9800' : '#f44336'} 0%, ${getTpsColor(dim.meanTPS) === 'success' ? '#45a049' : getTpsColor(dim.meanTPS) === 'warning' ? '#f57c00' : '#d32f2f'} 100%)`,
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
                    ))}
                  </Box>
                </Box>
              )}

              {/* Fallback for simple TPS format */}
              {!status.tps.dimensions && !status.tps.overall && status.tps.meanTPS && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', background: `linear-gradient(135deg, ${getTpsColor(status.tps.meanTPS) === 'success' ? '#4caf50' : getTpsColor(status.tps.meanTPS) === 'warning' ? '#ff9800' : '#f44336'} 0%, ${getTpsColor(status.tps.meanTPS) === 'success' ? '#45a049' : getTpsColor(status.tps.meanTPS) === 'warning' ? '#f57c00' : '#d32f2f'} 100%)`, color: 'white' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {status.tps.meanTPS.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">
                      TPS
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', background: `linear-gradient(135deg, ${getTickTimeColor(status.tps.meanTickTime) === 'success' ? '#4caf50' : getTickTimeColor(status.tps.meanTickTime) === 'warning' ? '#ff9800' : '#f44336'} 0%, ${getTickTimeColor(status.tps.meanTickTime) === 'success' ? '#45a049' : getTickTimeColor(status.tps.meanTickTime) === 'warning' ? '#f57c00' : '#d32f2f'} 100%)`, color: 'white' }}>
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

          {/* Players Card */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              👥 Online Players ({status.players?.length || 0})
            </Typography>
            {status.players && status.players.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {status.players.map((player, index) => (
                  <Paper key={index} sx={{ p: 1.5, px: 2, background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', color: 'white', borderRadius: 2 }}>
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
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {status.ram ? (
                <>
                  <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', color: 'white' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {status.ram.used || status.ram.allocated || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      RAM Used (MB)
                    </Typography>
                  </Paper>
                  {status.ram.allocated && (
                    <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', background: 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)', color: 'white' }}>
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
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => { fetchPlayers(); }, []);

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
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">Players Online</Typography>
      {loading ? <CircularProgress /> : (
        <List>
          {players.length === 0 && <Typography>No players online.</Typography>}
          {players.map(player => (
            <ListItem key={player} secondaryAction={
              <>
                <IconButton edge="end" onClick={e => handleMenu(e, player)}>
                  <MoreVertIcon />
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl) && selectedPlayer === player} onClose={handleClose}>
                  <MenuItem onClick={() => doAction('kick')} disabled={actionLoading}>Kick</MenuItem>
                  <MenuItem onClick={() => doAction('ban')} disabled={actionLoading}>Ban</MenuItem>
                  <MenuItem onClick={() => doAction('whitelist-add')} disabled={actionLoading}>Whitelist Add</MenuItem>
                  <MenuItem onClick={() => doAction('whitelist-remove')} disabled={actionLoading}>Whitelist Remove</MenuItem>
                </Menu>
              </>
            }>
              <ListItemText primary={player} />
            </ListItem>
          ))}
        </List>
      )}
      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
        {snackbar && <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity}>{snackbar.message}</Alert>}
      </Snackbar>
    </Paper>
  );
}

function ConsolePage({ token }) {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState(null);

  const sendCommand = async () => {
    setLoading(true);
    setOutput('');
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
    } catch (e) {
      setSnackbar({ message: e.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">Console</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField label="Command" value={command} onChange={e => setCommand(e.target.value)} fullWidth onKeyDown={e => { if (e.key === 'Enter') sendCommand(); }} />
        <Button variant="contained" onClick={sendCommand} disabled={loading || !command}>Send</Button>
      </Box>
      {loading && <CircularProgress size={24} />}
      {output && <Paper sx={{ p: 2, mt: 2, whiteSpace: 'pre-wrap', background: '#222', color: '#fff' }}>{output}</Paper>}
      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
        {snackbar && <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity}>{snackbar.message}</Alert>}
      </Snackbar>
    </Paper>
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
