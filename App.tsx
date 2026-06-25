import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider } from './src/game/GameContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { MarketScreen } from './src/screens/MarketScreen';
import { TravelScreen } from './src/screens/TravelScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { UpgradesScreen } from './src/screens/UpgradesScreen';
import { SuppliersScreen } from './src/screens/SuppliersScreen';
import { ContractsScreen } from './src/screens/ContractsScreen';
import { CrewScreen } from './src/screens/CrewScreen';
import { SafehousesScreen } from './src/screens/SafehousesScreen';
import { BusinessesScreen } from './src/screens/BusinessesScreen';
import { MissionsScreen } from './src/screens/MissionsScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { StoreScreen } from './src/screens/StoreScreen';
import { RootStackParamList } from './src/types/game';
import { palette } from './src/theme/theme';
import { StoreProvider } from './src/context/StoreContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.bg,
    card: palette.bgCard,
    text: palette.text,
    border: palette.border,
    primary: palette.neon,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <StoreProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" />
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: palette.bg },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Game" component={GameScreen} />
              <Stack.Screen name="Market" component={MarketScreen} />
              <Stack.Screen name="Travel" component={TravelScreen} />
              <Stack.Screen name="Inventory" component={InventoryScreen} />
              <Stack.Screen name="Contacts" component={ContactsScreen} />
              <Stack.Screen name="Progress" component={ProgressScreen} />
              <Stack.Screen name="Upgrades" component={UpgradesScreen} />
              <Stack.Screen name="Suppliers" component={SuppliersScreen} />
              <Stack.Screen name="Contracts" component={ContractsScreen} />
              <Stack.Screen name="Crew" component={CrewScreen} />
              <Stack.Screen name="Safehouses" component={SafehousesScreen} />
              <Stack.Screen name="Businesses" component={BusinessesScreen} />
              <Stack.Screen name="Missions" component={MissionsScreen} />
              <Stack.Screen name="About" component={AboutScreen} />
              <Stack.Screen name="Store" component={StoreScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </StoreProvider>
      </GameProvider>
    </SafeAreaProvider>
  );
}
