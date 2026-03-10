import React from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ShoppingProvider } from './src/state/ShoppingContext';

export default function App() {
  return (
    <ShoppingProvider>
      <RootNavigator />
    </ShoppingProvider>
  );
}

