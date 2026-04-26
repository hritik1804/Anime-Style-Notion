const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        themeId TEXT DEFAULT 'aizen',
        fullName TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        rank TEXT DEFAULT 'Substitute Shinigami',
        avatarUrl TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT,
        userId TEXT REFERENCES users(id),
        createdAt BIGINT,
        position INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        folderId TEXT REFERENCES folders(id),
        userId TEXT REFERENCES users(id),
        createdAt BIGINT,
        updatedAt BIGINT,
        isPublic BOOLEAN DEFAULT FALSE,
        position INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        userId TEXT REFERENCES users(id),
        date TEXT,
        count INTEGER DEFAULT 0,
        PRIMARY KEY (userId, date)
      );
    `);
    console.log("Supabase Tables Initialized");
  } finally {
    client.release();
  }
  return pool;
}

module.exports = { initDb };
