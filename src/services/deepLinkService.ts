/**
 * Deep Linking Service - Compartir eventos mediante links
 */

import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface DeepLinkConfig {
  eventId: string;
  eventName: string;
  creatorName: string;
}

/**
 * Generar deep link para evento
 */
export const generateEventDeepLink = (config: DeepLinkConfig): string => {
  const baseUrl = Linking.createURL('');
  const params = new URLSearchParams({
    event: config.eventId,
    name: encodeURIComponent(config.eventName),
    creator: encodeURIComponent(config.creatorName),
  });
  
  return `${baseUrl}invite?${params.toString()}`;
};

/**
 * Generar enlace universal (web fallback)
 */
export const generateUniversalLink = (config: DeepLinkConfig): string => {
  // TODO: Reemplazar con tu dominio real cuando esté disponible
  const webDomain = 'lessmo.app';
  const params = new URLSearchParams({
    event: config.eventId,
    name: encodeURIComponent(config.eventName),
    creator: encodeURIComponent(config.creatorName),
  });
  
  return `https://${webDomain}/invite?${params.toString()}`;
};

/**
 * Compartir evento mediante el sistema nativo
 */
export const shareEvent = async (config: DeepLinkConfig): Promise<boolean> => {
  try {
    const link = generateEventDeepLink(config);
    const message = `¡Únete a "${config.eventName}"! 

${config.creatorName} te ha invitado a unirte a este evento en LessMo. 

Descarga la app y usa este enlace:
${link}

O visita: ${generateUniversalLink(config)}`;

    const canShare = await Sharing.isAvailableAsync();
    
    if (canShare) {
      await Sharing.shareAsync(link, {
        dialogTitle: `Compartir evento: ${config.eventName}`,
      });
      return true;
    } else {
      // Fallback to clipboard if sharing not available
      // import { Clipboard } from 'react-native';
      // await Clipboard.setString(message);
      return false;
    }
  } catch (error) {
    console.error('Error sharing event:', error);
    return false;
  }
};

/**
 * Parsear deep link recibido
 */
export const parseEventDeepLink = (url: string): DeepLinkConfig | null => {
  try {
    const { queryParams } = Linking.parse(url);
    
    if (queryParams && queryParams.event) {
      return {
        eventId: queryParams.event as string,
        eventName: decodeURIComponent((queryParams.name as string) || 'Evento'),
        creatorName: decodeURIComponent((queryParams.creator as string) || 'Usuario'),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};

/**
 * Hook para manejar deep links entrantes
 */
export const handleIncomingDeepLink = (
  url: string,
  onEventInvite: (config: DeepLinkConfig) => void
): void => {
  const parsed = parseEventDeepLink(url);
  
  if (parsed) {
    onEventInvite(parsed);
  }
};

/**
 * Inicializar listener de deep links
 */
export const initDeepLinkListener = (
  onEventInvite: (config: DeepLinkConfig) => void
): (() => void) => {
  // Handle initial URL (app opened from link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleIncomingDeepLink(url, onEventInvite);
    }
  });

  // Handle subsequent URLs (app already open)
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleIncomingDeepLink(url, onEventInvite);
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
};

/**
 * Copiar link al portapapeles
 */
export const copyEventLinkToClipboard = async (config: DeepLinkConfig): Promise<boolean> => {
  try {
    // Dynamic import to avoid issues with Clipboard
    const { Clipboard } = await import('react-native');
    const link = generateEventDeepLink(config);
    const message = `¡Únete a "${config.eventName}"! 

${config.creatorName} te ha invitado a unirte a este evento en LessMo. 

${link}`;
    
    // @ts-ignore - Clipboard API varies by RN version
    if (Clipboard.setString) {
      Clipboard.setString(message);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};
