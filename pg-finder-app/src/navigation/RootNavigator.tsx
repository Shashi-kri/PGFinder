// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CreateListingScreen from '../screens/CreateListingScreen';
import SavedListingsScreen from '../screens/SavedListingsScreen';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800' },
        }}
      >
        <Stack.Screen
          name="Tabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ListingDetail"
          component={ListingDetailScreen}
          options={{ title: 'Listing' }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ title: 'Seeker Profile' }}
        />
        <Stack.Screen
          name="CreateListing"
          component={CreateListingScreen}
          options={{ title: 'Post a Place' }}
        />
        <Stack.Screen
          name="SavedListings"
          component={SavedListingsScreen}
          options={{ title: 'Saved Places' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
