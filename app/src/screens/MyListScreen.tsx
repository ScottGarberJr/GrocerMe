import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useShopping } from '../state/ShoppingContext';
import { getBestPricePerItem, getLatestPricePerItem } from '../db/dal';

type Props = NativeStackScreenProps<RootStackParamList, 'MyList'>;

type Mode = 'store' | 'price' | 'latest';

type ModePriceInfo = {
  priceLabel: string;
  storeName: string | null;
};

type ListRow =
  | { type: 'header'; key: string; title: string }
  | { type: 'item'; key: string; item: any };

export const MyListScreen: React.FC<Props> = ({ navigation }) => {
  const {
    activeItems,
    stapleItems,
    outOfStockStaples,
    toggleItemCompleted,
    addItem,
    addItemToMyList,
    removeItemFromMyList,
    reorderMyListItems,
  } = useShopping();
  const [mode, setMode] = useState<Mode>('latest');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [query, setQuery] = useState('');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [modePriceMap, setModePriceMap] = useState<Record<number, ModePriceInfo>>({});
  const [listData, setListData] = useState<any[]>([]);
  const filteredItems = useMemo(
    () =>
      activeItems.filter(item =>
        !query.trim()
          ? true
          : item.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [activeItems, query],
  );

  // Keep a local copy of the current list order for drag-and-drop in
  // non-store modes when no search query is active.
  useEffect(() => {
    if (!query.trim() && mode !== 'store') {
      setListData(filteredItems);
    }
  }, [filteredItems, query, mode]);

  const formatPriceLabel = (price: number, storeName?: string | null) => {
    const formatted = `$${price.toFixed(2)}`;
    if (storeName && storeName.length > 0) {
      return `${formatted} at ${storeName}`;
    }
    return formatted;
  };

  useEffect(() => {
    let cancelled = false;

    const loadPrices = async () => {
      if (activeItems.length === 0) {
        if (!cancelled) {
          setModePriceMap({});
        }
        return;
      }

      try {
        if (mode === 'price') {
          const rows = await getBestPricePerItem();
          if (cancelled) return;
          const next: Record<number, ModePriceInfo> = {};
          for (const row of rows) {
            next[row.itemId] = {
              priceLabel: formatPriceLabel(row.unitPrice, row.storeName),
              storeName: row.storeName,
            };
          }
          setModePriceMap(next);
        } else {
          const rows = await getLatestPricePerItem();
          if (cancelled) return;
          const next: Record<number, ModePriceInfo> = {};
          for (const row of rows) {
            next[row.itemId] = {
              priceLabel: formatPriceLabel(row.unitPrice, row.storeName),
              storeName: row.storeName,
            };
          }
          setModePriceMap(next);
        }
      } catch (error) {
        console.warn('Failed to load price info', error);
      }
    };

    loadPrices();

    return () => {
      cancelled = true;
    };
  }, [activeItems, mode]);

  const handleRowPress = (id: string) => {
    if (showAllDetails) {
      return;
    }
    setExpandedId(current => (current === id ? null : id));
  };

  const renderModeLabel = (itemId: number) => {
    const info = modePriceMap[itemId];
    if (!info?.priceLabel) {
      return 'No price yet';
    }
    if (mode === 'store') {
      return info.priceLabel;
    }

    if (mode === 'price') {
      return `Lowest: ${info.priceLabel}`;
    }

    return `Latest: ${info.priceLabel}`;
  };

  const currentModeLabel = () => {
    if (mode === 'store') return 'Store mode';
    if (mode === 'price') return 'Price mode';
    return 'Latest mode';
  };

  const listRows: ListRow[] = useMemo(() => {
    if (mode !== 'store') {
      return [];
    }

    const groups: Record<string, any[]> = {};
    const order: string[] = [];

    filteredItems.forEach(item => {
      const info = modePriceMap[item.id];
      const title = info?.storeName && info.storeName.length > 0 ? info.storeName : 'No store set';
      if (!groups[title]) {
        groups[title] = [];
        order.push(title);
      }
      groups[title].push(item);
    });

    const rows: ListRow[] = [];
    order.forEach(title => {
      rows.push({ type: 'header', key: `header-${title}`, title });
      groups[title].forEach(item => {
        rows.push({ type: 'item', key: `item-${item.id}`, item });
      });
    });

    return rows;
  }, [filteredItems, mode, modePriceMap]);

  const renderDraggableItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<any>) => {
    const isExpanded = showAllDetails || expandedId === item.id;

    const rightActions = () => (
      <TouchableOpacity
        style={styles.removeAction}
        onPress={async () => {
          await removeItemFromMyList(item.id);
        }}
      >
        <Text style={styles.removeActionText}>Remove</Text>
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={rightActions} overshootRight={false}>
        <TouchableOpacity
          style={[styles.itemRow, isActive && styles.itemRowActive]}
          onPress={() => handleRowPress(item.id)}
          onLongPress={drag}
          delayLongPress={150}
        >
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragDotRow}>
              <View style={styles.dragDot} />
              <View style={styles.dragDot} />
            </View>
            <View style={styles.dragDotRow}>
              <View style={styles.dragDot} />
              <View style={styles.dragDot} />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.checkbox, item.isCompleted && styles.checkboxChecked]}
            onPress={() => toggleItemCompleted(item.id, !item.isCompleted)}
          />
          <View style={styles.itemTextContainer}>
            <Text
              style={[
                styles.itemName,
                item.isCompleted && styles.itemNameCompleted,
              ]}
            >
              {item.name}
            </Text>
            {isExpanded && (
              <View style={styles.itemDetailRow}>
                <Text style={styles.itemDetailText}>{renderModeLabel(item.id)}</Text>
                <TouchableOpacity
                  style={styles.itemActionButton}
                  onPress={() => navigation.navigate('Item', { itemId: item.id })}
                >
                  <Text style={styles.itemActionText}>Open</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, styles.tabTextActive]}>My List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Staples')}
          >
            <Text style={styles.tabText}>Staples</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.gearButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.gearText}>⚙︎</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Add or search items..."
          returnKeyType="done"
        />
      </View>

      {query.trim().length > 0 && (
        <View style={styles.suggestionsContainer}>
          <TouchableOpacity
            style={styles.suggestionRowPrimary}
            onPress={async () => {
              const name = query.trim();
              if (!name) return;
              await addItem({ name, isStaple: false });
              setQuery('');
              setShowAllDetails(true);
            }}
          >
            <Text style={styles.suggestionPrimaryText}>
              + New item called "{query.trim()}"
            </Text>
          </TouchableOpacity>

          {(() => {
            const lower = query.trim().toLowerCase();
            const all = [...activeItems, ...stapleItems];
            const seen = new Set<number>();
            const matches = all.filter(item => {
              if (!item.name.toLowerCase().includes(lower)) return false;
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
            if (matches.length === 0) return null;
            return matches.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionRow}
                onPress={async () => {
                  await toggleItemCompleted(item.id, false);
                  setQuery('');
                  setShowAllDetails(true);
                }}
              >
                <Text style={styles.suggestionText}>{item.name}</Text>
              </TouchableOpacity>
            ));
          })()}
        </View>
      )}

      <View
        style={styles.listContainer}
        pointerEvents={query.trim().length > 0 ? 'none' : 'auto'}
      >
        {mode === 'store' ? (
          <FlatList
            style={styles.list}
            data={listRows}
            keyExtractor={(row: ListRow) => row.key}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: row }) => {
            if (row.type === 'header') {
              return (
                <View style={styles.storeHeaderRow}>
                  <Text style={styles.storeHeaderText}>{row.title}</Text>
                </View>
              );
            }

            const item = row.item;
            const isExpanded = showAllDetails || expandedId === item.id;

            const rightActions = () => (
              <TouchableOpacity
                style={styles.removeAction}
                onPress={async () => {
                  await removeItemFromMyList(item.id);
                }}
              >
                <Text style={styles.removeActionText}>Remove</Text>
              </TouchableOpacity>
            );

            return (
              <Swipeable renderRightActions={rightActions} overshootRight={false}>
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => handleRowPress(item.id)}
                >
                  <TouchableOpacity
                    style={[styles.checkbox, item.isCompleted && styles.checkboxChecked]}
                    onPress={() => toggleItemCompleted(item.id, !item.isCompleted)}
                  />
                  <View style={styles.itemTextContainer}>
                    <Text
                      style={[
                        styles.itemName,
                        item.isCompleted && styles.itemNameCompleted,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isExpanded && (
                      <View style={styles.itemDetailRow}>
                        <Text style={styles.itemDetailText}>{renderModeLabel(item.id)}</Text>
                        <TouchableOpacity
                          style={styles.itemActionButton}
                          onPress={() =>
                            navigation.navigate('Item', { itemId: item.id })
                          }
                        >
                          <Text style={styles.itemActionText}>Open</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Swipeable>
            );
            }}
          />
        ) : (
          <DraggableFlatList
            style={styles.list}
            data={listData}
            keyExtractor={(item: any) => String(item.id)}
            contentContainerStyle={styles.listContent}
            onDragEnd={async ({ data }: { data: any[] }) => {
              setListData(data);
              const orderedIds = data.map((x: any) => x.id as number);
              await reorderMyListItems(orderedIds);
            }}
            renderItem={renderDraggableItem}
          />
        )}
      </View>

      <View style={styles.bottomControlsRow}>
        <View style={styles.modeSwitcher}>
          {!modeMenuOpen && (
            <TouchableOpacity
              style={styles.modePill}
              activeOpacity={0.8}
              onPress={() => setModeMenuOpen(true)}
            >
              <Text style={styles.modePillText}>{currentModeLabel()}</Text>
            </TouchableOpacity>
          )}
          {modeMenuOpen && (
            <View style={styles.modeMenu}>
              {(['store', 'price', 'latest'] as Mode[]).map(option => {
                const isActive = option === mode;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modeMenuItem,
                      isActive && styles.modeMenuItemActive,
                    ]}
                    onPress={() => {
                      setMode(option);
                      setShowAllDetails(true);
                      setModeMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modeMenuItemText,
                        isActive && styles.modeMenuItemTextActive,
                      ]}
                    >
                      {option === 'store'
                        ? 'Store mode'
                        : option === 'price'
                        ? 'Price mode'
                        : 'Latest mode'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.infoToggleButton}
          onPress={() => setShowAllDetails(current => !current)}
        >
          <Text style={styles.infoToggleText}>
            {showAllDetails ? "Hide each item's info" : "Show each item's info"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomStrip}>
        <Text style={styles.bottomStripTitle}>Out-of-stock staples</Text>
        <View style={styles.bottomStripContent}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', flex: 1 }}>
            {outOfStockStaples.length === 0 ? (
              <Text style={styles.bottomStripHint}>None right now</Text>
            ) : (
              outOfStockStaples.map(item => (
                <View key={item.id} style={styles.bottomStripPill}>
                  <Text style={styles.bottomStripPillText}>{item.name}</Text>
                  <TouchableOpacity
                    onPress={async () => {
                      await addItemToMyList(item.id);
                    }}
                  >
                    <Text style={styles.bottomStripPlus}>+</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
          {outOfStockStaples.length > 0 && (
            <Text style={styles.bottomStripHint}>Tap + to add to list</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabRow: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
    backgroundColor: '#E4E7EB',
    borderRadius: 18,
    padding: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    color: '#52606D',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  gearButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  gearText: {
    fontSize: 24,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#CBD2E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  suggestionsContainer: {
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  suggestionRowPrimary: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E7EB',
  },
  suggestionPrimaryText: {
    fontSize: 15,
    color: '#2D6CDF',
    fontWeight: '600',
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1F2933',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  dragHandleContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  dragDotRow: {
    flexDirection: 'row',
    marginVertical: 1,
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#9FB3C8',
    marginHorizontal: 1,
  },
  storeHeaderRow: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E7EB',
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 4,
  },
  storeHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52606D',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E7EB',
  },
  itemRowActive: {
    backgroundColor: '#F0F4FF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD2E1',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#1F2933',
  },
  itemNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#9FB3C8',
  },
  itemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  itemDetailText: {
    fontSize: 13,
    color: '#52606D',
    flex: 1,
    marginRight: 8,
  },
  itemActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F2F4F7',
  },
  itemActionText: {
    fontSize: 13,
    color: '#2D6CDF',
    fontWeight: '500',
  },
  bottomStrip: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E7EB',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  infoToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F4F7',
  },
  infoToggleText: {
    fontSize: 13,
    color: '#52606D',
    fontWeight: '500',
  },
  bottomControlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  modeSwitcher: {
    alignItems: 'flex-start',
    position: 'relative',
  },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#2D6CDF',
  },
  modePillText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modeMenu: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  modeMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginTop: 4,
    backgroundColor: '#F2F4F7',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modeMenuItemText: {
    fontSize: 13,
    color: '#111827',
  },
  modeMenuItemActive: {
    backgroundColor: '#2D6CDF',
  },
  modeMenuItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomStripTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#52606D',
  },
  bottomStripContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomStripPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E6F4FE',
  },
  bottomStripPillText: {
    fontSize: 13,
    color: '#1F2933',
    marginRight: 6,
  },
  bottomStripPlus: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D6CDF',
  },
  bottomStripHint: {
    fontSize: 12,
    color: '#9FB3C8',
  },
  removeAction: {
    width: 90,
    backgroundColor: '#F9703E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
