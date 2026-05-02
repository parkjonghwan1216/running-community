import { getDb } from '../db';

export interface CommentRow {
  id: number;
  post_id: number;
  author_id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  author_name?: string;
}

export function listByPost(postId: number): CommentRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, u.display_name AS author_name
       FROM comments c JOIN users u ON u.id = c.author_id
       WHERE c.post_id = ?
       ORDER BY COALESCE(c.parent_id, c.id) ASC, c.created_at ASC`,
    )
    .all(postId) as CommentRow[];
}

export function getComment(id: number): CommentRow | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM comments WHERE id = ?`).get(id) as CommentRow | undefined;
}

export function createComment(
  postId: number,
  authorId: number,
  body: string,
  parentId?: number | null,
): CommentRow {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO comments (post_id, author_id, parent_id, body) VALUES (?, ?, ?, ?)`,
    )
    .run(postId, authorId, parentId ?? null, body);
  return db
    .prepare(
      `SELECT c.*, u.display_name AS author_name
       FROM comments c JOIN users u ON u.id = c.author_id
       WHERE c.id = ?`,
    )
    .get(Number(info.lastInsertRowid)) as CommentRow;
}

export function deleteComment(id: number, authorId: number): boolean {
  const db = getDb();
  const result = db
    .prepare(`DELETE FROM comments WHERE id = ? AND author_id = ?`)
    .run(id, authorId);
  return result.changes > 0;
}

export interface CommentWithPost extends CommentRow {
  post_title: string;
  post_category: string;
}

export function listCommentsByAuthor(
  authorId: number,
  page = 1,
  perPage = 10,
): { items: CommentWithPost[]; total: number; page: number; perPage: number } {
  const db = getDb();
  const offset = (page - 1) * perPage;
  const items = db
    .prepare(
      `SELECT c.*, p.title AS post_title, p.category AS post_category
       FROM comments c JOIN posts p ON p.id = c.post_id
       WHERE c.author_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(authorId, perPage, offset) as CommentWithPost[];
  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM comments WHERE author_id = ?`).get(authorId) as {
      c: number;
    }
  ).c;
  return { items, total, page, perPage };
}
