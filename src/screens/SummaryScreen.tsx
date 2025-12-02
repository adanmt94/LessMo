/**
 * SummaryScreen - Pantalla de resumen completo con gráficos y liquidaciones
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { RootStackParamList, Event, CategoryColors, CategoryLabels, CurrencySymbols } from '../types';
import { Card, Button } from '../components/lovable';
import { getEvent } from '../services/firebase';
import { useExpenses } from '../hooks/useExpenses';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuthContext } from '../context/AuthContext';
import { optimizeSettlements } from '../services/settlementOptimizationService';
import { SettlementOptimizationCard } from '../components/SettlementOptimizationCard';
import { exportAndSharePDF } from '../services/pdfService';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { formatCurrency, formatNumber } from '../utils/numberUtils';
import { MarkPaymentModal } from '../components/MarkPaymentModal';
import { getEventPayments, Payment } from '../services/paymentConfirmationService';

type SummaryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Summary'>;
type SummaryScreenRouteProp = RouteProp<RootStackParamList, 'Summary'>;

interface Props {
  navigation: SummaryScreenNavigationProp;
  route: SummaryScreenRouteProp;
}

const screenWidth = Dimensions.get('window').width;

export const SummaryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { eventId } = route.params;
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const styles = getStyles(theme);
  const [event, setEvent] = useState<Event | null>(null);
  const [sharing, setSharing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  const {
    expenses,
    participants,
    getTotalExpenses,
    getRemainingBalance,
    getExpensesByCategory,
    getParticipantBalances,
    calculateSettlements,
    getParticipantById,
  } = useExpenses(eventId);

  useEffect(() => {
    loadEvent();
    scheduleSettlementReminders();
    loadPayments();
  }, [eventId]);

  // Programar recordatorios para los settlements
  const scheduleSettlementReminders = async () => {
    try {
      const settlements = calculateSettlements();
      if (settlements.length === 0) return;

      const { scheduleRemindersForEvent } = await import('../services/debtReminderService');
      await scheduleRemindersForEvent(eventId, event?.name || 'Evento', settlements, participants);
    } catch (error) {
      
    }
  };

  const loadEvent = async () => {
    try {
      const eventData = await getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      Alert.alert(t('common.error'), t('eventSummary.errorLoading'));
    }
  };

  const loadPayments = async () => {
    try {
      const eventPayments = await getEventPayments(eventId);
      setPayments(eventPayments);
    } catch (error) {
      
    }
  };

  const handleMarkPayment = (settlement: any) => {
    const from = getParticipantById(settlement.from);
    const to = getParticipantById(settlement.to);
    
    if (!from || !to) return;
    
    setSelectedSettlement({
      ...settlement,
      fromName: from.name,
      toName: to.name,
    });
    setShowPaymentModal(true);
  };

  const handlePaymentMarked = () => {
    loadPayments(); // Recargar pagos
    scheduleSettlementReminders(); // Actualizar recordatorios
  };

  const exportToPDF = async () => {
    if (!event) return;

    try {
      setExporting(true);

      await exportAndSharePDF(event, expenses, participants, {
        includeExpenses: true,
        includeSettlements: true,
        includeStatistics: true,
        includePhotos: false,
        language: t === undefined ? 'es' : (t('common.language') === 'es' ? 'es' : 'en'),
      });

      Alert.alert(
        t('common.success') || 'Éxito',
        t('eventSummary.pdfExported') || 'PDF exportado correctamente',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      
      Alert.alert(
        t('common.error') || 'Error',
        error.message || (t('eventSummary.errorExporting') || 'Error al exportar PDF'),
        [{ text: 'OK' }]
      );
    } finally {
      setExporting(false);
    }
  };

  const shareAsText = async () => {
    try {
      setSharing(true);
      const totalExpenses = getTotalExpenses();
      const remainingBalance = getRemainingBalance(event!.initialBudget);
      const settlements = calculateSettlements();
      const currencySymbol = CurrencySymbols[event!.currency as keyof typeof CurrencySymbols];

      let text = `📊 RESUMEN DE ${event!.name.toUpperCase()}\n\n`;
      text += `💰 Presupuesto: ${currencySymbol}${event!.initialBudget.toFixed(2)}\n`;
      text += `💸 Gastado: ${currencySymbol}${totalExpenses.toFixed(2)}\n`;
      text += `💵 Restante: ${currencySymbol}${remainingBalance.toFixed(2)}\n\n`;
      
      text += `👥 PARTICIPANTES:\n`;
      participants.forEach(p => {
        text += `• ${p.name}: ${currencySymbol}${p.individualBudget.toFixed(2)}\n`;
      });

      if (settlements.length > 0) {
        text += `\n💳 LIQUIDACIONES:\n`;
        settlements.forEach(s => {
          const from = getParticipantById(s.from);
          const to = getParticipantById(s.to);
          text += `• ${from?.name} debe ${currencySymbol}${s.amount.toFixed(2)} a ${to?.name}\n`;
        });
      }

      await Share.share({
        message: text,
        title: `${t('eventSummary.title')} - ${event!.name}`,
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('eventSummary.errorSharing'));
    } finally {
      setSharing(false);
    }
  };

  const exportAsImage = async () => {
    try {
      setExporting(true);
      if (!viewShotRef.current?.capture) {
        Alert.alert(t('common.error'), t('eventSummary.errorExporting'));
        return;
      }

      const uri = await viewShotRef.current.capture();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: t('eventSummary.shareImage'),
        });
      } else {
        Alert.alert(t('common.info'), t('eventSummary.sharingNotAvailable'));
      }
    } catch (error) {
      
      Alert.alert(t('common.error'), t('eventSummary.errorExporting'));
    } finally {
      setExporting(false);
    }
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>{t('eventSummary.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currencySymbol = CurrencySymbols[event.currency as keyof typeof CurrencySymbols];
  const totalExpenses = getTotalExpenses();
  const remainingBalance = getRemainingBalance(event.initialBudget);
  const expensesByCategory = getExpensesByCategory();
  const participantBalances = getParticipantBalances();
  const settlements = calculateSettlements();

  // Función para obtener el desglose de gastos de un participante
  const getParticipantExpenseBreakdown = (participantId: string) => {
    const paid: Array<{ description: string; amount: number; category: string }> = [];
    const owes: Array<{ description: string; amount: number; from: string; category: string }> = [];

    expenses.forEach((expense) => {
      // Gastos que pagó este participante
      if (expense.paidBy === participantId) {
        paid.push({
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
        });
      }

      // Gastos en los que es beneficiario
      if (expense.beneficiaries.includes(participantId)) {
        const payer = getParticipantById(expense.paidBy);
        let owedAmount = 0;

        if (expense.splitType === 'custom' && expense.customSplits) {
          owedAmount = expense.customSplits[participantId] || 0;
        } else {
          owedAmount = expense.amount / expense.beneficiaries.length;
        }

        // Solo agregar si no es el que pagó (para no mostrar que se debe a sí mismo)
        if (expense.paidBy !== participantId) {
          owes.push({
            description: expense.description,
            amount: owedAmount,
            from: payer?.name || 'Desconocido',
            category: expense.category,
          });
        }
      }
    });

    return { paid, owes };
  };

  // Datos para el gráfico de pastel
  const chartData = expensesByCategory.map((item) => ({
    name: CategoryLabels[item.category].split(' ')[1], // Quitamos el emoji
    population: item.total,
    color: CategoryColors[item.category],
    legendFontColor: '#6B7280',
    legendFontSize: 12,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
        {/* Resumen general */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('eventSummary.generalSummary')}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('eventSummary.initialBudget')}</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(event.initialBudget, event.currency as any)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('eventSummary.totalSpent')}</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {formatCurrency(totalExpenses, event.currency as any)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>{t('eventSummary.remainingBalance')}</Text>
            <Text
              style={[
                styles.summaryValueBold,
                { color: remainingBalance >= 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {formatCurrency(remainingBalance, event.currency as any)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('eventSummary.totalExpenses')}</Text>
            <Text style={styles.summaryValue}>{expenses.length}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('eventSummary.participants')}</Text>
            <Text style={styles.summaryValue}>{participants.length}</Text>
          </View>
        </Card>

        {/* Accesos rápidos a funciones avanzadas */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Analytics', { eventId })}
          >
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionText}>Analíticas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: theme.colors.success }]}
            onPress={() => navigation.navigate('PaymentHistory', { eventId, eventName: event.name })}
          >
            <Text style={styles.quickActionIcon}>💳</Text>
            <Text style={styles.quickActionText}>Pagos</Text>
          </TouchableOpacity>
        </View>

        {/* Gráfico de gastos por categoría */}
        {chartData.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>{t('eventSummary.expensesByCategory')}</Text>
            
            <PieChart
              data={chartData}
              width={screenWidth - 80}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />

            <View style={styles.categoryList}>
              {expensesByCategory.map((item) => (
                <View key={item.category} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: CategoryColors[item.category] },
                      ]}
                    />
                    <Text style={styles.categoryName}>
                      {CategoryLabels[item.category]}
                    </Text>
                  </View>
                  <View style={styles.categoryStats}>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(item.total, event.currency as any)}
                    </Text>
                    <Text style={styles.categoryPercentage}>
                      ({formatNumber(item.percentage, 1)}%)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Balances de participantes */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('eventSummary.participantBalance')}</Text>
          
          {participantBalances.map((balance) => {
            const breakdown = getParticipantExpenseBreakdown(balance.participantId);
            const isExpanded = expandedParticipant === balance.participantId;

            return (
              <View key={balance.participantId} style={styles.balanceItem}>
                <TouchableOpacity
                  onPress={() => setExpandedParticipant(isExpanded ? null : balance.participantId)}
                  style={styles.balanceHeader}
                >
                  <View style={styles.balanceHeaderContent}>
                    <Text style={styles.balanceName}>{balance.participantName}</Text>
                    <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.balanceDetails}>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>{t('eventSummary.paid')}</Text>
                    <Text style={styles.balanceAmount}>
                      {formatCurrency(balance.totalPaid, event.currency as any)}
                    </Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>{t('eventSummary.owes')}</Text>
                    <Text style={styles.balanceAmount}>
                      {formatCurrency(balance.totalOwed, event.currency as any)}
                    </Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabelBold}>{t('eventSummary.balance')}</Text>
                    <Text
                      style={[
                        styles.balanceAmountBold,
                        { color: balance.balance >= 0 ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {balance.balance >= 0 ? '+' : ''}
                      {formatCurrency(Math.abs(balance.balance), event.currency as any)}
                    </Text>
                  </View>
                </View>

                {/* Desglose detallado */}
                {isExpanded && (
                  <View style={styles.breakdownContainer}>
                    {/* Gastos pagados */}
                    {breakdown.paid.length > 0 && (
                      <View style={styles.breakdownSection}>
                        <Text style={styles.breakdownTitle}>{t('eventSummary.expensesPaid')}</Text>
                        {breakdown.paid.map((item, index) => (
                          <View key={`paid-${index}`} style={styles.breakdownItem}>
                            <Text style={styles.breakdownDescription}>
                              {CategoryLabels[item.category as keyof typeof CategoryLabels]} {item.description}
                            </Text>
                            <Text style={styles.breakdownAmount}>
                              +{currencySymbol}{item.amount.toFixed(2)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Gastos que debe */}
                    {breakdown.owes.length > 0 && (
                      <View style={styles.breakdownSection}>
                        <Text style={styles.breakdownTitle}>{t('eventSummary.expensesReceived')}</Text>
                        {breakdown.owes.map((item, index) => (
                          <View key={`owes-${index}`} style={styles.breakdownItem}>
                            <View style={styles.breakdownTextContainer}>
                              <Text style={styles.breakdownDescription}>
                                {CategoryLabels[item.category as keyof typeof CategoryLabels]} {item.description}
                              </Text>
                              <Text style={styles.breakdownFrom}>
                                (pagado por {item.from})
                              </Text>
                            </View>
                            <Text style={[styles.breakdownAmount, styles.breakdownDebt]}>
                              -{currencySymbol}{item.amount.toFixed(2)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </Card>

        {/* Optimización de Liquidaciones */}
        {event && participants.length > 0 && expenses.length > 0 && (
          <SettlementOptimizationCard
            optimization={optimizeSettlements(expenses, participants)}
            onSelectSettlement={(settlement) => {
              navigation.navigate('PaymentMethod', {
                recipientName: settlement.to.name,
                amount: settlement.amount,
                currency: event.currency,
                description: `Liquidación - ${event.name}`,
                eventId: eventId,
                eventName: event.name,
              });
            }}
          />
        )}

        {/* Liquidaciones sugeridas */}
        {settlements.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>{t('eventSummary.settlements')}</Text>
            <Text style={styles.cardSubtitle}>
              {t('eventSummary.settlementsSubtitle')}
            </Text>

            {settlements.map((settlement, index) => {
              const fromParticipant = getParticipantById(settlement.from);
              const toParticipant = getParticipantById(settlement.to);
              
              // Buscar si hay un pago asociado a este settlement
              const relatedPayment = payments.find(p => 
                p.fromUserId === settlement.from && 
                p.toUserId === settlement.to &&
                (p.status === 'pending' || p.status === 'sent_waiting_confirmation')
              );
              
              const paymentStatus = relatedPayment?.status;

              return (
                <View key={index} style={styles.settlementItem}>
                  <View style={styles.settlementInfo}>
                    <Text style={styles.settlementText}>
                      <Text style={styles.settlementName}>{fromParticipant?.name}</Text>
                      {' → '}
                      <Text style={styles.settlementName}>{toParticipant?.name}</Text>
                    </Text>
                    <Text style={styles.settlementAmount}>
                      {currencySymbol}{settlement.amount.toFixed(2)}
                    </Text>
                    {paymentStatus === 'sent_waiting_confirmation' && (
                      <Text style={styles.paymentStatusBadge}>⏳ Pendiente confirmación</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      paymentStatus === 'sent_waiting_confirmation' && styles.payButtonPending
                    ]}
                    onPress={() => handleMarkPayment(settlement)}
                  >
                    <Text style={styles.payButtonText}>
                      {paymentStatus === 'sent_waiting_confirmation' ? '✓ Confirmar' : '💳 Marcar Pago'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </Card>
        )}
        </ViewShot>

        {/* Botones de compartir */}
        <View style={styles.shareActions}>
          <TouchableOpacity
            style={[styles.shareButton, styles.shareButtonOutline, { borderColor: theme.colors.primary }]}
            onPress={exportAsImage}
            disabled={exporting}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.shareIcon, { color: theme.colors.primary }]}>📸</Text>
            </View>
            <Text style={[styles.shareButtonText, { color: theme.colors.text, fontWeight: '800' }]} numberOfLines={2}>
              {t('eventSummary.exportAsImage')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.shareButton, styles.shareButtonOutline, { borderColor: theme.colors.primary }]}
            onPress={shareAsText}
            disabled={sharing}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.shareIcon, { color: theme.colors.primary }]}>↗</Text>
            </View>
            <Text style={[styles.shareButtonText, { color: theme.colors.text, fontWeight: '800' }]} numberOfLines={2}>
              {t('eventSummary.shareAsText')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.shareButton, styles.shareButtonPrimary, { backgroundColor: theme.colors.primary }]}
            onPress={exportToPDF}
            disabled={exporting}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Text style={[styles.shareIcon, { color: '#FFFFFF' }]}>📄</Text>
            </View>
            <Text style={[styles.shareButtonText, { color: '#FFFFFF', fontWeight: '800', fontSize: 14 }]} numberOfLines={1}>
              PDF
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de marcar pago */}
      {selectedSettlement && event && (
        <MarkPaymentModal
          visible={showPaymentModal}
          settlement={selectedSettlement}
          fromUserName={selectedSettlement.fromName}
          toUserName={selectedSettlement.toName}
          eventId={eventId}
          eventName={event.name}
          currency={event.currency}
          currentUserId={user?.uid || ''}
          onClose={() => setShowPaymentModal(false)}
          onPaymentMarked={handlePaymentMarked}
          existingPayment={payments.find(p => 
            p.fromUserId === selectedSettlement.from && 
            p.toUserId === selectedSettlement.to &&
            (p.status === 'pending' || p.status === 'sent_waiting_confirmation')
          )}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  categoryList: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 8,
  },
  categoryPercentage: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  balanceItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  balanceHeader: {
    marginBottom: 8,
  },
  balanceHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  expandIcon: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  balanceDetails: {
    marginLeft: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 14,
    color: theme.colors.text,
  },
  balanceLabelBold: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  balanceAmountBold: {
    fontSize: 16,
    fontWeight: '700',
  },
  settlementItem: {
    flexDirection: 'column',
    padding: 12,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 8,
    marginBottom: 8,
  },
  settlementInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settlementText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  settlementName: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  payButtonPending: {
    backgroundColor: theme.colors.success || '#10B981',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentStatusBadge: {
    fontSize: 11,
    color: theme.colors.warning || '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  exportButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  breakdownContainer: {
    marginTop: 12,
    marginLeft: 8,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 8,
    padding: 12,
  },
  breakdownSection: {
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 8,
  },
  breakdownTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  breakdownDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  breakdownFrom: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  breakdownAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.success,
  },
  breakdownDebt: {
    color: theme.colors.error,
  },
  shareActions: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 16,
    gap: 8,
  },
  shareButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 8,
    minHeight: 75,
    justifyContent: 'center',
  },
  shareButtonOutline: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  shareButtonPrimary: {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  quickActionIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  shareIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  shareIcon: {
    fontSize: 22,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 16,
  },
});
