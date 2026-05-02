import { getDb } from '../db';

export function toggleLike(userId: number, postId: number): { liked: boolean; count: number } {
  const db = getDb();
  const exists = db
    .prepare(`SELECT 1 FROM post_likes WHERE user_id = ? AND post_id = ?`)
    .get(userId, postId);
  if (exists) {
    db.prepare(`DELETE FROM post_likes WHERE user_id = ? AND post_id = ?`).run(userId, postId);
  } else {
    db.prepare(`INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)`).run(userId, postId);
  }
  const count = (
    db.prepare(`SELECT COUNT(*) AS c FROM post_likes WHERE post_id = ?`).get(postId) as { c: number }
  ).c;
  return { liked: !exists, count };
}

export function hasLiked(userId: number, postId: number): boolean {
  const db = getDb();
  const r = db
    .prepare(`SELECT 1 FROM post_likes WHERE user_id = ? AND post_id = ?`)
    .get(userId, postId);
  return !!r;
}

export function countLikes(postId: number): number {
  const db = getDb();
  return (
    db.prepare(`SELECT COUNT(*) AS c FROM post_likes WHERE post_id = ?`).get(postId) as { c: number }
  ).c;
}
