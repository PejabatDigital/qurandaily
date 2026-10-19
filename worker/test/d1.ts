/* A small stand-in for Cloudflare D1 on Node's built-in SQLite, enough for the API's
   queries: prepare/bind, first/all/run and batch (one transaction). The schema comes
   from migrations/, so tests run against the real tables. */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

const MIGRATIONS = join(import.meta.dirname, "../../migrations");

class Statement {
  constructor(private db: DatabaseSync, readonly sql: string, private params: SQLInputValue[] = []) {}
  bind(...params: unknown[]) {
    return new Statement(this.db, this.sql, params.map((p) => (p === undefined ? null : (p as SQLInputValue))));
  }
  private returnsRows() {
    return /^\s*(SELECT|WITH)\b/i.test(this.sql) || /\bRETURNING\b/i.test(this.sql);
  }
  async first<T>(): Promise<T | null> {
    return this.exec<T>().results[0] ?? null;
  }
  async all<T>() {
    return this.exec<T>();
  }
  async run() {
    return this.exec();
  }
  exec<T>() {
    // D1's numbered placeholders (?1, ?2, used more than once) become plain ones here.
    const params: SQLInputValue[] = [];
    const sql = this.sql.replace(/\?(\d+)/g, (_, n) => (params.push(this.params[Number(n) - 1]), "?"));
    const stmt = this.db.prepare(sql);
    if (this.returnsRows()) {
      const results = stmt.all(...params).map((r) => ({ ...r })) as T[];
      return { success: true, results, meta: { changes: 0 } };
    }
    const r = stmt.run(...params);
    return { success: true, results: [] as T[], meta: { changes: Number(r.changes) } };
  }
}

export function createD1() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  for (const f of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) db.exec(readFileSync(join(MIGRATIONS, f), "utf8"));
  return {
    sqlite: db,
    prepare: (sql: string) => new Statement(db, sql),
    async batch(statements: Statement[]) {
      db.exec("BEGIN");
      try {
        const out = statements.map((s) => s.exec());
        db.exec("COMMIT");
        return out;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

/* Adds a user (as Better Auth would) and their profile. */
export function addUser(d1: ReturnType<typeof createD1>, id: string, email = `${id}@example.com`) {
  const now = new Date().toISOString();
  d1.sqlite.prepare(`INSERT INTO "user" (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, '', ?, 1, ?, ?)`).run(id, email, now, now);
  d1.sqlite.prepare("INSERT INTO profiles (user_id, created_at, updated_at) VALUES (?, ?, ?)").run(id, now, now);
}
