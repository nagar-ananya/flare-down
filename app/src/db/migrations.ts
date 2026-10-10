import type { SQLiteDatabase } from 'expo-sqlite';

import { DROP_ALL, MIGRATIONS, SCHEMA_VERSION } from './schema';

const VERSION_KEY = 'schema_version';

async function readVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM meta WHERE key = ?;',
      VERSION_KEY,
    );
    return row ? Number(row.value) : 0;
  } catch {
    return 0;
  }
}

async function writeVersion(db: SQLiteDatabase, version: number): Promise<void> {
  await db.runAsync(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
    VERSION_KEY,
    String(version),
  );
}

// Each step and its version bump commit together, and the version is checked again
// under the write lock, so a crash or a second app start can't apply a step twice.
async function applyMigration(db: SQLiteDatabase, version: number): Promise<void> {
  await db.execAsync('BEGIN IMMEDIATE;');
  try {
    if ((await readVersion(db)) === version) {
      for (const statement of MIGRATIONS[version]) {
        await db.execAsync(statement);
      }
      await writeVersion(db, version + 1);
    }
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

export async function runMigrations(db: SQLiteDatabase): Promise<number> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA busy_timeout = 5000;');

  for (let version = await readVersion(db); version < MIGRATIONS.length; version++) {
    await applyMigration(db, version);
  }
  return readVersion(db);
}

export async function resetDatabase(db: SQLiteDatabase): Promise<void> {
  for (const statement of DROP_ALL) {
    await db.execAsync(statement);
  }
  for (const migration of MIGRATIONS) {
    for (const statement of migration) {
      await db.execAsync(statement);
    }
  }
  await writeVersion(db, SCHEMA_VERSION);
}
