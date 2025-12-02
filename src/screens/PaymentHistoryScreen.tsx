/**
 * PaymentHistoryScreen - Historial de pagos de un evento
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Card } from '../components/lovable';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import {
  getEventPayments,
  getPaymentStats,
  Payment,
  PaymentHistory as PaymentHistoryType,
  confirmPayment,
  rejectPayment,
} from '../services/paymentConfirmationService';

type PaymentHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentHistory'>;
type PaymentHistoryScreenRouteProp = RouteProp<RootStackParamList, 'PaymentHistory'>;

interface Props {
  navigation: PaymentHistoryScreenNavigationProp;
  route: PaymentHistoryScreenRouteProp;
}

export const PaymentHistoryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { eventId, eventName } = route.params;
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const styles = getStyles(theme);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentHistoryType | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, [eventId]);

  const loadPayments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [paymentsData, statsData] = await Promise.all([
        getEventPayments(eventId),
        getPaymentStats(eventId),
      ]);

      setPayments(paymentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading payments:', error);
      Alert.alert('Error', 'No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConfirm = async (paymentId: string, fromUserName: string, amount: number) => {
    Alert.alert(
      'Confirmar pago recibido',
      `¿Confirmas que recibiste ${amount.toFixed(2)} de ${fromUserName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await confirmPayment(paymentId, user?.uid || '');
              Alert.alert('✅ Confirmado', 'El pago ha sido confirmado');
              loadPayments();
            } catch (error) {
              Alert.alert('Error', 'No se pudo confirmar el pago');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (paymentId: string) => {
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
              await rejectPayment(paymentId, user?.uid || '', reason);
              Alert.alert('Pago rechazado', 'El pagador será notificado');
              loadPayments();
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar el pago');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success || '#10B981';
      case 'pending':
      case 'sent_waiting_confirmation':
        return theme.colors.warning || '#F59E0B';
      case 'rejected':
      case 'cancelled':
        return theme.colors.error || '#EF4444';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: Payment['status']) => {
    switch (status) {
      case 'confirmed':
        return '✓ Confirmado';
      case 'pending':
        return '⏳ Pendiente';
      case 'sent_waiting_confirmation':
        return '⏰ Esperando confirmación';
      case 'rejected':
        return '✗ Rechazado';
      case 'cancelled':
        return '🚫 Cancelado';
      default:
        return status;
    }
  };

  const renderPaymentCard = (payment: Payment) => {
    const isExpanded = expandedPayment === payment.id;
    const statusColor = getStatusColor(payment.status);

    return (
      <TouchableOpacity
        key={payment.id}
        style={[styles.paymentCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => setExpandedPayment(isExpanded ? null : payment.id)}
        activeOpacity={0.7}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Text style={[styles.paymentFrom, { color: theme.colors.text }]}>
              {payment.fromUserName} → {payment.toUserName}
            </Text>
            <Text style={[styles.paymentAmount, { color: theme.colors.primary }]}>
              {payment.amount.toFixed(2)} {payment.currency}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(payment.status)}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Método:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {payment.paymentMethod?.toUpperCase() || 'No especificado'}
              </Text>
            </View>

            {payment.reference && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Referencia:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {payment.reference}
                </Text>
              </View>
            )}

            {payment.note && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Nota:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {payment.note}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Creado:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {payment.createdAt.toLocaleDateString()}
              </Text>
            </View>

            {payment.markedAsPaidAt && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Marcado como pagado:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {payment.markedAsPaidAt.toLocaleDateString()}
                </Text>
              </View>
            )}

            {payment.confirmedAt && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Confirmado:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {payment.confirmedAt.toLocaleDateString()}
                </Text>
              </View>
            )}

            {payment.rejectionReason && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Razón rechazo:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.error }]}>
                  {payment.rejectionReason}
                </Text>
              </View>
            )}

            {/* Botones de acción para pagos pendientes de confirmación */}
            {payment.status === 'sent_waiting_confirmation' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => handleConfirm(payment.id, payment.fromUserName, payment.amount)}
                >
                  <Text style={styles.actionButtonText}>✓ Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(payment.id)}
                >
                  <Text style={styles.actionButtonText}>✗ Rechazar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Cargando pagos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Historial de Pagos</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPayments(true)}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Estadísticas */}
        {stats && (
          <Card style={styles.statsCard}>
            <Text style={[styles.statsTitle, { color: theme.colors.text }]}>Resumen</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  €{stats.totalPaid.toFixed(2)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Confirmados
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                  €{stats.totalPending.toFixed(2)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Pendientes
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.error }]}>
                  €{stats.totalRejected.toFixed(2)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Rechazados
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Lista de pagos */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Todos los Pagos ({payments.length})
        </Text>

        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No hay pagos registrados
            </Text>
            <Text style={[styles.emptyHint, { color: theme.colors.textSecondary }]}>
              Los pagos aparecerán aquí cuando se marquen como realizados
            </Text>
          </View>
        ) : (
          payments.map(renderPaymentCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  statsCard: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  paymentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentFrom: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: theme.colors.success || '#10B981',
  },
  rejectButton: {
    backgroundColor: theme.colors.error || '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
