// src/navigation/TabNavigator.tsx
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SearchScreen from '../screens/SearchScreen';
import MapScreen from '../screens/MapScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

// Emoji icons keep this dependency-free. Swap for @expo/vector-icons if you
// prefer vector glyphs (import { Ionicons } and render by route name).
const ICON: Record<keyof RootTabParamList, string> = {
  Search: '🔍',
  Map: '🗺️',
  Matches: '🤝',
  Profile: '👤',
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 20, color }}>{ICON[route.name]}</Text>
        ),
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Explore' }} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
