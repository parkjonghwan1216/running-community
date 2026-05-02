import { getDb } from '../db';

export interface CourseRow {
  id: number;
  author_id: number;
  author_name?: string;
  title: string;
  description: string | null;
  gpx_path: string;
  distance_km: number | null;
  elevation_m: number | null;
  geojson: string | null;
  created_at: string;
}

export function listCourses(page = 1, perPage = 20): { items: CourseRow[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * perPage;
  const items = db
    .prepare(
      `SELECT c.*, u.display_name AS author_name
       FROM courses c
       JOIN users u ON u.id = c.author_id
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(perPage, offset) as CourseRow[];
  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM courses`)
    .get() as { total: number };
  return { items, total };
}

export function getCourse(id: number): CourseRow | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, u.display_name AS author_name
       FROM courses c
       JOIN users u ON u.id = c.author_id
       WHERE c.id = ?`,
    )
    .get(id) as CourseRow | undefined;
}

export function createCourse(data: {
  authorId: number;
  title: string;
  description?: string;
  gpxPath: string;
  distanceKm?: number;
  elevationM?: number;
  geojson?: string;
}): CourseRow {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO courses (author_id, title, description, gpx_path, distance_km, elevation_m, geojson)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.authorId,
      data.title,
      data.description ?? null,
      data.gpxPath,
      data.distanceKm ?? null,
      data.elevationM ?? null,
      data.geojson ?? null,
    );
  return getCourse(Number(info.lastInsertRowid))!;
}

export function deleteCourse(id: number): string | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT gpx_path FROM courses WHERE id = ?`)
    .get(id) as { gpx_path: string } | undefined;
  if (!row) return null;
  db.prepare(`DELETE FROM courses WHERE id = ?`).run(id);
  return row.gpx_path;
}
