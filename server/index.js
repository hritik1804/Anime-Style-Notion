const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const http = require('http');
const multer = require('multer');
const pdf = require('pdf-parse');
const { Server } = require('socket.io');
const { initDb } = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'anime-notion-ultra-secret-2024';

app.use(cors());
app.use(express.json());

// Multer for PDF uploads
const upload = multer({ storage: multer.memoryStorage() });

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

// --- AI STABILITY HELPER ---
async function callGemini(prompt, apiKey) {
  const models = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro'];
  let lastError;

  for (const modelName of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`Gemini API Error [${modelName}]:`, JSON.stringify(data, null, 2));
        lastError = data.error?.message || `Status ${response.status}`;
        continue; // Try next model
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
      
      console.warn(`Gemini [${modelName}] returned an empty response`);
    } catch (err) {
      console.error(`Network error calling ${modelName}:`, err.message);
      lastError = err.message;
    }
  }
  throw new Error(lastError || 'All spiritual channels are blocked (AI failed)');
}

// --- AI ENDPOINTS ---
app.post('/api/ai/summarize', authenticateToken, async (req, res) => {
  const { content } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!content) return res.status(400).json({ error: 'No content provided' });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Zanpakuto Spirit requires a GEMINI_API_KEY environment variable.' });

  try {
    const prompt = `You are the Zanpakuto Spirit, a tactical advisor for a Shinigami. 
    Summarize the following notes into a concise 'Mission Briefing'. 
    Use bullet points and a tactical tone. 
    Notes: ${content}`;

    const summary = await callGemini(prompt, GEMINI_API_KEY);
    res.json({ summary });
  } catch (err) {
    console.error('Summarize Endpoint Error:', err.message);
    res.status(500).json({ 
      summary: "I am unable to channel spiritual energy at this moment.",
      debug_error: err.message 
    });
  }
});

app.post('/api/ai/process-pdf', authenticateToken, upload.single('file'), async (req, res) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Zanpakuto Spirit requires a GEMINI_API_KEY environment variable.' });

  try {
    const data = await pdf(req.file.buffer);
    const prompt = `Analyze this Training Scroll (PDF). 
    Provide a tactical summary of its contents. 
    Extract the key techniques or information.
    Text: ${data.text.substring(0, 15000)}`;

    const summary = await callGemini(prompt, GEMINI_API_KEY);
    res.json({ 
      summary,
      extractedText: data.text.substring(0, 500) + '...'
    });
  } catch (err) {
    console.error('Process PDF Error:', err.message);
    res.status(500).json({ summary: "The Training Scroll is sealed by a powerful barrier (AI Error). I cannot read it right now." });
  }
});

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
    await db.query('INSERT INTO users (id, username, password) VALUES ($1, $2, $3)', [userId, username.toLowerCase(), hashedPassword]);
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Username already exists or server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await db.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
  const user = result.rows[0];

  if (!user) {
    console.log(`Login failed: User ${username} not found`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    console.log(`Login failed: Password mismatch for ${username}`);
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
