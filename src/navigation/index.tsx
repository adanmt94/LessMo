/**
 * Navigation - Configuración de navegación de la app
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
  GroupEventsScreen,
  JoinEventScreen,
  EditProfileScreen,
  OnboardingScreen,
  shouldShowOnboarding,
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, [isAuthenticated]);

  const checkOnboarding = async () => {
    if (isAuthenticated) {
      const shouldShow = await shouldShowOnboarding();
      setShowOnboarding(shouldShow);
    }
    setCheckingOnboarding(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (loading || checkingOnboarding) {
    return null; // Puedes mostrar un splash screen aquí
  }

  // Mostrar onboarding si es la primera vez y está autenticado
  if (isAuthenticated && showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerBackTitle: 'Atrás',
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CreateEvent" 
              component={CreateEventScreen}
              options={{ 
                headerShown: true,
                title: 'Crear Evento',
                headerBackTitle: 'Atrás'
              }}
            />
            <Stack.Screen 
              name="CreateGroup" 
              component={CreateGroupScreen}
              options={{ 
                headerShown: true,
                title: 'Crear Grupo',
                headerBackTitle: 'Atrás'
              }}
            />
            <Stack.Screen 
              name="GroupEvents" 
              component={GroupEventsScreen}
              options={{ 
                headerShown: false
              }}
            />
            <Stack.Screen 
              name="JoinEvent" 
              component={JoinEventScreen}
              options={{ 
                headerShown: true,
                title: 'Unirse a Evento',
                headerBackTitle: 'Atrás'
              }}
            />
            <Stack.Screen 
              name="EventDetail" 
              component={EventDetailScreen}
              options={{ 
                headerShown: true,
                title: 'Detalles del Evento',
                headerBackTitle: 'Atrás',
              }}
            />
            <Stack.Screen 
              name="AddExpense" 
              component={AddExpenseScreen}
              options={{ 
                headerShown: true,
                title: 'Agregar Gasto',
                headerBackTitle: 'Atrás'
              }}
            />
            <Stack.Screen 
              name="Summary" 
              component={SummaryScreen}
              options={{ 
                headerShown: true,
                title: 'Resumen Completo',
                headerBackTitle: 'Atrás'
              }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ 
                headerShown: true,
                title: 'Editar Perfil',
                headerBackTitle: 'Atrás'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
