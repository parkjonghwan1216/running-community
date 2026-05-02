import { getDb } from '../db';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
  bio: string | null;
  created_at: string;
}

export interface UserStats {
  posts: number;
  comments: number;
  races: number;
  likes_received: number;
}

export function createUser(email: string, passwordHash: string, displayName: string): UserRow {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)`,
  );
  const info = stmt.run(email, passwordHash, displayName);
  return findById(Number(info.lastInsertRowid))!;
}

export function findByEmail(email: string): UserRow | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as UserRow | undefined;
}

export function findById(id: number): UserRow | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow | undefined;
}

export function updateProfile(
  id: number,
  patch: { displayName?: string; bio?: string | null },
): UserRow | undefined {
  const db = getDb();
  db.prepare(
    `UPDATE users SET
       display_name = COALESCE(?, display_name),
       bio          = COALESCE(?, bio)
     WHERE id = ?`,
  ).run(patch.displayName ?? null, patch.bio === undefined ? null : patch.bio, id);
  return findById(id);
}

export function getUserStats(id: number): UserStats {
  const db = getDb();
  const posts = (
    db.prepare(`SELECT COUNT(*) AS c FROM posts WHERE author_id = ?`).get(id) as { c: number }
  ).c;
  const comments = (
    db.prepare(`SELECT COUNT(*) AS c FROM comments WHERE author_id = ?`).get(id) as { c: number }
  ).c;
  const races = (
    db.prepare(`SELECT COUNT(*) AS c FROM races WHERE created_by = ?`).get(id) as { c: number }
  ).c;
  const likesReceived = (
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM post_likes l JOIN posts p ON p.id = l.post_id WHERE p.author_id = ?`,
      )
      .get(id) as { c: number }
  ).c;
  return { posts, comments, races, likes_received: likesReceived };
}
