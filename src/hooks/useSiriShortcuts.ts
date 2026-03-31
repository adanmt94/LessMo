/**
 * useSiriShortcuts - Hook para gestionar Deep Links con soporte para query params
 * Compatible con Expo Go ✅
 * 
 * Soporta:
 * - lessmo://quick-expense?amount=15&description=Café&category=food&eventId=xxx
 * - lessmo://add-expense?amount=15&description=Café
 * - lessmo://event/EVENT_ID (abre detalle de evento)
 * - Rutas básicas: summary, create-event, events, settings, dashboard
 */

import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';

export interface SiriShortcut {
  id: string;
  title: string;
  deepLink: string;
  suggestedPhrase: string;
}

export const AVAILABLE_SHORTCUTS: SiriShortcut[] = [
  {
    id: 'quick-expense',
    title: 'Gasto Rápido',
    deepLink: 'lessmo://quick-expense',
    suggestedPhrase: 'Añadir gasto rápido en LessMo',
  },
  {
    id: 'add-expense',
    title: 'Añadir Gasto',
    deepLink: 'lessmo://add-expense',
    suggestedPhrase: 'Añadir un gasto en LessMo',
  },
  {
    id: 'view-summary',
    title: 'Ver Resumen',
    deepLink: 'lessmo://summary',
    suggestedPhrase: 'Ver mis gastos en LessMo',
  },
  {
    id: 'create-event',
    title: 'Crear Evento',
    deepLink: 'lessmo://create-event',
    suggestedPhrase: 'Crear un evento en LessMo',
  },
  {
    id: 'open-settings',
    title: 'Configuración',
    deepLink: 'lessmo://settings',
    suggestedPhrase: 'Abrir configuración de LessMo',
  },
];

/**
 * Frases reales que Siri reconoce (definidas en LessmoIntents.swift)
 * Agrupadas por categoría para mostrar en Settings
 */
export interface SiriPhraseGroup {
  icon: string;
  title: string;
  description: string;
  opensApp: boolean;
  phrases: string[];
}

export const SIRI_PHRASES: SiriPhraseGroup[] = [
  {
    icon: '➕',
    title: 'Añadir gasto',
    description: 'Siri te pedirá importe, descripción y categoría',
    opensApp: true,
    phrases: [
      '"Oye Siri, añadir gasto en LessMo"',
      '"Oye Siri, gasto rápido en LessMo"',
      '"Oye Siri, registrar gasto en LessMo"',
      '"Oye Siri, nuevo gasto en LessMo"',
      '"Oye Siri, apuntar gasto en LessMo"',
      '"Oye Siri, anotar gasto en LessMo"',
    ],
  },
  {
    icon: '📊',
    title: 'Gastos del mes',
    description: 'Siri te responde sin abrir la app',
    opensApp: false,
    phrases: [
      '"Oye Siri, ¿cuánto he gastado en LessMo?"',
      '"Oye Siri, ¿cuánto llevo gastado este mes en LessMo?"',
      '"Oye Siri, resumen de gastos en LessMo"',
      '"Oye Siri, mis gastos en LessMo"',
      '"Oye Siri, gastos del mes en LessMo"',
    ],
  },
  {
    icon: '💸',
    title: 'Consultar deudas',
    description: 'Siri te responde sin abrir la app',
    opensApp: false,
    phrases: [
      '"Oye Siri, ¿cuánto debo en LessMo?"',
      '"Oye Siri, mis deudas en LessMo"',
      '"Oye Siri, ¿me deben algo en LessMo?"',
      '"Oye Siri, deudas pendientes en LessMo"',
    ],
  },
  {
    icon: '🎯',
    title: 'Estado del presupuesto',
    description: 'Siri te responde sin abrir la app',
    opensApp: false,
    phrases: [
      '"Oye Siri, ¿cómo va mi presupuesto en LessMo?"',
      '"Oye Siri, estado del presupuesto en LessMo"',
      '"Oye Siri, ¿cuánto me queda de presupuesto en LessMo?"',
    ],
  },
  {
    icon: '📋',
    title: 'Ver resumen',
    description: 'Abre el dashboard de LessMo',
    opensApp: true,
    phrases: [
      '"Oye Siri, abrir resumen en LessMo"',
      '"Oye Siri, ver balance en LessMo"',
      '"Oye Siri, abrir LessMo"',
    ],
  },
  {
    icon: '📅',
    title: 'Crear evento',
    description: 'Abre la pantalla de crear evento',
    opensApp: true,
    phrases: [
      '"Oye Siri, crear evento en LessMo"',
      '"Oye Siri, nuevo evento en LessMo"',
      '"Oye Siri, nuevo viaje en LessMo"',
    ],
  },
  {
    icon: '📆',
    title: 'Ver eventos',
    description: 'Abre la lista de eventos activos',
    opensApp: true,
    phrases: [
      '"Oye Siri, mis eventos en LessMo"',
      '"Oye Siri, ver eventos en LessMo"',
      '"Oye Siri, eventos activos en LessMo"',
    ],
  },
];

