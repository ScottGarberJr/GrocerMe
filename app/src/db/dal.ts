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

