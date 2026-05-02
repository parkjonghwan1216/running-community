import { getDb } from '../db';

export interface GlossaryRow {
  id: number;
  term: string;
  definition: string;
  created_by: number | null;
  created_at: string;
}

export function listGlossary(query?: string): GlossaryRow[] {
  const db = getDb();
  if (query && query.trim()) {
    const like = `%${query.trim()}%`;
    return db
      .prepare(
        `SELECT * FROM glossary_terms
         WHERE term LIKE ? COLLATE NOCASE OR definition LIKE ? COLLATE NOCASE
         ORDER BY term COLLATE NOCASE ASC`,
      )
      .all(like, like) as GlossaryRow[];
  }
  return db
    .prepare(`SELECT * FROM glossary_terms ORDER BY term COLLATE NOCASE ASC`)
    .all() as GlossaryRow[];
}

export function findTerm(term: string): GlossaryRow | undefined {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM glossary_terms WHERE term = ? COLLATE NOCASE`)
    .get(term) as GlossaryRow | undefined;
}

export function createGlossary(
  term: string,
  definition: string,
  createdBy: number,
): GlossaryRow {
  const db = getDb();
  const info = db
    .prepare(`INSERT INTO glossary_terms (term, definition, created_by) VALUES (?, ?, ?)`)
    .run(term, definition, createdBy);
  return db
    .prepare(`SELECT * FROM glossary_terms WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as GlossaryRow;
}
