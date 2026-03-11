import { getDb } from './schema';

export type Item = {
  id: number;
  name: string;
  isStaple: boolean;
  isCompleted: boolean;
  isOutOfStock: boolean;
  lastPurchasedAt: string | null;
  lastPurchasedStoreId: number | null;
  created_at: string;
  updated_at: string;
};

export type Store = {
  id: number;
  name: string;
};

export type ItemPriceRow = {
  itemId: number;
  storeId: number;
  storeName: string;
  unitPrice: number;
};

const mapRowToItem = (row: any): Item => ({
  id: row.id,
  name: row.name,
  isStaple: row.isStaple === 1,
  isCompleted: row.isCompleted === 1,
  isOutOfStock: row.isOutOfStock === 1,
  lastPurchasedAt: row.lastPurchasedAt ?? null,
  lastPurchasedStoreId: row.lastPurchasedStoreId ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const getItemsByQuery = async (
  query: string,
  params: any[] = [],
): Promise<Item[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(query, params);
  return rows.map(mapRowToItem);
};

export const getActiveItems = (): Promise<Item[]> =>
  getItemsByQuery('SELECT * FROM items ORDER BY isCompleted ASC, created_at DESC');

export const getStapleItems = (): Promise<Item[]> =>
  getItemsByQuery('SELECT * FROM items WHERE isStaple = 1 ORDER BY name ASC');

export const getOutOfStockStaples = (): Promise<Item[]> =>
  getItemsByQuery(
    'SELECT * FROM items WHERE isStaple = 1 AND isOutOfStock = 1 ORDER BY name ASC',
  );

export const getItemById = async (id: number): Promise<Item | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM items WHERE id = ?', [id]);
  if (!row) return null;
  return mapRowToItem(row);
};

export const getOrCreateStoreByName = async (name: string): Promise<Store> => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Store name must be non-empty');
  }

  const db = await getDb();
  const existing = await db.getFirstAsync<any>(
    'SELECT id, name FROM stores WHERE name = ?',
    [trimmed],
  );
  if (existing) {
    return { id: existing.id, name: existing.name };
  }

  const result = await db.runAsync('INSERT INTO stores (name) VALUES (?)', [trimmed]);
  return { id: result.lastInsertRowId, name: trimmed };
};

export const addPriceHistoryEntry = async (args: {
  itemId: number;
  storeName: string;
  unitPrice: number;
  kind: 'seen' | 'purchased';
  recordedAt?: string;
}): Promise<void> => {
  const db = await getDb();
  const store = await getOrCreateStoreByName(args.storeName);
  const recordedAt = args.recordedAt ?? new Date().toISOString();
  await db.runAsync(
    `INSERT INTO price_history (item_id, store_id, unit_price, recorded_at, kind)
     VALUES (?, ?, ?, ?, ?)`,
    [args.itemId, store.id, args.unitPrice, recordedAt, args.kind],
  );
};

export const getLatestPriceForItem = async (
  itemId: number,
): Promise<ItemPriceRow | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    `SELECT
       ph.item_id AS itemId,
       ph.store_id AS storeId,
       s.name AS storeName,
       ph.unit_price AS unitPrice
     FROM price_history ph
     JOIN stores s ON s.id = ph.store_id
     WHERE ph.item_id = ?
     ORDER BY ph.recorded_at DESC
     LIMIT 1`,
    [itemId],
  );

  if (!row) {
    return null;
  }

  return {
    itemId: row.itemId,
    storeId: row.storeId,
    storeName: row.storeName,
    unitPrice: row.unitPrice,
  };
};

export const getLatestPricePerItem = async (): Promise<ItemPriceRow[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `WITH latest AS (
       SELECT item_id, MAX(recorded_at) AS recorded_at
       FROM price_history
       GROUP BY item_id
     )
     SELECT
       ph.item_id AS itemId,
       ph.store_id AS storeId,
       s.name AS storeName,
       ph.unit_price AS unitPrice
     FROM price_history ph
     JOIN latest l
       ON l.item_id = ph.item_id AND l.recorded_at = ph.recorded_at
     JOIN stores s ON s.id = ph.store_id`,
  );

  return rows.map(row => ({
    itemId: row.itemId,
    storeId: row.storeId,
    storeName: row.storeName,
    unitPrice: row.unitPrice,
  }));
};

export const getBestPricePerItem = async (): Promise<ItemPriceRow[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `WITH latest_per_store AS (
       SELECT
         item_id,
         store_id,
         MAX(recorded_at) AS recorded_at
       FROM price_history
       GROUP BY item_id, store_id
     ),
     latest_price_per_store AS (
       SELECT
         lps.item_id,
         lps.store_id,
         ph.unit_price,
         ph.recorded_at
       FROM latest_per_store lps
       JOIN price_history ph
         ON ph.item_id = lps.item_id
        AND ph.store_id = lps.store_id
        AND ph.recorded_at = lps.recorded_at
     ),
     best_price AS (
       SELECT
         item_id,
         MIN(unit_price) AS minUnitPrice
       FROM latest_price_per_store
       GROUP BY item_id
     )
     SELECT
       lps.item_id AS itemId,
       lps.store_id AS storeId,
       s.name AS storeName,
       lps.unit_price AS unitPrice
     FROM latest_price_per_store lps
     JOIN best_price bp
       ON bp.item_id = lps.item_id AND bp.minUnitPrice = lps.unit_price
     JOIN stores s ON s.id = lps.store_id`,
  );

  return rows.map(row => ({
    itemId: row.itemId,
    storeId: row.storeId,
    storeName: row.storeName,
    unitPrice: row.unitPrice,
  }));
};

