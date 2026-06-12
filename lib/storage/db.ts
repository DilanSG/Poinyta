import * as SQLite from "expo-sqlite";

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync("poinyta.db");
  }
  return _db;
}

export async function initDatabase(): Promise<void> {
  const db = getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      UNIQUE(type, name COLLATE NOCASE)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0,
      priority   TEXT NOT NULL DEFAULT 'medium',
      category   TEXT NOT NULL DEFAULT '',
      due_date   TEXT,
      reminder   TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id         TEXT PRIMARY KEY,
      content    TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL,
      amount      REAL NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category    TEXT NOT NULL,
      date        TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wish_items (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      link        TEXT NOT NULL DEFAULT '',
      amount      REAL,
      image       TEXT,
      description TEXT,
      category    TEXT NOT NULL,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'active',
      target_date TEXT,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goal_steps (
      id          TEXT PRIMARY KEY,
      goal_id     TEXT NOT NULL,
      title       TEXT NOT NULL,
      completed   INTEGER NOT NULL DEFAULT 0,
      step_order  INTEGER NOT NULL,
      unlocked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS app_notifications (
      id         TEXT PRIMARY KEY,
      message    TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'info',
      read       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  await ensureColumn(db, "goal_steps", "description", "TEXT");
  await ensureColumn(db, "goals", "completed_at", "TEXT");
  const sortAdded = await ensureColumn(db, "goals", "sort_order", "INTEGER NOT NULL DEFAULT 0");
  if (sortAdded) {
    const existing = await db.getAllAsync<{ id: string }>(
      "SELECT id FROM goals WHERE sort_order = 0 ORDER BY created_at ASC"
    );
    for (let i = 0; i < existing.length; i += 1) {
      await db.runAsync(
        "UPDATE goals SET sort_order = ? WHERE id = ?",
        [i + 1, existing[i].id]
      );
    }
  }
  await ensureColumn(db, "tasks", "priority", "TEXT NOT NULL DEFAULT 'medium'");
  await ensureColumn(db, "tasks", "category", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(db, "tasks", "due_date", "TEXT");
  await ensureColumn(db, "tasks", "reminder", "TEXT");

  await ensureColumn(db, "notes", "title", "TEXT");
  await ensureColumn(db, "notes", "pinned", "INTEGER NOT NULL DEFAULT 0");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS note_links (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id     TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL,
      entity_id   TEXT NOT NULL,
      UNIQUE(note_id, entity_type, entity_id)
    );
  `);
}

async function ensureColumn(
  db: ReturnType<typeof getDb>,
  table: string,
  column: string,
  type: string
): Promise<boolean> {
  const info = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (info.some((c) => c.name === column)) return false;
  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  return true;
}
