import React, { useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initializeDatabase } from './src/db/schema';

export default function App() {
  useEffect(() => {
    initializeDatabase();
  }, []);

  return <RootNavigator />;
}
