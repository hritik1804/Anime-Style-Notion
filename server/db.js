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
      avatarUrl TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT,
      userId TEXT,
      createdAt INTEGER,
      position INTEGER DEFAULT 0,
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
      isPublic INTEGER DEFAULT 0,
      position INTEGER DEFAULT 0,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(folderId) REFERENCES folders(id)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      userId TEXT,
      date TEXT,
      count INTEGER DEFAULT 0,
      PRIMARY KEY (userId, date),
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);

  // Migrations
  try { await db.exec('ALTER TABLE notes ADD COLUMN isPublic INTEGER DEFAULT 0'); } catch (e) {}
  try { await db.exec('ALTER TABLE notes ADD COLUMN position INTEGER DEFAULT 0'); } catch (e) {}
  try { await db.exec('ALTER TABLE folders ADD COLUMN position INTEGER DEFAULT 0'); } catch (e) {}
  try { await db.exec('ALTER TABLE users ADD COLUMN fullName TEXT DEFAULT ""'); } catch (e) {}
  try { await db.exec('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ""'); } catch (e) {}
  try { await db.exec('ALTER TABLE users ADD COLUMN rank TEXT DEFAULT "Substitute Shinigami"'); } catch (e) {}
  try { await db.exec('ALTER TABLE users ADD COLUMN avatarUrl TEXT DEFAULT ""'); } catch (e) {}

  return db;
}

module.exports = { initDb };
