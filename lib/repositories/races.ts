import { getDb } from '../db';

export interface RaceRow {
  id: number;
  name: string;
  race_date: string;
  location: string;
  distance_km: number;
  description: string | null;
  registration_url: string | null;
  created_by: number;
  created_at: string;
  creator_name?: string;
}

export function listRaces(): { upcoming: RaceRow[]; past: RaceRow[] } {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = db
    .prepare(
      `SELECT r.*, u.display_name AS creator_name
       FROM races r LEFT JOIN users u ON u.id = r.created_by
       WHERE r.race_date >= ? ORDER BY r.race_date ASC`,
    )
    .all(today) as RaceRow[];
  const past = db
    .prepare(
      `SELECT r.*, u.display_name AS creator_name
       FROM races r LEFT JOIN users u ON u.id = r.created_by
       WHERE r.race_date < ? ORDER BY r.race_date DESC`,
    )
    .all(today) as RaceRow[];
  return { upcoming, past };
}

export function getRace(id: number): RaceRow | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT r.*, u.display_name AS creator_name
       FROM races r LEFT JOIN users u ON u.id = r.created_by
       WHERE r.id = ?`,
    )
    .get(id) as RaceRow | undefined;
}

export function listRacesByCreator(userId: number): RaceRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT r.*, u.display_name AS creator_name
       FROM races r LEFT JOIN users u ON u.id = r.created_by
       WHERE r.created_by = ?
       ORDER BY r.race_date DESC`,
    )
    .all(userId) as RaceRow[];
}

export function createRace(input: {
  name: string;
  raceDate: string;
  location: string;
  distanceKm: number;
  description?: string;
  registrationUrl?: string;
  createdBy: number;
}): RaceRow {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO races (name, race_date, location, distance_km, description, registration_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.name,
      input.raceDate,
      input.location,
      input.distanceKm,
      input.description ?? null,
      input.registrationUrl ?? null,
      input.createdBy,
    );
  return getRace(Number(info.lastInsertRowid))!;
}
