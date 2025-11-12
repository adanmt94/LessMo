/**
 * Navigation - Configuración de navegación de la app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuthContext } from '../context/AuthContext';
import {
  LoginScreen,
  RegisterScreen,
  HomeScreen,
  CreateEventScreen,
  EventDetailScreen,
  AddExpenseScreen,
  SummaryScreen,
} from '../screens';

const Stack = createStackNavigator<RootStackParamList>();

export const Navigation: React.FC = () => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return null; // Puedes mostrar un splash screen aquí
  }

  return (
    <NavigationContainer>
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
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
            <Stack.Screen name="Summary" component={SummaryScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
