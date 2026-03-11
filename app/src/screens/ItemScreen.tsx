import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useShopping } from '../state/ShoppingContext';
import { addPriceHistoryEntry, getItemById, getLatestPriceForItem } from '../db/dal';

type Props = NativeStackScreenProps<RootStackParamList, 'Item'>;

export const ItemScreen: React.FC<Props> = ({ navigation, route }) => {
  const { addItem, refresh } = useShopping();
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [price, setPrice] = useState('');
  const [isStaple, setIsStaple] = useState(true);

  const itemId = route.params?.itemId;

  useEffect(() => {
    if (!itemId) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      const item = await getItemById(itemId);
      if (!item || cancelled) return;

      setName(item.name);
      setIsStaple(item.isStaple);

      const latestPrice = await getLatestPriceForItem(itemId);
      if (cancelled || !latestPrice) return;

      setStore(latestPrice.storeName);
      setPrice(String(latestPrice.unitPrice));
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      navigation.goBack();
      return;
    }

    const storeName = store.trim();
    const numericPrice = parseFloat(price);
    const hasPrice = !!storeName && !Number.isNaN(numericPrice);

    if (itemId) {
      const { getDb } = await import('../db/schema');
      const db = await getDb();
      const now = new Date().toISOString();
      await db.runAsync(
        'UPDATE items SET name = ?, isStaple = ?, updated_at = ? WHERE id = ?',
        [trimmedName, isStaple ? 1 : 0, now, itemId],
      );

      if (hasPrice) {
        await addPriceHistoryEntry({
          itemId,
          storeName,
          unitPrice: numericPrice,
          kind: 'seen',
        });
      }

      await refresh();
    } else {
      const newId = await addItem({ name: trimmedName, isStaple });

      if (hasPrice && newId) {
        await addPriceHistoryEntry({
          itemId: newId,
          storeName,
          unitPrice: numericPrice,
          kind: 'seen',
        });
      }
    }

    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Item</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Milk"
              />

              <Text style={styles.label}>Store</Text>
              <TextInput
                style={styles.input}
                value={store}
                onChangeText={setStore}
                placeholder="e.g. Market One"
              />

              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="e.g. 3.49"
                keyboardType="decimal-pad"
              />

              <View style={styles.stapleRow}>
                <Text style={styles.stapleLabel}>Staple item</Text>
                <Switch value={isStaple} onValueChange={setIsStaple} />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  inner: {
    flex: 1,
  },
  headerRow: {
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  form: {
    flex: 1,
    paddingTop: 8,
  },
  label: {
    fontSize: 14,
    color: '#52606D',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD2E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  stapleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  stapleLabel: {
    fontSize: 16,
    color: '#1F2933',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD2E1',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#52606D',
  },
  primaryButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2D6CDF',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
