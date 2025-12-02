/**
 * useSiriShortcuts - Hook para gestionar Atajos de Siri mediante Deep Links
 * Compatible con Expo Go ✅
 * 
 * Los usuarios pueden crear atajos de Siri que abren la app en acciones específicas:
 * - "Añadir gasto" → Abre pantalla de añadir gasto
 * - "Ver mis gastos" → Abre pantalla de resumen
 * - "Crear evento" → Abre pantalla de crear evento
 */

import { useEffect } from 'react';
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

export const useSiriShortcuts = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    // Listener para deep links cuando la app está abierta
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Manejar deep link si la app se abrió desde uno
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = ({ url }: { url: string }) => {
    

    // Parsear la URL
    const { path } = Linking.parse(url);

    if (!path) {
      
      return;
    }

    // Navegar según el path
    switch (path) {
      case 'add-expense':
        
        // Necesitamos el eventId, por ahora vamos a Home
        navigation.navigate('Home');
        break;

      case 'summary':
        
        navigation.navigate('Home');
        break;

      case 'create-event':
        
        navigation.navigate('CreateEvent');
        break;

      case 'settings':
        
        navigation.navigate('Settings');
        break;

      default:
        
        navigation.navigate('Home');
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
