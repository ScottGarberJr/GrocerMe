import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyListScreen } from '../screens/MyListScreen';
import { StaplesScreen } from '../screens/StaplesScreen';
import { ItemScreen } from '../screens/ItemScreen';

export type RootStackParamList = {
  MyList: undefined;
  Staples: undefined;
  Item: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="MyList" component={MyListScreen} />
        <Stack.Screen name="Staples" component={StaplesScreen} />
        <Stack.Screen name="Item" component={ItemScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
