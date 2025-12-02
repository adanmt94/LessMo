/**
 * QR Code Payment Screen
 * Generate and display QR code for payment collection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface QRCodePaymentScreenProps {
  navigation: any;
  route: {
    params: {
      amount: number;
      currency: string;
      recipientName: string;
      recipientPhone?: string;
      recipientEmail?: string;
      description?: string;
      paymentType: 'bizum' | 'paypal' | 'venmo' | 'generic';
    };
  };
}

export const QRCodePaymentScreen: React.FC<QRCodePaymentScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const language = currentLanguage.code as 'es' | 'en';
  const {
    amount,
    currency,
    recipientName,
    recipientPhone,
    recipientEmail,
    description,
    paymentType,
  } = route.params;

  const [qrRef, setQrRef] = useState<any>(null);

  // Generate payment URL/data for QR
  const getPaymentData = () => {
    switch (paymentType) {
      case 'bizum':
        // Bizum format: bizum://pay?phone=XXXXXXXXX&amount=XX.XX&concept=XXXX
        if (!recipientPhone) {
          return JSON.stringify({
            type: 'bizum',
            recipientName,
            amount: amount.toFixed(2),
            currency,
            description: description || 'Pago LessMo'
          });
        }
        return `bizum://pay?phone=${recipientPhone}&amount=${amount.toFixed(2)}&concept=${encodeURIComponent(
          description || 'Pago LessMo'
        )}`;
      case 'paypal':
        // PayPal.Me format - usa email o genera JSON
        if (recipientEmail && recipientEmail.includes('@')) {
          const username = recipientEmail.split('@')[0];
          return `https://paypal.me/${username}/${amount}${currency}`;
        }
        return JSON.stringify({
          type: 'paypal',
          recipientName,
          recipientEmail: recipientEmail || '',
          amount: amount.toFixed(2),
          currency,
          description: description || 'Pago LessMo'
        });
      case 'venmo':
        // Venmo format
        if (!recipientEmail) {
          return JSON.stringify({
            type: 'venmo',
            recipientName,
            amount: amount.toFixed(2),
            currency,
            description: description || 'Pago LessMo'
          });
        }
        return `venmo://paycharge?txn=pay&recipients=${recipientEmail}&amount=${amount}&note=${encodeURIComponent(
          description || 'Pago LessMo'
        )}`;
      default:
        // Generic payment data in JSON format (always works)
        return JSON.stringify({
          type: 'payment',
          recipientName,
          recipientPhone: recipientPhone || '',
          recipientEmail: recipientEmail || '',
          amount: amount.toFixed(2),
          currency,
          description: description || 'Pago en LessMo',
          timestamp: new Date().toISOString()
        }, null, 2);
    }
  };

  const paymentData = getPaymentData();

  const getPaymentTypeInfo = () => {
    switch (paymentType) {
      case 'bizum':
        return {
          name: 'Bizum',
          icon: '💳',
          color: '#00A9E0',
          instruction:
            language === 'es'
              ? 'Escanea este código con tu app de banco para pagar con Bizum'
              : 'Scan this code with your bank app to pay with Bizum',
        };
      case 'paypal':
        return {
          name: 'PayPal',
          icon: '💙',
          color: '#0070BA',
          instruction:
            language === 'es'
              ? 'Escanea este código para abrir PayPal y realizar el pago'
              : 'Scan this code to open PayPal and make payment',
        };
      case 'venmo':
        return {
          name: 'Venmo',
          icon: '💸',
          color: '#3D95CE',
          instruction:
            language === 'es'
              ? 'Escanea este código para abrir Venmo y realizar el pago'
              : 'Scan this code to open Venmo and make payment',
        };
      default:
        return {
          name: 'Pago',
          icon: '📱',
          color: '#6366F1',
          instruction:
            language === 'es'
              ? 'Escanea este código para ver los datos del pago'
              : 'Scan this code to view payment details',
        };
    }
  };

  const paymentInfo = getPaymentTypeInfo();

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(paymentData);
    Alert.alert(
      language === 'es' ? '✅ Copiado' : '✅ Copied',
      language === 'es'
        ? 'El enlace de pago ha sido copiado al portapapeles'
        : 'Payment link has been copied to clipboard'
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          language === 'es'
            ? `Pago pendiente de ${amount.toFixed(2)}${currency} a ${recipientName}.\n\n${paymentData}`
            : `Payment of ${amount.toFixed(2)}${currency} to ${recipientName} pending.\n\n${paymentData}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSaveQR = async () => {
    if (!qrRef) return;
    try {
      qrRef.toDataURL(async (dataURL: string) => {
        // Use a temporary directory - simplificado para evitar problemas con FileSystem
        const filename = `/tmp/payment_qr_${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(filename, dataURL, {
          encoding: 'base64',
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filename);
        } else {
          Alert.alert(
            language === 'es' ? '✅ Guardado' : '✅ Saved',
            language === 'es'
              ? 'El código QR ha sido guardado'
              : 'QR code has been saved'
          );
        }
      });
    } catch (error) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es'
          ? 'No se pudo guardar el código QR'
          : 'Could not save QR code'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {paymentInfo.icon} {language === 'es' ? 'Código de Pago' : 'Payment Code'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {paymentInfo.instruction}
          </Text>
        </View>

        {/* QR Code */}
        <View
          style={[
            styles.qrContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.qrWrapper}>
            <QRCode
              value={paymentData}
              size={260}
              color="#000000"
              backgroundColor="#FFFFFF"
              getRef={setQrRef}
              logo={undefined}
              logoSize={0}
              logoBackgroundColor="transparent"
              logoMargin={0}
              logoBorderRadius={0}
              quietZone={10}
              enableLinearGradient={false}
            />
          </View>

          <View style={styles.qrInfo}>
            <Text style={[styles.qrLabel, { color: theme.colors.textSecondary }]}>
              {language === 'es' ? 'Pagar a:' : 'Pay to:'}
            </Text>
            <Text style={[styles.qrValue, { color: theme.colors.text }]}>
              {recipientName}
            </Text>
          </View>

          <View style={styles.qrInfo}>
            <Text style={[styles.qrLabel, { color: theme.colors.textSecondary }]}>
              {language === 'es' ? 'Cantidad:' : 'Amount:'}
            </Text>
            <Text style={[styles.qrAmount, { color: '#10B981' }]}>
              {amount.toFixed(2)} {currency}
            </Text>
          </View>

          {description && (
            <View style={styles.qrInfo}>
              <Text style={[styles.qrLabel, { color: theme.colors.textSecondary }]}>
                {language === 'es' ? 'Concepto:' : 'Description:'}
              </Text>
              <Text style={[styles.qrValue, { color: theme.colors.text }]}>
                {description}
              </Text>
            </View>
          )}

          <View style={[styles.qrBadge, { backgroundColor: paymentInfo.color }]}>
            <Text style={styles.qrBadgeText}>{paymentInfo.name}</Text>
          </View>
        </View>

        {/* QR Data Info */}
        <View
          style={[
            styles.instructionsCard,
            {
              backgroundColor: theme.isDark
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(16, 185, 129, 0.05)',
              borderColor: theme.isDark
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(16, 185, 129, 0.1)',
            },
          ]}
        >
          <Text style={[styles.instructionsTitle, { color: '#10B981' }]}>
            {language === 'es' ? '💡 Contenido del QR' : '💡 QR Content'}
          </Text>
          <TouchableOpacity 
            onPress={handleCopyLink}
            style={styles.qrDataContainer}
          >
            <Text style={[styles.qrDataText, { color: theme.colors.textSecondary }]} numberOfLines={4}>
              {paymentData}
            </Text>
            <Text style={[styles.tapToCopy, { color: '#10B981' }]}>
              {language === 'es' ? '👆 Toca para copiar' : '👆 Tap to copy'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View
          style={[
            styles.instructionsCard,
            {
              backgroundColor: theme.isDark
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(99, 102, 241, 0.05)',
              borderColor: theme.isDark
                ? 'rgba(99, 102, 241, 0.3)'
                : 'rgba(99, 102, 241, 0.1)',
            },
          ]}
        >
          <Text style={[styles.instructionsTitle, { color: '#6366F1' }]}>
            {language === 'es' ? '📱 Cómo usarlo' : '📱 How to use'}
          </Text>
          <Text style={[styles.instructionsText, { color: theme.colors.text }]}>
            {language === 'es'
              ? `1. Abre tu app de ${paymentInfo.name}\n2. Escanea el código QR\n3. Confirma el pago`
              : `1. Open your ${paymentInfo.name} app\n2. Scan the QR code\n3. Confirm payment`}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#6366F1' }]}
            onPress={handleShare}
          >
            <Text style={styles.actionButtonText}>
              {language === 'es' ? '📤 Compartir enlace' : '📤 Share link'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={handleCopyLink}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
              {language === 'es' ? '📋 Copiar enlace' : '📋 Copy link'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={handleSaveQR}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
              {language === 'es' ? '💾 Guardar QR' : '💾 Save QR'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={[
            styles.closeButton,
            {
              backgroundColor: theme.isDark
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(239, 68, 68, 0.05)',
              borderColor: '#EF4444',
            },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.closeButtonText, { color: '#EF4444' }]}>
            {language === 'es' ? 'Cerrar' : 'Close'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  qrContainer: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
  },
  qrInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  qrValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  qrAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  qrBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  qrBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  qrDataContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  qrDataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
    marginBottom: 8,
  },
  tapToCopy: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
