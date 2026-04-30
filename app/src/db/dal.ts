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

export const getActiveItems = async (): Promise<Item[]> => {
  const items = await getItemsByQuery(
    `SELECT
       i.*,
       CASE WHEN st.item_id IS NULL THEN 0 ELSE 1 END AS isStaple,
       0 AS isCompleted,
       COALESCE(st.isOutOfStock, 0) AS isOutOfStock
     FROM items i
     JOIN my_list_entries mle ON mle.item_id = i.id AND mle.status = 'active'
     LEFT JOIN staples st ON st.item_id = i.id
     ORDER BY
       CASE WHEN mle.sortOrder IS NULL THEN 1 ELSE 0 END,
       mle.sortOrder ASC,
       mle.created_at DESC`,
  );
  console.log('[DB] getActiveItems returned', items.length, 'rows');
  return items;
};

export const getStapleItems = (): Promise<Item[]> =>
  getItemsByQuery(
    `SELECT
       i.*,
       1 AS isStaple,
       CASE WHEN mle.id IS NULL THEN 0 ELSE 1 END AS isCompleted,
       st.isOutOfStock AS isOutOfStock
     FROM staples st
     JOIN items i ON i.id = st.item_id
     LEFT JOIN my_list_entries mle
       ON mle.item_id = i.id AND mle.status = 'active'
     ORDER BY
       CASE WHEN st.sortOrder IS NULL THEN 1 ELSE 0 END,
       st.sortOrder ASC,
       name ASC`,
  );

export const getOutOfStockStaples = (): Promise<Item[]> =>
  getItemsByQuery(
    `SELECT
       i.*,
       1 AS isStaple,
       CASE WHEN mle.id IS NULL THEN 0 ELSE 1 END AS isCompleted,
       st.isOutOfStock AS isOutOfStock
     FROM staples st
     JOIN items i ON i.id = st.item_id
     LEFT JOIN my_list_entries mle
       ON mle.item_id = i.id AND mle.status = 'active'
     WHERE st.isOutOfStock = 1
     ORDER BY i.name ASC`,
  );

export const getItemById = async (id: number): Promise<Item | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM items WHERE id = ?', [id]);
  if (!row) return null;
  return mapRowToItem(row);
};

export const createItem = async (args: {
  name: string;
  isStaple: boolean;
}): Promise<number> => {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO items (name, isStaple, isCompleted, isOutOfStock, created_at, updated_at)
     VALUES (?, ?, 1, 0, ?, ?)`,
    [args.name.trim(), args.isStaple ? 1 : 0, now, now],
  );

  if (args.isStaple) {
    await db.runAsync(
      `INSERT OR IGNORE INTO staples (item_id, isOutOfStock, created_at, updated_at)
       VALUES (?, 0, ?, ?)`,
      [result.lastInsertRowId, now, now],
    );
  }

  return result.lastInsertRowId;
};

export const addItemToMyList = async (itemId: number): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();

  // Check for ANY existing row — active or completed.
  const existing = await db.getFirstAsync<{ id: number; status: string }>(
    `SELECT id, status FROM my_list_entries WHERE item_id = ? LIMIT 1`,
    [itemId],
  );

  if (existing) {
    if (existing.status === 'active') {
      // Already on the list — nothing to do.
      console.log('[DB] addItemToMyList: already active, item', itemId);
      return;
    }
    // Re-activate a completed row.
    console.log('[DB] addItemToMyList: re-activating completed row for item', itemId);
    await db.runAsync(
      `UPDATE my_list_entries SET status = 'active', updated_at = ? WHERE id = ?`,
      [now, existing.id],
    );
  } else {
    console.log('[DB] addItemToMyList: inserting new row for item', itemId);
    await db.runAsync(
      `INSERT INTO my_list_entries (item_id, status, created_at, updated_at)
       VALUES (?, 'active', ?, ?)`,
      [itemId, now, now],
    );
  }

  // Legacy mirror for existing local DB compatibility.
  await db.runAsync(
    'UPDATE items SET isCompleted = 0, updated_at = ? WHERE id = ?',
    [now, itemId],
  );
};

export const removeItemFromMyList = async (itemId: number): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `DELETE FROM my_list_entries
     WHERE item_id = ? AND status = 'active'`,
    [itemId],
  );

  // Legacy mirror for existing local DB compatibility.
  await db.runAsync(
    'UPDATE items SET isCompleted = 1, updated_at = ? WHERE id = ?',
    [now, itemId],
  );
};

export const setItemCompleted = async (
  itemId: number,
  isCompleted: boolean,
): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();

  if (isCompleted) {
    await db.runAsync(
      `UPDATE my_list_entries
       SET status = 'completed', updated_at = ?
       WHERE item_id = ? AND status = 'active'`,
      [now, itemId],
    );
    await db.runAsync('UPDATE items SET isCompleted = 1, updated_at = ? WHERE id = ?', [
      now,
      itemId,
    ]);
  } else {
    await addItemToMyList(itemId);
  }
};

export const setItemIsStaple = async (
  itemId: number,
  isStaple: boolean,
): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.runAsync('UPDATE items SET isStaple = ?, updated_at = ? WHERE id = ?', [
    isStaple ? 1 : 0,
    now,
    itemId,
  ]);

  if (isStaple) {
    await db.runAsync(
      `INSERT OR IGNORE INTO staples (item_id, isOutOfStock, created_at, updated_at)
       VALUES (?, 0, ?, ?)`,
      [itemId, now, now],
    );
    await db.runAsync('UPDATE staples SET updated_at = ? WHERE item_id = ?', [
      now,
      itemId,
    ]);
  } else {
    await db.runAsync('DELETE FROM staples WHERE item_id = ?', [itemId]);
  }
};

export const setStapleOutOfStock = async (
  itemId: number,
  isOutOfStock: boolean,
): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE staples
     SET isOutOfStock = ?, updated_at = ?
     WHERE item_id = ?`,
    [isOutOfStock ? 1 : 0, now, itemId],
  );

  // Legacy mirror while old columns still exist.
  await db.runAsync('UPDATE items SET isOutOfStock = ?, updated_at = ? WHERE id = ?', [
    isOutOfStock ? 1 : 0,
    now,
    itemId,
  ]);
};

export const reorderMyListItems = async (orderedIds: number[]): Promise<void> => {
  if (orderedIds.length === 0) return;
  const db = await getDb();
  const now = new Date().toISOString();

  let position = 0;
  for (const itemId of orderedIds) {
    await db.runAsync(
      `UPDATE my_list_entries
       SET sortOrder = ?, updated_at = ?
       WHERE item_id = ? AND status = 'active'`,
      [position++, now, itemId],
    );
  }
};

export const reorderStapleItems = async (orderedIds: number[]): Promise<void> => {
  if (orderedIds.length === 0) return;
  const db = await getDb();
  const now = new Date().toISOString();

  let position = 0;
  for (const itemId of orderedIds) {
    await db.runAsync(
      `UPDATE staples
       SET sortOrder = ?, updated_at = ?
       WHERE item_id = ?`,
      [position++, now, itemId],
    );
  }
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

