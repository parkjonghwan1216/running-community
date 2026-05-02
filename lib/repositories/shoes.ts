import { getDb } from '../db';

export interface ShoeRow {
  id: number;
  owner_id: number;
  brand: string;
  model: string;
  color: string | null;
  bought_at: string | null;
  km_initial: number;
  km_total: number;
  retired: number;
  created_at: string;
}

export interface ShoeRunRow {
  id: number;
  shoe_id: number;
  km: number;
  run_date: string;
  note: string | null;
  created_at: string;
}

export function listShoes(ownerId: number): ShoeRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM shoes WHERE owner_id = ? ORDER BY retired ASC, created_at DESC`,
    )
    .all(ownerId) as ShoeRow[];
}

export function getShoe(id: number): ShoeRow | undefined {
  return getDb().prepare(`SELECT * FROM shoes WHERE id = ?`).get(id) as ShoeRow | undefined;
}

export function createShoe(data: {
  ownerId: number;
  brand: string;
  model: string;
  color?: string;
  boughtAt?: string;
  kmInitial?: number;
}): ShoeRow {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO shoes (owner_id, brand, model, color, bought_at, km_initial, km_total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.ownerId,
      data.brand,
      data.model,
      data.color ?? null,
      data.boughtAt ?? null,
      data.kmInitial ?? 0,
      data.kmInitial ?? 0,
    );
  return getShoe(Number(info.lastInsertRowid))!;
}

export function retireShoe(id: number): void {
  getDb().prepare(`UPDATE shoes SET retired = 1 WHERE id = ?`).run(id);
}

export function deleteShoe(id: number): void {
  getDb().prepare(`DELETE FROM shoes WHERE id = ?`).run(id);
}

export function addRun(shoeId: number, km: number, runDate: string, note?: string): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO shoe_runs (shoe_id, km, run_date, note) VALUES (?, ?, ?, ?)`,
  ).run(shoeId, km, runDate, note ?? null);
  db.prepare(`UPDATE shoes SET km_total = km_total + ? WHERE id = ?`).run(km, shoeId);
}

export function listRuns(shoeId: number): ShoeRunRow[] {
  return getDb()
    .prepare(`SELECT * FROM shoe_runs WHERE shoe_id = ? ORDER BY run_date DESC, id DESC`)
    .all(shoeId) as ShoeRunRow[];
}
