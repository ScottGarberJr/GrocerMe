import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  addItemToMyList,
  addPriceHistoryEntry,
  createItem,
  getActiveItems,
  getLatestPriceForItem,
  getStapleItems,
  getOutOfStockStaples,
  removeItemFromMyList,
  reorderMyListItems,
  reorderStapleItems,
  setItemCompleted,
  setItemIsStaple as setItemIsStapleMembership,
  setStapleOutOfStock,
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
  addItem: (args: {
    name: string;
    isStaple: boolean;
    addToMyList?: boolean;
  }) => Promise<number>;
  addItemToMyList: (id: number) => Promise<void>;
  removeItemFromMyList: (id: number) => Promise<void>;
  removeItemFromStaples: (id: number) => Promise<void>;
  setItemIsStaple: (id: number, isStaple: boolean) => Promise<void>;
  reorderMyListItems: (orderedIds: number[]) => Promise<void>;
  reorderStapleItems: (orderedIds: number[]) => Promise<void>;
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
      if (isCompleted) {
        const latestPrice = await getLatestPriceForItem(id);
        if (latestPrice) {
          await addPriceHistoryEntry({
            itemId: id,
            storeName: latestPrice.storeName,
            unitPrice: latestPrice.unitPrice,
            kind: 'purchased',
          });
        }
      }

      await setItemCompleted(id, isCompleted);
      await loadAll();
    },
    [loadAll],
  );

  const toggleStapleOutOfStock = useCallback(
    async (id: number, isOutOfStock: boolean) => {
      await setStapleOutOfStock(id, isOutOfStock);
      await loadAll();
    },
    [loadAll],
  );

  const addItem = useCallback(
    async ({
      name,
      isStaple,
      addToMyList = true,
    }: {
      name: string;
      isStaple: boolean;
      addToMyList?: boolean;
    }) => {
      const itemId = await createItem({ name, isStaple });
      if (addToMyList) {
        await addItemToMyList(itemId);
      }
      await loadAll();
      return itemId;
    },
    [loadAll],
  );

  const addItemToMyListHandler = useCallback(
    async (id: number) => {
      await addItemToMyList(id);
      await loadAll();
    },
    [loadAll],
  );

  const removeItemFromMyListHandler = useCallback(
    async (id: number) => {
      await removeItemFromMyList(id);
      await loadAll();
    },
    [loadAll],
  );

  const removeItemFromStaplesHandler = useCallback(
    async (id: number) => {
      await setItemIsStapleMembership(id, false);
      await loadAll();
    },
    [loadAll],
  );

  const setItemIsStaple = useCallback(
    async (id: number, isStaple: boolean) => {
      await setItemIsStapleMembership(id, isStaple);
      await loadAll();
    },
    [loadAll],
  );

  const reorderMyList = useCallback(
    async (orderedIds: number[]) => {
      await reorderMyListItems(orderedIds);
      await loadAll();
    },
    [loadAll],
  );

  const reorderStaples = useCallback(
    async (orderedIds: number[]) => {
      await reorderStapleItems(orderedIds);
      await loadAll();
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
    addItemToMyList: addItemToMyListHandler,
    removeItemFromMyList: removeItemFromMyListHandler,
    removeItemFromStaples: removeItemFromStaplesHandler,
    setItemIsStaple,
    reorderMyListItems: reorderMyList,
    reorderStapleItems: reorderStaples,
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
