import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';

let dbPromise: Promise<SQLiteDatabase> | null = null;

export const getDb = async (): Promise<SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync('grocerme.db');
  }
  return dbPromise;
};

export const initializeDatabase = async (): Promise<void> => {
  const db = await getDb();

  // Step 1: Create base tables. Each statement is isolated so one failure
  // doesn't prevent the others from running.
  const tableDefs = [
    `CREATE TABLE IF NOT EXISTS items (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT NOT NULL,
       isStaple INTEGER NOT NULL DEFAULT 0,
       isCompleted INTEGER NOT NULL DEFAULT 0,
       isOutOfStock INTEGER NOT NULL DEFAULT 0,
       lastPurchasedAt TEXT,
       lastPurchasedStoreId INTEGER,
       sortOrder INTEGER,
       created_at TEXT NOT NULL,
       updated_at TEXT NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS stores (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS price_history (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       item_id INTEGER NOT NULL,
       store_id INTEGER NOT NULL,
       unit_price REAL NOT NULL,
       recorded_at TEXT NOT NULL,
       kind TEXT NOT NULL,
       FOREIGN KEY (item_id) REFERENCES items(id),
       FOREIGN KEY (store_id) REFERENCES stores(id)
     )`,
    `CREATE TABLE IF NOT EXISTS staples (
       item_id INTEGER PRIMARY KEY,
       isOutOfStock INTEGER NOT NULL DEFAULT 0,
       sortOrder INTEGER,
       created_at TEXT NOT NULL,
       updated_at TEXT NOT NULL,
       FOREIGN KEY (item_id) REFERENCES items(id)
     )`,
    `CREATE TABLE IF NOT EXISTS my_list_entries (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       item_id INTEGER NOT NULL,
       status TEXT NOT NULL DEFAULT 'active',
       sortOrder INTEGER,
       created_at TEXT NOT NULL,
       updated_at TEXT NOT NULL,
       FOREIGN KEY (item_id) REFERENCES items(id)
     )`,
  ];

  for (const sql of tableDefs) {
    try {
      await db.execAsync(sql);
    } catch (e) {
      console.warn('[DB] Table creation warning:', e);
    }
  }

  // Step 2: Best-effort column migrations.
  try {
    await db.execAsync('ALTER TABLE items ADD COLUMN sortOrder INTEGER');
  } catch (_) {
    // Column already exists — expected on subsequent launches.
  }

  // Step 3: Drop old partial index if it exists (partial indexes can fail on
  // some SQLite builds), then add a plain unique index instead.
  try {
    await db.execAsync('DROP INDEX IF EXISTS idx_my_list_active_item');
  } catch (_) {}
  try {
    await db.execAsync(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_my_list_item_unique ON my_list_entries(item_id)'
    );
  } catch (e) {
    console.warn('[DB] my_list_entries unique index warning:', e);
  }

  // Step 4: Backfill staples membership table.
  try {
    await db.execAsync(`
      INSERT OR IGNORE INTO staples (item_id, isOutOfStock, sortOrder, created_at, updated_at)
      SELECT id, isOutOfStock, sortOrder, created_at, updated_at
      FROM items WHERE isStaple = 1
    `);
    await db.execAsync(`
      UPDATE staples
      SET isOutOfStock = (SELECT i.isOutOfStock FROM items i WHERE i.id = staples.item_id),
          updated_at   = (SELECT i.updated_at   FROM items i WHERE i.id = staples.item_id)
      WHERE item_id IN (SELECT id FROM items WHERE isStaple = 1)
    `);
  } catch (e) {
    console.warn('[DB] Staples backfill warning:', e);
  }

  // Step 5: Backfill my_list_entries from legacy isCompleted flag.
  // Items with isCompleted=0 were "on the list" in the old schema.
  // If my_list_entries is completely empty, also pull in all items so the
  // user's existing data doesn't disappear after the schema migration.
  try {
    const { count } = (await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM my_list_entries'
    )) ?? { count: 0 };

    console.log('[DB] my_list_entries row count at init:', count);

    if (count === 0) {
      // Fresh migration: seed from legacy isCompleted flag.
      const result = await db.runAsync(`
        INSERT OR IGNORE INTO my_list_entries (item_id, status, sortOrder, created_at, updated_at)
        SELECT id, 'active', sortOrder, created_at, updated_at
        FROM items WHERE isCompleted = 0
      `);
      console.log('[DB] Backfilled', result.changes, 'items into my_list_entries');
    }
  } catch (e) {
    console.warn('[DB] my_list_entries backfill warning:', e);
  }

  // Diagnostic: log table row counts.
  try {
    const ic = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM items');
    const mc = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM my_list_entries');
    const sc = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM staples');
    console.log('[DB] Init complete — items:', ic?.count, ' my_list_entries:', mc?.count, ' staples:', sc?.count);
  } catch (_) {}
};

