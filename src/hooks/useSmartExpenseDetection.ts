/**
 * useSmartExpenseDetection - Detección inteligente de gastos
 * 
 * Funcionalidades:
 * 1. Clipboard monitoring: Detecta importes copiados al portapapeles cuando la app
 *    vuelve a primer plano (ej: copiar "15.50" de una app bancaria)
 * 2. Muestra sugerencia para añadir como gasto rápido
 * 
 * Nota sobre limitaciones iOS:
 * - iOS NO permite leer notificaciones de otras apps (sandbox)
 * - FinanceKit requiere entitlement especial de Apple
 * - El clipboard es la forma más práctica de capturar importes de otras apps
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus, Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

// Regex patterns for detecting monetary amounts in clipboard
const AMOUNT_PATTERNS = [
  // Currency symbols followed by number: $15.50, €20, £30.00, ¥1000
  /[$€£¥]\s*(\d{1,}[.,]\d{1,2})/,
  /[$€£¥]\s*(\d{1,})/,
  // Number followed by currency: 15.50€, 20$, 30.00 EUR
  /(\d{1,}[.,]\d{1,2})\s*[$€£¥]/,
  /(\d{1,}[.,]\d{1,2})\s*(?:EUR|USD|GBP|MXN|ARS|COP)/i,
  // Number with comma as thousands separator: 1,500.00 or 1.500,00
  /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/,
  // Plain number with decimals (at least X.XX format, avoid false positives)
  /^(\d{1,6}[.,]\d{2})$/,
  // Payment-context keywords with number
  /(?:pago|cobro|total|importe|cargo|transferencia|recib|gast)[^\d]*(\d{1,}[.,]?\d{0,2})/i,
  /(\d{1,}[.,]?\d{0,2})[^\d]*(?:pagado|cobrado|gastado|transferido)/i,
];

// Keywords that suggest a payment notification text
const PAYMENT_KEYWORDS = [
  'pago', 'cobro', 'transferencia', 'cargo', 'compra',
  'payment', 'charge', 'purchase', 'transaction',
  'paypal', 'bizum', 'venmo', 'zelle',
  'apple pay', 'google pay', 'samsung pay',
  'mastercard', 'visa', 'amex',
  'recibo', 'factura', 'receipt',
];

interface DetectedExpense {
  amount: number;
  description?: string;
  source: 'clipboard';
}

interface UseSmartExpenseDetectionOptions {
  enabled?: boolean;
}

export function useSmartExpenseDetection(options: UseSmartExpenseDetectionOptions = {}) {
  const { enabled = true } = options;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const lastClipboardContent = useRef<string>('');
  const lastCheckTime = useRef<number>(0);
  const [detectedExpense, setDetectedExpense] = useState<DetectedExpense | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const parseAmount = useCallback((text: string): number | null => {
    for (const pattern of AMOUNT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const rawAmount = match[1] || match[0];
        // Clean the amount string
        let cleaned = rawAmount.replace(/[^0-9.,]/g, '');
        
        // Handle European format (1.500,00 → 1500.00)
        if (cleaned.includes(',') && cleaned.includes('.')) {
          if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
            // European: 1.500,00
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
          } else {
            // US: 1,500.00
            cleaned = cleaned.replace(/,/g, '');
          }
        } else if (cleaned.includes(',')) {
          // Could be decimal comma (15,50) or thousands (1,500)
          const parts = cleaned.split(',');
          if (parts[1] && parts[1].length === 2) {
            cleaned = cleaned.replace(',', '.');
          } else {
            cleaned = cleaned.replace(/,/g, '');
          }
        }
        
        const amount = parseFloat(cleaned);
        if (!isNaN(amount) && amount > 0 && amount < 100000) {
          return amount;
        }
      }
    }
    return null;
  }, []);

  const extractDescription = useCallback((text: string): string | undefined => {
    // Try to extract a meaningful description from the clipboard text
    const lower = text.toLowerCase();
    for (const keyword of PAYMENT_KEYWORDS) {
      if (lower.includes(keyword)) {
        // Return the original text trimmed as description (max 50 chars)
        const trimmed = text.trim().substring(0, 50);
        return trimmed.length < text.trim().length ? trimmed + '…' : trimmed;
      }
    }
    return undefined;
  }, []);

  const checkClipboard = useCallback(async () => {
    if (!enabled) return;
    
    // Rate limit: don't check more than once every 3 seconds
    const now = Date.now();
    if (now - lastCheckTime.current < 3000) return;
    lastCheckTime.current = now;

    try {
      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) return;

      const content = await Clipboard.getStringAsync();
      if (!content || content === lastClipboardContent.current) return;
      
      lastClipboardContent.current = content;
      
      const amount = parseAmount(content);
      if (amount === null) return;

      const description = extractDescription(content);
      
      setDetectedExpense({ amount, description, source: 'clipboard' });

      Alert.alert(
        '💰 ¿Nuevo gasto?',
        `He detectado un importe de ${amount.toFixed(2)}€${description ? ` (${description})` : ''} en el portapapeles.\n\n¿Quieres añadirlo como gasto rápido?`,
        [
          {
            text: 'Ignorar',
            style: 'cancel',
            onPress: () => setDetectedExpense(null),
          },
          {
            text: 'Añadir gasto',
            onPress: () => {
              setDetectedExpense(null);
              navigation.navigate('QuickExpense', {
                amount,
                description: description || undefined,
              });
            },
          },
        ]
      );
    } catch {
      // Clipboard access may fail - silently ignore
    }
  }, [enabled, parseAmount, extractDescription, navigation]);

  useEffect(() => {
    if (!enabled) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Check clipboard when coming back to foreground
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Small delay to let the app fully resume
        setTimeout(checkClipboard, 500);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [enabled, checkClipboard]);

  const dismissDetection = useCallback(() => {
    setDetectedExpense(null);
  }, []);

  return {
    detectedExpense,
    dismissDetection,
    checkClipboard, // Manual trigger
  };
}
