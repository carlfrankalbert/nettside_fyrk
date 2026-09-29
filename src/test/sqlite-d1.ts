import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';

// Loaded at runtime: Vite doesn't know node:sqlite as a built-in on Node 22 and
// fails trying to bundle a static import of it
const { DatabaseSync: Database } = process.getBuiltinModule('node:sqlite') as typeof import('node:sqlite');

/** Vitest runs from the project root */
const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

/**
 * The slice of D1Database the stats code uses, backed by an in-memory SQLite
 * database with every migration applied. Runs real SQL, so constraint and
 * upsert behaviour matches D1 (which is SQLite).
 */
export function createTestD1(): { db: D1Database; sqlite: DatabaseSync } {
  const sqlite = new Database(':memory:');
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'));
  }

  class Statement {
    constructor(readonly sql: string, readonly params: SQLInputValue[] = []) {}
    bind(...params: unknown[]) {
      return new Statement(this.sql, params as SQLInputValue[]);
    }
    async all<T>() {
      return { results: sqlite.prepare(this.sql).all(...this.params) as T[], success: true, meta: {} };
    }
    async first<T>() {
      return (sqlite.prepare(this.sql).get(...this.params) ?? null) as T | null;
    }
    async run() {
      return this.all();
    }
  }

  const db = {
    prepare: (sql: string) => new Statement(sql),
    // D1 runs a batch as one transaction, one batch at a time: synchronous here
    // so concurrent batches can't interleave inside a transaction
    batch: async (statements: Statement[]) => {
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const s of statements) {
          results.push({ results: sqlite.prepare(s.sql).all(...s.params), success: true, meta: {} });
        }
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };

  return { db: db as unknown as D1Database, sqlite };
}
