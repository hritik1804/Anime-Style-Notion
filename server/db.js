const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function initDb() {
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      themeId TEXT DEFAULT 'aizen',
      fullName TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      rank TEXT DEFAULT 'Substitute Shinigami',
      avatarUrl TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aizen'
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT,
      userId TEXT,
      createdAt INTEGER,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      folderId TEXT,
      userId TEXT,
      createdAt INTEGER,
      updatedAt INTEGER,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(folderId) REFERENCES folders(id)
    );
  `);

  // Handle migration for existing users (Add columns if they don't exist)
  try { await db.exec('ALTER TABLE users ADD COLUMN fullName TEXT DEFAULT ""'); } catch (e) {}
  try { await db.exec('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ""'); } catch (e) {}
  try { await db.exec('ALTER TABLE users ADD COLUMN rank TEXT DEFAULT "Substitute Shinigami"'); } catch (e) {}
  try { await db.exec('ALTER TABLE users ADD COLUMN avatarUrl TEXT DEFAULT ""'); } catch (e) {}

  return db;
}

module.exports = { initDb };
