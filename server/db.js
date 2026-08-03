import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CATALOG } from './catalog.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.PUTZAPP_DB || path.join(here, 'putzapp.db');

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS wgs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  invite_code  TEXT NOT NULL UNIQUE,
  emblem       TEXT NOT NULL DEFAULT '🪸',
  motto        TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  username       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name   TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  fish           TEXT NOT NULL DEFAULT '🐠',
  color          TEXT NOT NULL DEFAULT '#2ee6d6',
  xp             INTEGER NOT NULL DEFAULT 0,
  streak         INTEGER NOT NULL DEFAULT 0,
  best_streak    INTEGER NOT NULL DEFAULT 0,
  last_clean_day TEXT,
  wg_id          INTEGER REFERENCES wgs(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT UNIQUE,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '🧽',
  points     INTEGER NOT NULL,
  minutes    INTEGER NOT NULL DEFAULT 10,
  keywords   TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wg_id         INTEGER REFERENCES wgs(id) ON DELETE SET NULL,
  activity_id   INTEGER REFERENCES activities(id) ON DELETE SET NULL,
  activity_name TEXT NOT NULL,
  icon          TEXT NOT NULL,
  category      TEXT NOT NULL,
  base_points   INTEGER NOT NULL,
  points        INTEGER NOT NULL,
  minutes       INTEGER NOT NULL DEFAULT 0,
  note          TEXT NOT NULL DEFAULT '',
  bonuses       TEXT NOT NULL DEFAULT '[]',
  photo         TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user    ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_wg      ON logs(wg_id);

CREATE TABLE IF NOT EXISTS reactions (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id  INTEGER NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji   TEXT NOT NULL,
  UNIQUE(log_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id     INTEGER NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  photo      TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_log ON comments(log_id);

CREATE TABLE IF NOT EXISTS comment_votes (
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS suggestions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '🧽',
  points      INTEGER NOT NULL,
  minutes     INTEGER NOT NULL DEFAULT 10,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'open',
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suggestion_votes (
  suggestion_id INTEGER NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value         INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (suggestion_id, user_id)
);

CREATE TABLE IF NOT EXISTS badges (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, code)
);
`);

// ---- Migrationen für bestehende Datenbanken -------------------------------
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}
ensureColumn('logs', 'photo', 'photo TEXT');
ensureColumn('comments', 'photo', 'photo TEXT');

// ---- Seed des Aktivitäten-Katalogs (idempotent) --------------------------
const seedStmt = db.prepare(`
  INSERT INTO activities (slug, name, category, icon, points, minutes, keywords, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name, category = excluded.category, icon = excluded.icon,
    points = excluded.points, minutes = excluded.minutes, keywords = excluded.keywords
`);
const now = new Date().toISOString();
for (const a of CATALOG) {
  seedStmt.run(a.slug, a.name, a.category, a.icon, a.points, a.minutes, a.keywords.join(' '), now);
}

export default db;
