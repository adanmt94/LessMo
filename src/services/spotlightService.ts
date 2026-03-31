/**
 * Spotlight Service - Dona actividades de usuario a iOS Spotlight
 * 
 * Hace que los eventos activos y gastos recientes aparezcan en:
 * - Spotlight Search (deslizar abajo en home)
 * - Siri Suggestions
 * - Proactive Suggestions
 * 
 * Compatible con Expo: usa expo-linking para construir deep links
 * y react-native-shared-group-preferences para persistir datos.
 */

import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP = 'group.com.lessmo.app.widgets';

interface SpotlightItem {
  id: string;
  title: string;
  description: string;
  deepLink: string;
  keywords: string[];
}

/**
 * Dona eventos activos al Spotlight de iOS
 * Se llama al cargar eventos o al crear uno nuevo
 */
export const donateEventsToSpotlight = async (events: Array<{
  id: string;
  name: string;
  budget?: number;
  participantsCount?: number;
  currency?: string;
}>) => {
  if (Platform.OS !== 'ios') return;

  try {
    const spotlightItems: SpotlightItem[] = events.map(event => ({
      id: `event_${event.id}`,
      title: event.name,
      description: event.budget
        ? `Presupuesto: ${event.budget} ${event.currency || 'EUR'} · ${event.participantsCount || 0} participantes`
        : `${event.participantsCount || 0} participantes`,
      deepLink: `lessmo://event/${event.id}`,
      keywords: ['evento', 'gasto', 'presupuesto', event.name.toLowerCase(), 'lessmo'],
    }));

    // Store in App Group for the native side to pick up
    await SharedGroupPreferences.setItem(
      'spotlightData',
      JSON.stringify(spotlightItems),
      APP_GROUP
    );
  } catch {}
};

/**
 * Dona la acción "añadir gasto rápido" como actividad frecuente
 */
export const donateQuickExpenseActivity = async () => {
  if (Platform.OS !== 'ios') return;

  try {
    const activity = {
      id: 'quick_expense_activity',
      title: 'Añadir gasto rápido',
      description: 'Registra un gasto en LessMo',
      deepLink: 'lessmo://quick-expense',
      keywords: ['gasto', 'añadir', 'rápido', 'nuevo', 'expense', 'lessmo'],
    };

    await SharedGroupPreferences.setItem(
      'spotlightActivity',
      JSON.stringify(activity),
      APP_GROUP
    );
  } catch {}
};

/**
 * Limpia todas las donaciones de Spotlight
 */
export const clearSpotlightDonations = async () => {
  if (Platform.OS !== 'ios') return;

  try {
    await SharedGroupPreferences.setItem('spotlightData', '[]', APP_GROUP);
    await SharedGroupPreferences.setItem('spotlightActivity', '{}', APP_GROUP);
  } catch {}
};
