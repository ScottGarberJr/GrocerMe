import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useShopping } from '../state/ShoppingContext';

type Props = NativeStackScreenProps<RootStackParamList, 'MyList'>;

type Mode = 'store' | 'price' | 'latest';

export const MyListScreen: React.FC<Props> = ({ navigation }) => {
  const {
    activeItems,
    stapleItems,
    outOfStockStaples,
    toggleItemCompleted,
    addItem,
  } = useShopping();
  const [mode, setMode] = useState<Mode>('latest');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [query, setQuery] = useState('');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const filteredItems = useMemo(
    () =>
      activeItems.filter(item =>
        !query.trim()
          ? true
          : item.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [activeItems, query],
  );

  const handleRowPress = (id: string) => {
    if (showAllDetails) {
      return;
    }
    setExpandedId(current => (current === id ? null : id));
  };

  const renderModeLabel = (item: { priceLabel?: string | null }) => {
    if (!item.priceLabel) {
      return 'No price yet';
    }
    if (mode === 'store') {
      return item.priceLabel;
    }

    if (mode === 'price') {
      return `Lowest: ${item.priceLabel}`;
    }

    return `Latest: ${item.priceLabel}`;
  };

  const currentModeLabel = () => {
    if (mode === 'store') return 'Store mode';
    if (mode === 'price') return 'Price mode';
    return 'Latest mode';
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

      <FlatList
        data={filteredItems}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isExpanded = showAllDetails || expandedId === item.id;

          return (
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
                    <Text style={styles.itemDetailText}>{renderModeLabel(item)}</Text>
                    <TouchableOpacity
                      style={styles.itemActionButton}
                      onPress={() => navigation.navigate('Item')}
                    >
                      <Text style={styles.itemActionText}>Open</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

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
                  <Text style={styles.bottomStripPlus}>+</Text>
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E7EB',
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
});
