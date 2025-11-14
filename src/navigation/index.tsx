/**
 * Navigation - Configuración de navegación de la app
 */

import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuthContext } from '../context/AuthContext';
import {
  LoginScreen,
  RegisterScreen,
  CreateEventScreen,
  EventDetailScreen,
  AddExpenseScreen,
  SummaryScreen,
  CreateGroupScreen,
  JoinEventScreen,
  EditProfileScreen,
} from '../screens';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

// Configuración de Deep Linking
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['lessmo://', 'https://lessmo.app', 'https://*.lessmo.app'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      MainTabs: {
        screens: {
          Events: 'events',
          Groups: 'groups',
          Settings: 'settings',
        },
      },
      JoinEvent: 'join/:inviteCode',
      EventDetail: 'event/:eventId',
      CreateEvent: 'create-event',
      CreateGroup: 'create-group',
      AddExpense: 'event/:eventId/add-expense',
      Summary: 'event/:eventId/summary',
      EditProfile: 'profile/edit',
    },
  },
};

export const Navigation: React.FC = () => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return null; // Puedes mostrar un splash screen aquí
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
            <Stack.Screen name="JoinEvent" component={JoinEventScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
            <Stack.Screen name="Summary" component={SummaryScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
