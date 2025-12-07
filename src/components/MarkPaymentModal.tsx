/**
 * MarkPaymentModal - Modal para marcar un pago como realizado
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../context/ThemeContext';
import { Settlement } from '../types';
import { Button } from './lovable';
import {
  markPaymentAsSent,
  confirmPayment,
  rejectPayment,
  generatePaymentLink,
  PaymentMethod,
  Payment,
} from '../services/paymentConfirmationService';
import { PaymentMethodLogo } from './PaymentLogos';

interface Props {
  visible: boolean;
  settlement: Settlement | null;
  fromUserName: string;
  toUserName: string;
  eventId: string;
  eventName: string;
  currency: string;
  currentUserId: string;
  onClose: () => void;
  onPaymentMarked: () => void;
  existingPayment?: Payment; // Si ya existe un pago pendiente
}

export const MarkPaymentModal: React.FC<Props> = ({
  visible,
  settlement,
  fromUserName,
  toUserName,
  eventId,
  eventName,
  currency,
  currentUserId,
  onClose,
  onPaymentMarked,
  existingPayment,
}) => {
  const { theme } = useTheme();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!settlement) return null;

  const isDebtor = settlement.from === currentUserId;
  const isCreditor = settlement.to === currentUserId;

  const paymentMethods: { id: PaymentMethod; name: string; hasLink: boolean }[] = [
    { id: 'bizum', name: 'Bizum', hasLink: false },
    { id: 'paypal', name: 'PayPal', hasLink: true },
    { id: 'venmo', name: 'Venmo', hasLink: true },
    { id: 'apple_pay', name: 'Apple Pay', hasLink: false },
    { id: 'google_pay', name: 'Google Pay', hasLink: false },
    { id: 'bank_transfer', name: 'Transferencia', hasLink: false },
    { id: 'cash', name: 'Efectivo', hasLink: false },
    { id: 'other', name: 'Otro', hasLink: false },
  ];

  const handleMarkAsPaid = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Selecciona un método de pago');
      return;
    }

    try {
      setLoading(true);

      if (existingPayment) {
        // Actualizar pago existente
        await markPaymentAsSent(
          existingPayment.id,
          currentUserId,
          selectedMethod,
          reference,
          undefined
        );
      } else {
        // Crear nuevo pago
        const { createPayment } = await import('../services/paymentConfirmationService');
        const payment = await createPayment(
          eventId,
          eventName,
          settlement.from,
          fromUserName,
          settlement.to,
          toUserName,
          settlement.amount,
          currency,
          selectedMethod,
          reference,
          note
        );
        
        // Marcar como enviado inmediatamente
        await markPaymentAsSent(
          payment.id,
          currentUserId,
          selectedMethod,
          reference,
          undefined
        );
      }

      Alert.alert(
        '✅ Pago marcado',
        `Se ha notificado a ${toUserName} que enviaste ${settlement.amount.toFixed(2)} ${currency}`
      );
      onPaymentMarked();
      onClose();
    } catch (error) {
      console.error('❌ Error marcando pago:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error', `No se pudo marcar el pago: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!existingPayment) return;

    Alert.alert(
      'Confirmar pago recibido',
      `¿Confirmas que recibiste ${settlement.amount.toFixed(2)} ${currency} de ${fromUserName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setLoading(true);
              await confirmPayment(existingPayment.id, currentUserId);
              Alert.alert('✅ Pago confirmado', 'El pago ha sido confirmado correctamente');
              onPaymentMarked();
              onClose();
            } catch (error) {
              
              Alert.alert('Error', 'No se pudo confirmar el pago');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectPayment = async () => {
    if (!existingPayment) return;

    Alert.prompt(
      'Rechazar pago',
      '¿Por qué rechazas este pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async (reason?: string) => {
            if (!reason) return;
            if (!reason?.trim()) return;
            
            try {
              setLoading(true);
              await rejectPayment(existingPayment.id, currentUserId, reason);
              Alert.alert('Pago rechazado', 'El pagador será notificado');
              onPaymentMarked();
              onClose();
            } catch (error) {
              
              Alert.alert('Error', 'No se pudo rechazar el pago');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleOpenPaymentLink = (method: PaymentMethod) => {
    const link = generatePaymentLink(
      method,
      toUserName, // Asumiendo que el nombre de usuario es el handle
      settlement.amount,
      `Pago ${eventName}`
    );

    if (link) {
      Linking.canOpenURL(link).then(supported => {
        if (supported) {
          Linking.openURL(link);
        } else {
          Alert.alert('Error', 'No se puede abrir el enlace');
        }
      });
    } else {
      Alert.alert('Info', 'Este método no tiene enlace directo disponible');
    }
  };

  const handlePayNow = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Selecciona un método de pago primero');
      return;
    }

    try {
      // Abrir el método de pago directamente
      const link = generatePaymentLink(
        selectedMethod,
        toUserName,
        settlement.amount,
        `Pago ${eventName}`
      );

      if (link) {
        const supported = await Linking.canOpenURL(link);
        if (supported) {
          await Linking.openURL(link);
          // Después de abrir, marcar como enviado
          setTimeout(() => {
            handleMarkAsPaid();
          }, 1000);
        } else {
          // Si no se puede abrir el link, solo marcar el pago
          console.log('⚠️ No se puede abrir el link, marcando pago directamente');
          handleMarkAsPaid();
        }
      } else {
        // Para métodos sin enlace directo (efectivo, transferencia, etc), solo marcar
        handleMarkAsPaid();
      }
    } catch (error) {
      console.error('Error en handlePayNow:', error);
      // En caso de error, permitir marcar el pago manualmente
      handleMarkAsPaid();
    }
  };

  const getBizumQRData = () => {
    // Generar datos para QR de Bizum
    return JSON.stringify({
      type: 'bizum',
      recipientName: toUserName,
      amount: settlement.amount.toFixed(2),
      currency,
      description: `Pago ${eventName}`,
      eventId,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {existingPayment && existingPayment.status === 'sent_waiting_confirmation' && isCreditor
                ? '✅ Confirmar Pago'
                : '💰 Realizar Pago'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
            {/* Info del pago */}
            <View style={[styles.paymentInfo, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.paymentAmount, { color: theme.colors.primary }]}>
                {settlement.amount.toFixed(2)} {currency}
              </Text>
              <Text style={[styles.paymentFrom, { color: theme.colors.text }]}>
                {fromUserName} → {toUserName}
              </Text>
              <Text style={[styles.paymentEvent, { color: theme.colors.textSecondary }]}>
                {eventName}
              </Text>
            </View>

            {/* SIEMPRE mostrar opciones de pago */}
            {existingPayment && existingPayment.status === 'sent_waiting_confirmation' ? (
              <View style={styles.confirmationSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  ⏳ Pago pendiente de confirmación
                </Text>
                <Text style={[styles.paymentDetail, { color: theme.colors.textSecondary }]}>
                  Método: {existingPayment.paymentMethod?.toUpperCase()}
                </Text>
                {existingPayment.reference && (
                  <Text style={[styles.paymentDetail, { color: theme.colors.textSecondary }]}>
                    Referencia: {existingPayment.reference}
                  </Text>
                )}
                {existingPayment.note && (
                  <Text style={[styles.paymentDetail, { color: theme.colors.textSecondary }]}>
                    Nota: {existingPayment.note}
                  </Text>
                )}

                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: theme.colors.success }]}
                    onPress={handleConfirmPayment}
                    disabled={loading}
                  >
                    <Text style={styles.confirmButtonText}>✓ Confirmar Recibido</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, { backgroundColor: theme.colors.error }]}
                    onPress={handleRejectPayment}
                    disabled={loading}
                  >
                    <Text style={styles.rejectButtonText}>✗ Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Mostrar opciones de pago para marcar como pagado
              <>
                <Text style={[styles.sectionTitle, { 
                  color: theme.colors.text,
                  fontSize: 18,
                  fontWeight: '700',
                  marginBottom: 16,
                }]}>
                  💳 Selecciona método de pago:
                </Text>

                <View style={styles.methodsGrid}>
                  {paymentMethods.map((method) => (
                    <View key={method.id} style={styles.methodContainer}>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          selectedMethod === method.id && {
                            backgroundColor: theme.colors.primary,
                            borderWidth: 3,
                            borderColor: theme.colors.primary,
                          },
                        ]}
                        onPress={() => setSelectedMethod(method.id)}
                      >
                        <View style={styles.methodLogoContainer}>
                          <PaymentMethodLogo 
                            method={method.id} 
                            width={method.id === 'apple_pay' || method.id === 'google_pay' ? 50 : 40} 
                            height={40} 
                          />
                        </View>
                        <Text
                          style={[
                            styles.methodName,
                            {
                              color:
                                selectedMethod === method.id
                                  ? '#FFFFFF'
                                  : theme.colors.text,
                            },
                          ]}
                        >
                          {method.name}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {selectedMethod && (
                  <>
                    {/* Mostrar QR para Bizum */}
                    {selectedMethod === 'bizum' && (
                      <View style={[styles.qrContainer, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.qrTitle, { color: theme.colors.text }]}>
                          📱 Código QR para Bizum
                        </Text>
                        <View style={styles.qrCodeWrapper}>
                          <QRCode
                            value={getBizumQRData()}
                            size={200}
                            backgroundColor="white"
                            color="black"
                          />
                        </View>
                        <TouchableOpacity
                          style={[styles.payButton, { backgroundColor: theme.colors.success || theme.colors.primary }]}
                          onPress={handleMarkAsPaid}
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <>
                              <Text style={styles.payButtonIcon}>💳</Text>
                              <Text style={styles.payButtonText}>PAGAR CON BIZUM</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <Text style={[styles.qrInstructions, { color: theme.colors.textSecondary }]}>
                          Escanea este código con tu app de Bizum
                        </Text>
                      </View>
                    )}

                    {/* Botón PAGAR principal (solo para métodos no-Bizum) */}
                    {selectedMethod !== 'bizum' && (
                      <TouchableOpacity
                        style={[styles.payButton, { backgroundColor: theme.colors.success || theme.colors.primary }]}
                        onPress={handlePayNow}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.payButtonIcon}>💳</Text>
                            <Text style={styles.payButtonText}>
                              PAGAR CON {paymentMethods.find(m => m.id === selectedMethod)?.name.toUpperCase()}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Campos opcionales */}
                    <View style={styles.optionalFields}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: 14 }]}>
                        Referencia (opcional):
                      </Text>
                      <TextInput
                        style={[styles.input, { 
                          backgroundColor: theme.colors.background,
                          color: theme.colors.text,
                          borderColor: theme.colors.border,
                        }]}
                        placeholder="Ej: Número de transacción"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={reference}
                        onChangeText={setReference}
                      />

                      <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: 14 }]}>
                        Nota (opcional):
                      </Text>
                      <TextInput
                        style={[styles.input, styles.textArea, { 
                          backgroundColor: theme.colors.background,
                          color: theme.colors.text,
                          borderColor: theme.colors.border,
                        }]}
                        placeholder="Ej: Pagado el 28/11"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  content: {
    flexGrow: 1,
  },
  paymentInfo: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentFrom: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentEvent: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  methodContainer: {
    width: '48%',
    marginBottom: 12,
  },
  methodButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    minHeight: 110,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodLogoContainer: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  linkButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationSection: {
    marginTop: 8,
  },
  paymentDetail: {
    fontSize: 14,
    marginBottom: 6,
  },
  confirmButtons: {
    marginTop: 20,
    gap: 12,
  },
  confirmButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    padding: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 15,
    textAlign: 'center',
  },
  qrContainer: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  qrCodeWrapper: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  qrInstructions: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  payButton: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  payButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  optionalFields: {
    marginTop: 8,
    opacity: 0.8,
  },
});
