import { getDb } from '../db';
import { htmlToPlain } from '../sanitize';

export interface PostRow {
  id: number;
  category: 'free' | 'training';
  author_id: number;
  title: string;
  body: string;
  body_plain?: string;
  run_distance_km: number | null;
  run_pace: string | null;
  run_type: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
  comment_count?: number;
  like_count?: number;
}

const PAGE_SIZE = 20;

const LIST_COLS = `p.id, p.category, p.author_id, p.title, p.body, p.created_at, p.updated_at,
                   p.run_distance_km, p.run_pace, p.run_type,
                   u.display_name AS author_name,
                   (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
                   (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count`;

export function listPosts(
  category: 'free' | 'training',
  page = 1,
  query?: string,
) {
  const db = getDb();
  const offset = (page - 1) * PAGE_SIZE;
  const q = query?.trim();
  const useSearch = !!q;
  const like = useSearch ? `%${q}%` : '';

  const items = useSearch
    ? (db
        .prepare(
          `SELECT ${LIST_COLS}
           FROM posts p JOIN users u ON u.id = p.author_id
           WHERE p.category = ? AND (p.title LIKE ? OR p.body_plain LIKE ?)
           ORDER BY p.created_at DESC
           LIMIT ? OFFSET ?`,
        )
        .all(category, like, like, PAGE_SIZE, offset) as PostRow[])
    : (db
        .prepare(
          `SELECT ${LIST_COLS}
           FROM posts p JOIN users u ON u.id = p.author_id
           WHERE p.category = ?
           ORDER BY p.created_at DESC
           LIMIT ? OFFSET ?`,
        )
        .all(category, PAGE_SIZE, offset) as PostRow[]);

  const total = useSearch
    ? (
        db
          .prepare(
            `SELECT COUNT(*) AS c FROM posts WHERE category = ? AND (title LIKE ? OR body_plain LIKE ?)`,
          )
          .get(category, like, like) as { c: number }
      ).c
    : (db.prepare(`SELECT COUNT(*) AS c FROM posts WHERE category = ?`).get(category) as { c: number }).c;

  return { items, page, pageSize: PAGE_SIZE, total };
}

export function listPostsByAuthor(authorId: number, page = 1, perPage = 10) {
  const db = getDb();
  const offset = (page - 1) * perPage;
  const items = db
    .prepare(
      `SELECT ${LIST_COLS}
       FROM posts p JOIN users u ON u.id = p.author_id
       WHERE p.author_id = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(authorId, perPage, offset) as PostRow[];
  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM posts WHERE author_id = ?`).get(authorId) as { c: number }
  ).c;
  return { items, page, perPage, total };
}

export function getPost(id: number): PostRow | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, u.display_name AS author_name,
              (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count
       FROM posts p JOIN users u ON u.id = p.author_id
       WHERE p.id = ?`,
    )
    .get(id) as PostRow | undefined;
}

export function createPost(input: {
  category: 'free' | 'training';
  authorId: number;
  title: string;
  body: string;
  runDistanceKm?: number | null;
  runPace?: string | null;
  runType?: string | null;
}): PostRow {
  const db = getDb();
  const plain = htmlToPlain(input.body);
  const info = db
    .prepare(
      `INSERT INTO posts (category, author_id, title, body, body_plain, run_distance_km, run_pace, run_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.category, input.authorId, input.title, input.body, plain,
      input.runDistanceKm ?? null, input.runPace ?? null, input.runType ?? null,
    );
  return getPost(Number(info.lastInsertRowid))!;
}

export function updatePost(
  id: number,
  authorId: number,
  patch: { title?: string; body?: string; runDistanceKm?: number | null; runPace?: string | null; runType?: string | null },
): { ok: boolean; reason?: 'not_found' | 'forbidden' } {
  const db = getDb();
  const existing = getPost(id);
  if (!existing) return { ok: false, reason: 'not_found' };
  if (existing.author_id !== authorId) return { ok: false, reason: 'forbidden' };
  const newBody = patch.body ?? existing.body;
  const newPlain = patch.body !== undefined ? htmlToPlain(patch.body) : (existing.body_plain ?? htmlToPlain(existing.body));
  db.prepare(
    `UPDATE posts SET
       title = COALESCE(?, title),
       body  = COALESCE(?, body),
       body_plain = ?,
       run_distance_km = CASE WHEN ? = 1 THEN ? ELSE run_distance_km END,
       run_pace        = CASE WHEN ? = 1 THEN ? ELSE run_pace END,
       run_type        = CASE WHEN ? = 1 THEN ? ELSE run_type END,
       updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    patch.title ?? null, patch.body ?? null, newPlain,
    'runDistanceKm' in patch ? 1 : 0, patch.runDistanceKm ?? null,
    'runPace' in patch ? 1 : 0, patch.runPace ?? null,
    'runType' in patch ? 1 : 0, patch.runType ?? null,
    id,
  );
  // also update body_plain even when body was identical (no-op safe)
  void newBody;
  return { ok: true };
}

export function deletePost(
  id: number,
  authorId: number,
): { ok: boolean; reason?: 'not_found' | 'forbidden'; body?: string } {
  const db = getDb();
  const existing = getPost(id);
  if (!existing) return { ok: false, reason: 'not_found' };
  if (existing.author_id !== authorId) return { ok: false, reason: 'forbidden' };
  db.prepare(`DELETE FROM posts WHERE id = ?`).run(id);
  return { ok: true, body: existing.body };
}

export function backfillBodyPlain(): number {
  const db = getDb();
  const rows = db
    .prepare(`SELECT id, body FROM posts WHERE body_plain = '' OR body_plain IS NULL`)
    .all() as Array<{ id: number; body: string }>;
  if (rows.length === 0) return 0;
  const upd = db.prepare(`UPDATE posts SET body_plain = ? WHERE id = ?`);
  const tx = db.transaction((items: typeof rows) => {
    for (const r of items) upd.run(htmlToPlain(r.body), r.id);
  });
  tx(rows);
  return rows.length;
}
