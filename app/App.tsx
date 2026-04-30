import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ShoppingProvider } from './src/state/ShoppingContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ShoppingProvider>
        <RootNavigator />
      </ShoppingProvider>
    </GestureHandlerRootView>
  );
}

