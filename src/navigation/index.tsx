/**
 * Navigation - Configuración de navegación de la app
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer, LinkingOptions, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSiriShortcuts } from '../hooks/useSiriShortcuts';
import { SyncStatusIndicator } from '../components/SyncStatusIndicator';
import { initializeSyncService } from '../services/syncService';
import {
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  CreateEventScreen,
  EventDetailScreen,
  AddExpenseScreen,
  SummaryScreen,
  GroupEventsScreen,
  JoinEventScreen,
  JoinGroupScreen,
  ChatScreen,
  PaymentMethodScreen,
  StatisticsScreen,
  EditProfileScreen,
  BankConnectionScreen,
  BankTransactionsScreen,
  QRCodePaymentScreen,
  ReminderSettingsScreen,
  ItineraryScreen,
  OnboardingScreen,
  shouldShowOnboarding,
  markOnboardingComplete,
} from '../screens';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { PaymentHistoryScreen } from '../screens/PaymentHistoryScreen';
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
      JoinGroup: 'join-group/:inviteCode',
      EventDetail: 'event/:eventId',
      GroupEvents: 'group/:groupId',
      Chat: 'chat',
      PaymentMethod: 'payment',
      Statistics: 'event/:eventId/statistics',
      CreateEvent: 'create-event',
      CreateGroup: 'create-group',
      AddExpense: 'event/:eventId/add-expense',
      Summary: 'event/:eventId/summary',
      EditProfile: 'profile/edit',
    },
  },
};

// Componente interno que maneja los deep links DENTRO del NavigationContainer
const DeepLinkHandler: React.FC = () => {
  useSiriShortcuts();
  return null;
};

export const Navigation: React.FC = () => {
  const { isAuthenticated, loading } = useAuthContext();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboarding();
    initializeSyncService(); // Initialize offline sync
    
    // Timeout de seguridad: si después de 2 segundos no se resolvió, continuar
    const timeout = setTimeout(() => {
      console.log('⚠️ Timeout verificando onboarding - continuando');
      setCheckingOnboarding(false);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [isAuthenticated]);

  const checkOnboarding = async () => {
    try {
      if (isAuthenticated) {
        const shouldShow = await shouldShowOnboarding();
        console.log('📱 Mostrar onboarding:', shouldShow);
        setShowOnboarding(shouldShow);
      }
    } catch (error) {
      console.error('❌ Error verificando onboarding:', error);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // NOTA: Ya no bloqueamos la UI mientras carga
  // Los timeouts de seguridad aseguran que nunca nos quedemos en pantalla en blanco
  // if (loading || checkingOnboarding) {
  //   return null;
  // }

  // Mostrar onboarding si es la primera vez y está autenticado
  if (isAuthenticated && showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Configurar tema de navegación
  const navigationTheme = {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
      {/* Handler de Deep Links (Siri Shortcuts) - DEBE estar dentro de NavigationContainer */}
      <DeepLinkHandler />
      
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerBackTitle: t('common.back'),
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: {
            color: theme.colors.text,
          },
          headerRight: () => isAuthenticated ? <SyncStatusIndicator /> : null,
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
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen}
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
            {/* CreateEvent crea eventos/eventos */}
            <Stack.Screen 
              name="CreateEvent" 
              component={CreateEventScreen}
              options={({ route }) => ({ 
                headerShown: true,
                title: route.params?.mode === 'edit' ? 'Editar Evento' : 'Crear Evento',
                headerBackTitle: t('common.back')
              })}
            />
            <Stack.Screen 
              name="CreateGroup" 
              component={CreateEventScreen}
              options={{ 
                headerShown: true,
                title: t('createGroup.title'),
                headerBackTitle: t('common.back')
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
                title: t('joinEvent.title'),
                headerBackTitle: t('common.back')
              }}
            />
            <Stack.Screen 
              name="JoinGroup" 
              component={JoinGroupScreen}
              options={{ 
                headerShown: true,
                title: 'Unirse a Evento',
                headerBackTitle: t('common.back')
              }}
            />
            <Stack.Screen 
              name="EventDetail" 
              component={EventDetailScreen}
              options={{ 
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="AddExpense" 
              component={AddExpenseScreen}
              options={{ 
                headerShown: true,
                title: t('addExpense.title'),
                headerBackTitle: t('common.back')
              }}
            />
            <Stack.Screen 
              name="Summary" 
              component={SummaryScreen}
              options={{ 
                headerShown: true,
                title: t('summary.title'),
                headerBackTitle: t('common.back')
              }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{ 
                headerShown: true,
                title: 'Chat',
                headerBackTitle: t('common.back')
              }}
            />
            <Stack.Screen 
              name="PaymentMethod" 
              component={PaymentMethodScreen}
              options={{ 
                headerShown: true,
                title: 'Método de Pago',
                headerBackTitle: t('common.back')
              }}
            />
            <Stack.Screen 
              name="Statistics" 
              component={StatisticsScreen}
              options={{ 
                headerShown: true,
                title: 'Estadísticas',
                headerBackTitle: t('common.back')
              }}
            />
            <Stack.Screen 
              name="Achievements" 
              component={AchievementsScreen}
              options={{ 
                headerShown: true,
                title: '🏆 Logros y Badges',
                headerBackTitle: t('common.back')
              }}
            />
            <Stack.Screen 
              name="BankConnection" 
              component={BankConnectionScreen}
              options={{ 
                headerShown: true,
                title: '🏦 Conectar Banco',
                headerBackTitle: t('common.back')
              }}
            />
            <Stack.Screen 
              name="BankTransactions" 
              component={BankTransactionsScreen}
              options={{ 
                headerShown: true,
                title: '🔍 Transacciones',
                headerBackTitle: t('common.back')
              }}
            />
            <Stack.Screen 
              name="QRCodePayment" 
              component={QRCodePaymentScreen}
              options={{ 
                headerShown: true,
                title: '📱 Código QR',
                headerBackTitle: t('common.back'),
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="ReminderSettings" 
              component={ReminderSettingsScreen}
              options={{ 
                headerShown: true,
                title: '🔔 Recordatorios',
                headerBackTitle: t('common.back'),
              }}
            />
            <Stack.Screen 
              name="Itinerary" 
              component={ItineraryScreen}
              options={{ 
                headerShown: true,
                title: '🗺️ Itinerario',
                headerBackTitle: t('common.back'),
              }}
            />
            <Stack.Screen 
              name="Analytics" 
              component={AnalyticsScreen}
              options={{ 
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="PaymentHistory" 
              component={PaymentHistoryScreen}
              options={{ 
                headerShown: true,
                title: '💳 Historial de Pagos',
                headerBackTitle: t('common.back'),
              }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ 
                headerShown: true,
                title: t('editProfile.title'),
                headerBackTitle: t('common.back')
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
