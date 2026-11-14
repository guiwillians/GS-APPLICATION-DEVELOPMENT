import React from 'react';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/state/AppContext';
import DashboardScreen from './src/screens/DashboardScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import AlertDetailScreen from './src/screens/AlertDetailScreen';
import ReportScreen from './src/screens/ReportScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: colors.primaryDark },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' },
};

function icon(emoji) {
  return ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...headerOptions,
        tabBarActiveTintColor: colors.primary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Painel" component={DashboardScreen} options={{ tabBarIcon: icon('📊'), title: 'Painel Territorial' }} />
      <Tab.Screen name="Alertas" component={AlertsScreen} options={{ tabBarIcon: icon('🚨'), title: 'Alertas preditivos' }} />
      <Tab.Screen name="Ocorrências" component={ReportScreen} options={{ tabBarIcon: icon('📝') }} />
      <Tab.Screen name="Ajustes" component={SettingsScreen} options={{ tabBarIcon: icon('⚙️') }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="AlertDetail" component={AlertDetailScreen} options={{ title: 'Detalhe do alerta' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
