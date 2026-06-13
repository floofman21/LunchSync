import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Calendar, MapPin, Clock, User } from 'lucide-react-native';

import { AppProvider, useAppContext } from './src/AppContext';
import AppHeader from './src/components/AppHeader';
import Gate from './src/components/Gate';
import UpcomingView from './src/components/UpcomingView';
import SpotsView from './src/components/SpotsView';
import HistoryView from './src/components/HistoryView';
import ProfileView from './src/components/ProfileView';
import { useNotifications } from './src/hooks/useNotifications';
import { COLORS } from './src/theme';
import { BRAND } from './src/branding';

const Tab = createBottomTabNavigator();

function AppShell() {
  const { me, loading, handlePickMe, teams } = useAppContext();
  useNotifications();

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={COLORS.cherry} />
        <Text style={s.loadingText}>setting the table…</Text>
      </View>
    );
  }

  if (!me) {
    return <Gate onPick={handlePickMe} teams={teams} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          header: () => <AppHeader />,
          tabBarIcon: ({ color, size }) => {
            const icons = { Upcoming: Calendar, Spots: MapPin, History: Clock, Profile: User };
            const Icon  = icons[route.name];
            return Icon ? <Icon size={size - 2} color={color} /> : null;
          },
          tabBarActiveTintColor:   COLORS.tabActive,
          tabBarInactiveTintColor: COLORS.tabInactive,
          tabBarStyle: {
            backgroundColor: COLORS.tabBarBg,
            borderTopColor:  COLORS.tabBarBorder,
            borderTopWidth:  1,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        })}
      >
        <Tab.Screen name="Upcoming" component={UpcomingView} />
        <Tab.Screen name="Spots"    component={SpotsView}    />
        <Tab.Screen name="History"  component={HistoryView}  />
        <Tab.Screen name="Profile"  component={ProfileView}  />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  loading:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface2, gap: 12 },
  loadingText: { fontSize: 15, color: COLORS.ink3 },
});
