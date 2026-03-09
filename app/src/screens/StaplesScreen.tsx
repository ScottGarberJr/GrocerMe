import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const StaplesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staples (Placeholder)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
});
