import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider } from './src/game/GameContext';
import { TitleScreen } from './src/screens/TitleScreen';
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
import { IntelScreen } from './src/screens/IntelScreen';
import { FinanceScreen } from './src/screens/FinanceScreen';
import { OperationsDashboardScreen } from './src/screens/OperationsDashboardScreen';
import { EmpireDashboardScreen } from './src/screens/EmpireDashboardScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { CrewDetailScreen } from './src/screens/CrewDetailScreen';
import { BusinessDetailScreen } from './src/screens/BusinessDetailScreen';
import { PropertyDetailScreen } from './src/screens/PropertyDetailScreen';
import { LocationIntroScreen } from './src/screens/LocationIntroScreen';
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
      <StoreProvider>
        <GameProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" />
            <Stack.Navigator
              initialRouteName="Title"
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: palette.bg },
                animation: 'fade',
                animationDuration: 220,
              }}
            >
              <Stack.Screen name="Title" component={TitleScreen} options={{ animation: 'fade' }} />
              <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'fade' }} />
              <Stack.Screen name="Game" component={GameScreen} options={{ animation: 'fade' }} />
              <Stack.Screen name="Market" component={MarketScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Travel" component={TravelScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Inventory" component={InventoryScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Contacts" component={ContactsScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Progress" component={ProgressScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Upgrades" component={UpgradesScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Suppliers" component={SuppliersScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Contracts" component={ContractsScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Crew" component={CrewScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Safehouses" component={SafehousesScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Businesses" component={BusinessesScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Missions" component={MissionsScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="About" component={AboutScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Store" component={StoreScreen} options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="Intel" component={IntelScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Finance" component={FinanceScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="OperationsDashboard" component={OperationsDashboardScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="EmpireDashboard" component={EmpireDashboardScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="MoreScreen" component={MoreScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="CrewDetail" component={CrewDetailScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="LocationIntro" component={LocationIntroScreen} options={{ animation: 'fade', animationDuration: 400 }} />
              <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ animation: 'slide_from_right' }} />
            </Stack.Navigator>
          </NavigationContainer>
        </GameProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
