import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { seedGlossaryIfEmpty } from './seed';
import { seedTrainingPostsIfEmpty } from './seed-training';

let dbInstance: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  bio           TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  category   TEXT NOT NULL CHECK (category IN ('free','training')),
  author_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  body_plain TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_category_created ON posts(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS races (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  race_date        TEXT NOT NULL,
  location         TEXT NOT NULL,
  distance_km      REAL NOT NULL,
  description      TEXT,
  registration_url TEXT,
  created_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_races_date ON races(race_date);

CREATE TABLE IF NOT EXISTS glossary_terms (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  term       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  definition TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_glossary_term ON glossary_terms(term);

CREATE TABLE IF NOT EXISTS courses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  gpx_path      TEXT NOT NULL,
  distance_km   REAL,
  elevation_m   REAL,
  geojson       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_courses_author ON courses(author_id);
CREATE INDEX IF NOT EXISTS idx_courses_created ON courses(created_at DESC);

CREATE TABLE IF NOT EXISTS shoes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand       TEXT NOT NULL,
  model       TEXT NOT NULL,
  color       TEXT,
  bought_at   TEXT,
  km_initial  REAL NOT NULL DEFAULT 0,
  km_total    REAL NOT NULL DEFAULT 0,
  retired     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shoes_owner ON shoes(owner_id);

CREATE TABLE IF NOT EXISTS shoe_runs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  shoe_id    INTEGER NOT NULL REFERENCES shoes(id) ON DELETE CASCADE,
  km         REAL NOT NULL,
  run_date   TEXT NOT NULL DEFAULT (date('now')),
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shoe_runs_shoe ON shoe_runs(shoe_id);

CREATE TABLE IF NOT EXISTS post_likes (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
`;

interface ColumnInfo { name: string }

function migrate(db: Database.Database): void {
  // SQLite ALTER TABLE ADD COLUMN — guarded by pragma check
  const ensureColumn = (table: string, col: string, def: string) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as ColumnInfo[];
    if (!cols.some((c) => c.name === col)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
    }
  };
  ensureColumn('users', 'bio', 'TEXT');
  ensureColumn('posts', 'body_plain', `TEXT NOT NULL DEFAULT ''`);
  ensureColumn('posts', 'run_distance_km', 'REAL');
  ensureColumn('posts', 'run_pace', 'TEXT');
  ensureColumn('posts', 'run_type', 'TEXT');
  ensureColumn('comments', 'parent_id', 'INTEGER REFERENCES comments(id) ON DELETE CASCADE');
}

export function getStats(): { totalUsers: number; totalPosts: number; monthlyKm: number } {
  const db = getDb();
  const { totalUsers } = db.prepare(`SELECT COUNT(*) AS totalUsers FROM users`).get() as { totalUsers: number };
  const { totalPosts } = db.prepare(`SELECT COUNT(*) AS totalPosts FROM posts`).get() as { totalPosts: number };
  const { monthlyKm } = db.prepare(
    `SELECT COALESCE(SUM(run_distance_km), 0) AS monthlyKm FROM posts
     WHERE run_distance_km IS NOT NULL
       AND created_at >= date('now', 'start of month')`,
  ).get() as { monthlyKm: number };
  return { totalUsers, totalPosts, monthlyKm };
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'app.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  migrate(db);
  if (process.env.NODE_ENV !== 'test') {
    seedGlossaryIfEmpty(db);
    seedTrainingPostsIfEmpty(db);
  }
  // Backfill body_plain for any rows missing it (safe no-op when empty)
  if (process.env.NODE_ENV !== 'test') {
    const stale = db
      .prepare(`SELECT COUNT(*) AS c FROM posts WHERE body_plain = '' OR body_plain IS NULL`)
      .get() as { c: number };
    if (stale.c > 0) {
      // dynamic require to avoid cycle at top of module load
      void import('./repositories/posts').then((m) => m.backfillBodyPlain());
    }
  }
  dbInstance = db;
  return db;
}

export function resetDbForTests(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
