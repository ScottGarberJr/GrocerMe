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

  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        isStaple INTEGER NOT NULL DEFAULT 0,
        isCompleted INTEGER NOT NULL DEFAULT 0,
        isOutOfStock INTEGER NOT NULL DEFAULT 0,
        lastPurchasedAt TEXT,
        lastPurchasedStoreId INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        recorded_at TEXT NOT NULL,
        kind TEXT NOT NULL,
        FOREIGN KEY (item_id) REFERENCES items(id),
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );
    `);
  } catch (error) {
    console.warn('Database initialization failed', error);
  }
};

