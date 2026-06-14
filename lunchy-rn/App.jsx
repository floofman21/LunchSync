import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Calendar, MapPin, Clock, User } from 'lucide-react-native';

import { AppProvider, useAppContext } from './src/AppContext';
import AppHeader from './src/components/AppHeader';
import Gate from './src/components/Gate';
import UpcomingView from './src/components/UpcomingView';
import SpotsView from './src/components/SpotsView';
import HistoryView from './src/components/HistoryView';
import ProfileView from './src/components/ProfileView';
import { useNotifications } from './src/hooks/useNotifications';
import { theme } from './src/theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Lunch:   Calendar,
  Spots:   MapPin,
  History: Clock,
  You:     User,
};

const TAB_LABELS = {
  Lunch:   'Lunch',
  Spots:   'Spots',
  History: 'History',
  You:     'You',
};

function FrostedTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={80}
      tint="light"
      style={[tb.bar, { paddingBottom: insets.bottom + 4 }]}
    >
      <View style={tb.inner}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon    = TAB_ICONS[route.name] ?? Calendar;
          const label   = TAB_LABELS[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <View key={route.key} style={tb.tab}>
              <View
                onStartShouldSetResponder={() => true}
                onResponderGrant={onPress}
                style={tb.tabTouchable}
              >
                <View style={[tb.iconWrap, focused && tb.iconWrapActive]}>
                  <Icon size={20} color={focused ? theme.colors.espresso : theme.colors.muted} strokeWidth={focused ? 2 : 1.5} />
                </View>
                <Text style={[tb.label, focused ? tb.labelActive : tb.labelInactive]}>{label}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </BlurView>
  );
}

const tb = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    paddingTop: theme.space.sm,
  },
  tab:         { flex: 1 },
  tabTouchable:{ alignItems: 'center', gap: 3 },
  iconWrap:    { width: 36, height: 28, borderRadius: theme.radius.chip, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: theme.colors.cream },
  label:       { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  labelActive: { color: theme.colors.espresso },
  labelInactive: { color: theme.colors.muted },
});

function AppShell() {
  const { me, loading, handlePickMe, teams } = useAppContext();
  useNotifications();

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={theme.colors.honey} />
        <Text style={s.loadingText}>one sec…</Text>
      </View>
    );
  }

  if (!me) {
    return <Gate onPick={handlePickMe} teams={teams} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={props => <FrostedTabBar {...props} />}
        screenOptions={{
          header: () => <AppHeader />,
        }}
      >
        <Tab.Screen name="Lunch"   component={UpcomingView} />
        <Tab.Screen name="Spots"   component={SpotsView}    />
        <Tab.Screen name="History" component={HistoryView}  />
        <Tab.Screen name="You"     component={ProfileView}  />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  loading:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bg, gap: theme.space.md },
  loadingText: { ...theme.type.meta },
});
