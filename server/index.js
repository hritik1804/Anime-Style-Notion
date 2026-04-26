const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { initDb } = require('./db');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'anime-soul-society-secret-key';

app.use(cors());
app.use(express.json());

let db;

// Utility to log activity
async function logActivity(userId) {
  const today = new Date().toISOString().split('T')[0];
  await db.query(
    `INSERT INTO activity_log (userId, "date", count) 
     VALUES ($1, $2, 1) 
     ON CONFLICT (userId, "date") DO UPDATE SET count = activity_log.count + 1`,
    [userId, today]
  );
}

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Socket logic
io.on('connection', (socket) => {
  socket.on('join-room', (userId) => {
    socket.join(userId);
  });
});

// --- AUTH ENDPOINTS ---
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    await db.query('INSERT INTO users (id, username, password) VALUES ($1, $2, $3)', [userId, username, hashedPassword]);
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: 'Username already exists or server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username, themeId: user.themeId });
});

// --- NOTES & FOLDERS ENDPOINTS ---
app.get('/api/folders', authenticateToken, async (req, res) => {
  const result = await db.query('SELECT * FROM folders WHERE userId = $1 ORDER BY position ASC', [req.user.id]);
  res.json(result.rows);
});

app.post('/api/folders', authenticateToken, async (req, res) => {
  const { id, name, createdAt } = req.body;
  await db.query('INSERT INTO folders (id, name, userId, createdAt) VALUES ($1, $2, $3, $4)', [id, name, req.user.id, createdAt]);
  io.to(req.user.id).emit('folders-updated');
  res.status(201).json({ message: 'Folder created' });
});

app.delete('/api/folders/:id', authenticateToken, async (req, res) => {
  await db.query('DELETE FROM notes WHERE folderId = $1 AND userId = $2', [req.params.id, req.user.id]);
  await db.query('DELETE FROM folders WHERE id = $1 AND userId = $2', [req.params.id, req.user.id]);
  io.to(req.user.id).emit('folders-updated');
  io.to(req.user.id).emit('notes-updated');
  res.json({ message: 'Folder deleted' });
});

app.get('/api/notes', authenticateToken, async (req, res) => {
  const result = await db.query('SELECT * FROM notes WHERE userId = $1 ORDER BY position ASC', [req.user.id]);
  res.json(result.rows);
});

app.post('/api/notes', authenticateToken, async (req, res) => {
  const { id, title, content, folderId, createdAt, updatedAt } = req.body;
  await db.query(
    'INSERT INTO notes (id, title, content, folderId, userId, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [id, title, content, folderId, req.user.id, createdAt, updatedAt]
  );
  await logActivity(req.user.id);
  io.to(req.user.id).emit('notes-updated');
  io.to(req.user.id).emit('activity-updated');
  res.status(201).json({ message: 'Note created' });
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  const { title, content, folderId, updatedAt, isPublic } = req.body;
  await db.query(
    'UPDATE notes SET title = $1, content = $2, folderId = $3, updatedAt = $4, isPublic = $5 WHERE id = $6 AND userId = $7',
    [title, content, folderId, updatedAt, isPublic ? true : false, req.params.id, req.user.id]
  );
  await logActivity(req.user.id);
  io.to(req.user.id).emit('notes-updated'); 
  res.json({ message: 'Note updated' });
});

app.post('/api/notes/reorder', authenticateToken, async (req, res) => {
  const { notes } = req.body;
  for (const note of notes) {
    await db.query('UPDATE notes SET position = $1 WHERE id = $2 AND userId = $3', [note.position, note.id, req.user.id]);
  }
  io.to(req.user.id).emit('notes-updated');
  res.json({ message: 'Notes reordered' });
});

app.post('/api/folders/reorder', authenticateToken, async (req, res) => {
  const { folders } = req.body;
  for (const folder of folders) {
    await db.query('UPDATE folders SET position = $1 WHERE id = $2 AND userId = $3', [folder.position, folder.id, req.user.id]);
  }
  io.to(req.user.id).emit('folders-updated');
  res.json({ message: 'Folders reordered' });
});

// --- ANALYTICS ENDPOINTS ---
app.get('/api/analytics/activity', authenticateToken, async (req, res) => {
  const result = await db.query('SELECT "date", count FROM activity_log WHERE userId = $1 ORDER BY "date" ASC', [req.user.id]);
  res.json(result.rows);
});

// --- PUBLIC ENDPOINTS ---
app.get('/api/public/notes/:id', async (req, res) => {
  const result = await db.query('SELECT id, title, content, updatedAt, isPublic FROM notes WHERE id = $1 AND isPublic = true', [req.params.id]);
  const note = result.rows[0];
  if (!note) return res.status(404).json({ error: 'Note not found or not public' });
  res.json(note);
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  await db.query('DELETE FROM notes WHERE id = $1 AND userId = $2', [req.params.id, req.user.id]);
  io.to(req.user.id).emit('notes-updated');
  res.json({ message: 'Note deleted' });
});

// --- PROFILE & THEME ---
app.put('/api/user/theme', authenticateToken, async (req, res) => {
  const { themeId } = req.body;
  await db.query('UPDATE users SET themeId = $1 WHERE id = $2', [themeId, req.user.id]);
  res.json({ message: 'Theme updated' });
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  const result = await db.query('SELECT id, username, fullName, bio, rank, avatarUrl, themeId FROM users WHERE id = $1', [req.user.id]);
  res.json(result.rows[0]);
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  const { fullName, bio, rank, avatarUrl } = req.body;
  await db.query(
    'UPDATE users SET fullName = $1, bio = $2, rank = $3, avatarUrl = $4 WHERE id = $5',
    [fullName, bio, rank, avatarUrl, req.user.id]
  );
  res.json({ message: 'Profile updated' });
});

// Initialize DB and start server
initDb().then((database) => {
  db = database;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on all interfaces at port ${PORT}`);
  });
});
