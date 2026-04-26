const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { initDb } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'anime-soul-society-secret-key';

app.use(cors());
app.use(express.json());

let db;

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

// --- AUTH ENDPOINTS ---

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    await db.run(
      'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
      [userId, username, hashedPassword]
    );
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: 'Username already exists or server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username, themeId: user.themeId });
});

// --- NOTES & FOLDERS ENDPOINTS ---

app.get('/api/folders', authenticateToken, async (req, res) => {
  const folders = await db.all('SELECT * FROM folders WHERE userId = ?', [req.user.id]);
  res.json(folders);
});

app.post('/api/folders', authenticateToken, async (req, res) => {
  const { id, name, createdAt } = req.body;
  await db.run(
    'INSERT INTO folders (id, name, userId, createdAt) VALUES (?, ?, ?, ?)',
    [id, name, req.user.id, createdAt]
  );
  res.status(201).json({ message: 'Folder created' });
});

app.delete('/api/folders/:id', authenticateToken, async (req, res) => {
  await db.run('DELETE FROM folders WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
  await db.run('DELETE FROM notes WHERE folderId = ? AND userId = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Folder deleted' });
});

app.get('/api/notes', authenticateToken, async (req, res) => {
  const notes = await db.all('SELECT * FROM notes WHERE userId = ?', [req.user.id]);
  res.json(notes);
});

app.post('/api/notes', authenticateToken, async (req, res) => {
  const { id, title, content, folderId, createdAt, updatedAt } = req.body;
  await db.run(
    'INSERT INTO notes (id, title, content, folderId, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, title, content, folderId, req.user.id, createdAt, updatedAt]
  );
  res.status(201).json({ message: 'Note created' });
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  const { title, content, folderId, updatedAt } = req.body;
  await db.run(
    'UPDATE notes SET title = ?, content = ?, folderId = ?, updatedAt = ? WHERE id = ? AND userId = ?',
    [title, content, folderId, updatedAt, req.params.id, req.user.id]
  );
  res.json({ message: 'Note updated' });
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  await db.run('DELETE FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Note deleted' });
});

app.put('/api/user/theme', authenticateToken, async (req, res) => {
  const { themeId } = req.body;
  await db.run('UPDATE users SET themeId = ? WHERE id = ?', [themeId, req.user.id]);
  res.json({ message: 'Theme updated' });
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  const user = await db.get('SELECT id, username, fullName, bio, rank, avatarUrl, themeId FROM users WHERE id = ?', [req.user.id]);
  res.json(user);
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  const { fullName, bio, rank, avatarUrl } = req.body;
  await db.run(
    'UPDATE users SET fullName = ?, bio = ?, rank = ?, avatarUrl = ? WHERE id = ?',
    [fullName, bio, rank, avatarUrl, req.user.id]
  );
  res.json({ message: 'Profile updated' });
});

// Initialize DB and start server
initDb().then((database) => {
  db = database;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
