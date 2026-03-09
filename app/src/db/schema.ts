import * as SQLite from 'expo-sqlite';

export type SQLiteDatabase = SQLite.SQLiteDatabase;

let dbInstance: SQLiteDatabase | null = null;

export const getDb = (): SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabase('grocerme.db');
  }
  return dbInstance;
};

export const initializeDatabase = (): void => {
  const db = getDb();

  db.withTransactionAsync?.(async () => {
    await db.execAsync?.(`
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
  }).catch?.((error: unknown) => {
    console.warn('Database initialization failed', error);
  });
};
