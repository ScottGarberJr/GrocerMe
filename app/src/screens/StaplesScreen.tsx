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

type Props = NativeStackScreenProps<RootStackParamList, 'Staples'>;

export const StaplesScreen: React.FC<Props> = ({ navigation }) => {
  const { stapleItems, toggleStapleOutOfStock, addItem } = useShopping();
  const [query, setQuery] = useState('');

  const filteredStaples = useMemo(
    () =>
      stapleItems.filter(item =>
        !query.trim()
          ? true
          : item.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [stapleItems, query],
  );

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
              await addItem({ name, isStaple: true });
              setQuery('');
            }}
          >
            <Text style={styles.suggestionPrimaryText}>
              + New staple called "{query.trim()}"
            </Text>
          </TouchableOpacity>

          {(() => {
            const lower = query.trim().toLowerCase();
            const matches = stapleItems.filter(item =>
              item.name.toLowerCase().includes(lower),
            );
            if (matches.length === 0) return null;
            return matches.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionRow}
                onPress={() => {
                  setQuery('');
                }}
              >
                <Text style={styles.suggestionText}>{item.name}</Text>
              </TouchableOpacity>
            ));
          })()}
        </View>
      )}

      <FlatList
        data={filteredStaples}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity
              style={[
                styles.flagPill,
                item.isOutOfStock && styles.flagPillActive,
              ]}
              onPress={() => toggleStapleOutOfStock(item.id, !item.isOutOfStock)}
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
        )}
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
});
