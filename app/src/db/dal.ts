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

export const getActiveItems = async (): Promise<Item[]> => {
  const db = getDb();
  const result = await db.getAllAsync?.(
    'SELECT * FROM items WHERE isCompleted = 0 ORDER BY created_at DESC',
  );
  return (result ?? []).map(mapRowToItem);
};

export const getStapleItems = async (): Promise<Item[]> => {
  const db = getDb();
  const result = await db.getAllAsync?.(
    'SELECT * FROM items WHERE isStaple = 1 ORDER BY name ASC',
  );
  return (result ?? []).map(mapRowToItem);
};

export const getOutOfStockStaples = async (): Promise<Item[]> => {
  const db = getDb();
  const result = await db.getAllAsync?.(
    'SELECT * FROM items WHERE isStaple = 1 AND isOutOfStock = 1 ORDER BY name ASC',
  );
  return (result ?? []).map(mapRowToItem);
};
