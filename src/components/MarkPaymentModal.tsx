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

  const paymentMethods: { id: PaymentMethod; name: string; icon: string; hasLink: boolean }[] = [
    { id: 'bizum', name: 'Bizum', icon: '📱', hasLink: false },
    { id: 'paypal', name: 'PayPal', icon: '💳', hasLink: true },
    { id: 'venmo', name: 'Venmo', icon: '💸', hasLink: true },
    { id: 'bank_transfer', name: 'Transferencia', icon: '🏦', hasLink: false },
    { id: 'cash', name: 'Efectivo', icon: '💵', hasLink: false },
    { id: 'other', name: 'Otro', icon: '📋', hasLink: false },
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
      
      Alert.alert('Error', 'No se pudo marcar el pago');
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
                : '💳 Marcar como Pagado'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
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

            {/* Si hay pago pendiente de confirmación y eres el receptor */}
            {existingPayment && existingPayment.status === 'sent_waiting_confirmation' && isCreditor ? (
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
            ) : isDebtor ? (
              // Si eres el deudor, muestra opciones para marcar como pagado
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Selecciona método de pago:
                </Text>

                <View style={styles.methodsGrid}>
                  {paymentMethods.map((method) => (
                    <View key={method.id} style={styles.methodContainer}>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          selectedMethod === method.id && {
                            backgroundColor: theme.colors.primary,
                          },
                        ]}
                        onPress={() => setSelectedMethod(method.id)}
                      >
                        <Text style={styles.methodIcon}>{method.icon}</Text>
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
                      {method.hasLink && (
                        <TouchableOpacity
                          style={[styles.linkButton, { borderColor: theme.colors.primary }]}
                          onPress={() => handleOpenPaymentLink(method.id)}
                        >
                          <Text style={[styles.linkButtonText, { color: theme.colors.primary }]}>
                            🔗 Abrir
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {selectedMethod && (
                  <>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
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

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
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
                      numberOfLines={3}
                    />

                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                      onPress={handleMarkAsPaid}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          ✓ Marcar como Pagado
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              // Si eres el receptor pero no hay pago pendiente
              <View style={styles.infoSection}>
                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                  Esperando a que {fromUserName} marque el pago como realizado
                </Text>
              </View>
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
    maxHeight: '85%',
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
    flex: 1,
  },
  paymentInfo: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
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
    marginTop: 8,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  methodContainer: {
    width: '48%',
  },
  methodButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 8,
  },
  methodIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
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
});