/**
 * Parsea query params de una URL string
 */
const parseQueryParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};
  try {
    const questionMark = url.indexOf('?');
    if (questionMark === -1) return params;
    const queryString = url.substring(questionMark + 1);
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
  } catch {}
  return params;
};

export const useSiriShortcuts = () => {
  const navigation = useNavigation<any>();
  const handledInitialUrl = useRef(false);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial URL only once
    if (!handledInitialUrl.current) {
      handledInitialUrl.current = true;
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleDeepLink({ url });
        }
      });
    }

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = ({ url }: { url: string }) => {
    const { path } = Linking.parse(url);
    const queryParams = parseQueryParams(url);

    if (!path) return;

    // Extract cleaned path (remove leading slashes)
    const cleanPath = path.replace(/^\/+/, '');

    switch (cleanPath) {
      case 'quick-expense': {
        // lessmo://quick-expense?amount=15&description=Café&category=food&eventId=xxx
        navigation.navigate('QuickExpense', {
          amount: queryParams.amount ? parseFloat(queryParams.amount) : undefined,
          description: queryParams.description || undefined,
          category: queryParams.category || undefined,
          eventId: queryParams.eventId || undefined,
        });
        break;
      }

      case 'add-expense': {
        // If has params → QuickExpense for faster flow, else → full AddExpense
        if (queryParams.amount || queryParams.description) {
          navigation.navigate('QuickExpense', {
            amount: queryParams.amount ? parseFloat(queryParams.amount) : undefined,
            description: queryParams.description || undefined,
            category: queryParams.category || undefined,
            eventId: queryParams.eventId || undefined,
          });
        } else {
          navigation.navigate('AddExpense', { eventId: 'individual', mode: 'create' });
        }
        break;
      }

      case 'summary':
      case 'dashboard':
        navigation.navigate('MainTabs', { screen: 'Activity' } as any);
        break;

      case 'create-event':
        navigation.navigate('CreateEvent', { mode: 'create' });
        break;

      case 'events':
        navigation.navigate('MainTabs', { screen: 'Events' } as any);
        break;

      case 'settings':
        navigation.navigate('Settings');
        break;

      case 'expenses':
        navigation.navigate('MainTabs', { screen: 'Expenses' } as any);
        break;

      default: {
        // Handle lessmo://event/EVENT_ID
        if (cleanPath.startsWith('event/')) {
          const eventId = cleanPath.replace('event/', '');
          if (eventId) {
            navigation.navigate('EventDetail', { eventId });
            break;
          }
        }
        navigation.navigate('MainTabs' as any);
      }
    }
  };

  const getDeepLinkUrl = (shortcutId: string): string => {
    const shortcut = AVAILABLE_SHORTCUTS.find(s => s.id === shortcutId);
    return shortcut ? shortcut.deepLink : 'lessmo://';
  };

  return {
    shortcuts: AVAILABLE_SHORTCUTS,
    getDeepLinkUrl,
  };
};
