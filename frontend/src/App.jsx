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
  useEffect(() => {
    setLoading(true);
    fetch('/api/status')
      .then(r => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <CircularProgress />;
  if (!status) return <Alert severity="error">Failed to load status</Alert>;
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">Server Status: {status.status === 'online' ? 'Online' : 'Offline'}</Typography>
      {status.status === 'online' && (
        <>
          <Typography>Players Online: {status.online} / {status.max}</Typography>
          <Typography>Players: {status.players?.join(', ') || 'None'}</Typography>
        </>
      )}
      {status.status === 'offline' && <Alert severity="error">{status.error || 'Server offline'}</Alert>}
    </Paper>
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
