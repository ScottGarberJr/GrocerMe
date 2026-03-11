import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  getActiveItems,
  getStapleItems,
  getOutOfStockStaples,
  type Item,
} from '../db/dal';
import { initializeDatabase } from '../db/schema';

type ShoppingContextValue = {
  activeItems: Item[];
  stapleItems: Item[];
  outOfStockStaples: Item[];
  loading: boolean;
  refresh: () => Promise<void>;
  toggleItemCompleted: (id: number, isCompleted: boolean) => Promise<void>;
  toggleStapleOutOfStock: (id: number, isOutOfStock: boolean) => Promise<void>;
  addItem: (args: { name: string; isStaple: boolean }) => Promise<number>;
};

const ShoppingContext = createContext<ShoppingContextValue | undefined>(
  undefined,
);

export const ShoppingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeItems, setActiveItems] = useState<Item[]>([]);
  const [stapleItems, setStapleItems] = useState<Item[]>([]);
  const [outOfStockStaples, setOutOfStockStaples] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [active, staples, oos] = await Promise.all([
        getActiveItems(),
        getStapleItems(),
        getOutOfStockStaples(),
      ]);
      setActiveItems(active);
      setStapleItems(staples);
      setOutOfStockStaples(oos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      await loadAll();
    })();
  }, [loadAll]);

  const refresh = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  const toggleItemCompleted = useCallback(
    async (id: number, isCompleted: boolean) => {
      const { getDb } = await import('../db/schema');
      const db = await getDb();
      const now = new Date().toISOString();
      await db.runAsync(
        'UPDATE items SET isCompleted = ?, updated_at = ? WHERE id = ?',
        [isCompleted ? 1 : 0, now, id],
      );
      await loadAll();
    },
    [loadAll],
  );

  const toggleStapleOutOfStock = useCallback(
    async (id: number, isOutOfStock: boolean) => {
      const { getDb } = await import('../db/schema');
      const db = await getDb();
      const now = new Date().toISOString();
      await db.runAsync(
        'UPDATE items SET isOutOfStock = ?, updated_at = ? WHERE id = ?',
        [isOutOfStock ? 1 : 0, now, id],
      );
      await loadAll();
    },
    [loadAll],
  );

  const addItem = useCallback(
    async ({ name, isStaple }: { name: string; isStaple: boolean }) => {
      const { getDb } = await import('../db/schema');
      const db = await getDb();
      const now = new Date().toISOString();
      const result = await db.runAsync(
        `INSERT INTO items (name, isStaple, isCompleted, isOutOfStock, created_at, updated_at)
         VALUES (?, ?, 0, 0, ?, ?)`,
        [name.trim(), isStaple ? 1 : 0, now, now],
      );
      await loadAll();
      return result.lastInsertRowId;
    },
    [loadAll],
  );

  const value: ShoppingContextValue = {
    activeItems,
    stapleItems,
    outOfStockStaples,
    loading,
    refresh,
    toggleItemCompleted,
    toggleStapleOutOfStock,
    addItem,
  };

  return (
    <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>
  );
};

export const useShopping = (): ShoppingContextValue => {
  const ctx = useContext(ShoppingContext);
  if (!ctx) {
    throw new Error('useShopping must be used within a ShoppingProvider');
  }
  return ctx;
};
