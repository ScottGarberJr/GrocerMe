import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useShopping } from '../state/ShoppingContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Staples'>;

export const StaplesScreen: React.FC<Props> = ({ navigation }) => {
  const {
    activeItems,
    stapleItems,
    toggleStapleOutOfStock,
    addItem,
    removeItemFromStaples,
    setItemIsStaple,
    reorderStapleItems,
  } = useShopping();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [listData, setListData] = useState<any[]>([]);

  const filteredStaples = useMemo(
    () =>
      stapleItems.filter(item =>
        !query.trim()
          ? true
          : item.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [stapleItems, query],
  );

  // Local order for drag-and-drop when no search query is active.
  React.useEffect(() => {
    if (!query.trim()) {
      setListData(filteredStaples);
    }
  }, [filteredStaples, query]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={styles.tabButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MyList')}
          >
            <Text style={styles.tabText}>My List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, styles.tabTextActive]}>Staples</Text>
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
          placeholder="Add or search staples..."
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
              await addItem({ name, isStaple: true, addToMyList: false });
              setQuery('');
            }}
          >
            <Text style={styles.suggestionPrimaryText}>
              + New staple called "{query.trim()}"
            </Text>
          </TouchableOpacity>

          {(() => {
            const lower = query.trim().toLowerCase();
            const all = [...stapleItems, ...activeItems];
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
                  await setItemIsStaple(item.id, true);
                  setQuery('');
                }}
              >
                <Text style={styles.suggestionText}>{item.name}</Text>
              </TouchableOpacity>
            ));
          })()}
        </View>
      )}

      <DraggableFlatList
        pointerEvents={query.trim().length > 0 ? 'none' : 'auto'}
        data={listData}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={styles.listContent}
        onDragEnd={async ({ data }: { data: any[] }) => {
          setListData(data);
          const orderedIds = data.map((x: any) => x.id as number);
          await reorderStapleItems(orderedIds);
        }}
        renderItem={({ item, drag, isActive }: RenderItemParams<any>) => {
          const isExpanded = expandedId === item.id;

          const rightActions = () => (
            <TouchableOpacity
              style={styles.removeAction}
              onPress={async () => {
                await removeItemFromStaples(item.id);
              }}
            >
              <Text style={styles.removeActionText}>Remove</Text>
            </TouchableOpacity>
          );

          return (
            <Swipeable renderRightActions={rightActions} overshootRight={false}>
              <TouchableOpacity
                style={[styles.row, isActive && styles.rowActive]}
                onPress={() =>
                  setExpandedId(current =>
                    current === item.id ? null : item.id,
                  )
                }
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

                <View style={styles.rowMain}>
                  <Text style={styles.name}>{item.name}</Text>
                  <TouchableOpacity
                    style={[
                      styles.flagPill,
                      item.isOutOfStock && styles.flagPillActive,
                    ]}
                    onPress={() =>
                      toggleStapleOutOfStock(item.id, !item.isOutOfStock)
                    }
                  >
                    <Text
                      style={[
                        styles.flagText,
                        item.isOutOfStock && styles.flagTextActive,
                      ]}
                    >
                      {item.isOutOfStock ? 'Out of stock' : 'In stock'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isExpanded && (
                  <View style={styles.itemDetailRow}>
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
              </TouchableOpacity>
            </Swipeable>
          );
        }}
      />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E7EB',
  },
  rowActive: {
    backgroundColor: '#F0F4FF',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    color: '#1F2933',
  },
  flagPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD2E1',
    backgroundColor: '#FFFFFF',
  },
  flagPillActive: {
    borderColor: '#F9703E',
    backgroundColor: '#FFF3E8',
  },
  flagText: {
    fontSize: 13,
    color: '#52606D',
  },
  flagTextActive: {
    color: '#F35627',
    fontWeight: '600',
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
  itemDetailRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
