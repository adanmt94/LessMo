/**
 * EventDetailScreen - Pantalla de detalle del evento con tabs
 */

import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Event, CurrencySymbols } from '../types';
import { Button, Card, ExpenseItem, ParticipantItem } from '../components/lovable';
import { getEvent } from '../services/firebase';
import { useExpenses } from '../hooks/useExpenses';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/numberUtils';
import { BudgetPredictionCard } from '../components/BudgetPredictionCard';
import { RecommendationsCard } from '../components/RecommendationsCard';
import { 
  predictBudgetExceedance, 
  analyzeSpendingByCategory,
  compareWithSimilarEvents,
  calculateGroupEfficiency 
} from '../services/budgetPredictionService';

type EventDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EventDetail'>;
type EventDetailScreenRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;

interface Props {
  navigation: EventDetailScreenNavigationProp;
  route: EventDetailScreenRouteProp;
}

type TabType = 'expenses' | 'participants' | 'summary';

export const EventDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { eventId } = route.params;
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('expenses');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    expenses,
    participants,
    loading,
    loadData,
    getTotalExpenses,
    getRemainingBalance,
    getParticipantById,
    getParticipantBalances,
  } = useExpenses(eventId);

  // No header buttons - they will be in the screen content

  // Reload event data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadEvent();
      loadData();
    }, [eventId])
  );

  const loadEvent = async () => {
    try {
      const eventData = await getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el evento');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadEvent(), loadData()]);
    setRefreshing(false);
  };

  const handleEditEvent = () => {
    navigation.navigate('CreateEvent', { 
      eventId: eventId, 
      mode: 'edit' 
    });
  };

  const handleDeleteEvent = () => {
    Alert.alert(
      t('event.delete'),
      t('eventDetail.deleteConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteEvent } = await import('../services/firebase');
              await deleteEvent(eventId);
              Alert.alert(t('common.success'), t('event.deleteEvent'), [
                {
                  text: t('common.ok'),
                  onPress: () => navigation.navigate('MainTabs', { screen: 'Events' } as any),
                },
              ]);
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('eventDetail.deleteEventError'));
            }
          },
        },
      ]
    );
  };

  const handleShareEvent = async () => {
    if (!event) return;
    
    try {
      const deepLink = event.inviteCode 
        ? `lessmo://join/${event.inviteCode}`
        : `lessmo://event/${event.id}`;
      
      const message = event.inviteCode 
        ? `🎉 ¡Únete a "${event.name}"!\n\n💰 Presupuesto: ${event.initialBudget} ${CurrencySymbols[event.currency]}\n🔑 Código: ${event.inviteCode}\n\n� Enlace directo: ${deepLink}\n\n�📱 Descarga LessMo para gestionar gastos compartidos`
        : `🎉 Te invito a "${event.name}"\n\n💰 Presupuesto: ${event.initialBudget} ${CurrencySymbols[event.currency]}\n\n🔗 Enlace: ${deepLink}\n\n📱 Descarga LessMo para gestionar gastos compartidos`;

      await Share.share({
        message: message,
        title: `Invitación a ${event.name}`,
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'No se pudo compartir el evento');
      }
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    Alert.alert(
      t('common.deleteConfirmTitle'),
      t('eventDetail.deleteExpenseConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implementar función deleteExpense que revierta los balances
              Alert.alert(t('common.error'), t('eventDetail.deleteNotImplemented'));
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('eventDetail.deleteExpenseError'));
            }
          }
        }
      ]
    );
  };

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando...</Text>
        </View>
      </View>
    );
  }

  const currencySymbol = CurrencySymbols[event.currency];
  const totalExpenses = getTotalExpenses();
  const remainingBalance = getRemainingBalance(event.initialBudget);

  // Filtrar gastos por búsqueda
  const filteredExpenses = searchQuery.trim()
    ? expenses.filter(e => 
        e.description.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        getParticipantById(e.paidBy)?.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : expenses;

  const renderExpenses = () => (
    <View style={styles.tabContent}>
      {expenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyText}>{t('eventDetail.noExpenses')}</Text>
          <Button
            title={t('expense.add')}
            onPress={() => navigation.navigate('AddExpense', { eventId })}
            style={styles.emptyButton}
          />
        </View>
      ) : filteredExpenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>{t('eventDetail.noExpensesFound')}</Text>
          <Text style={styles.emptySubtext}>{t('groupEvents.tryAnotherTerm')}</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredExpenses.map((expense) => {
            const participant = getParticipantById(expense.paidBy);
            return (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                participantName={participant?.name || 'Desconocido'}
                participantPhoto={participant?.photoURL}
                currency={event.currency}
                onPress={() => navigation.navigate('AddExpense', { 
                  eventId, 
                  expenseId: expense.id, 
                  mode: 'edit' 
                })}
                onDelete={() => handleDeleteExpense(expense.id)}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const handleEditParticipants = () => {
    console.log('✏️ Editando participantes del evento:', eventId);
    navigation.navigate('CreateEvent', { 
      eventId,
      mode: 'edit'
    });
  };

  const renderParticipants = () => {
    // Calcular balances de participantes basado en gastos
    const participantBalances = getParticipantBalances();

    return (
      <View style={styles.tabContent}>
        <View style={styles.editParticipantsContainer}>
          <Button
            title={t('eventDetail.editParticipants')}
            onPress={handleEditParticipants}
            variant="outline"
            fullWidth
          />
        </View>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {participants.map((participant) => {
            const balance = participantBalances.find(b => b.participantId === participant.id);
            return (
              <ParticipantItem
                key={participant.id}
                participant={participant}
                currency={event.currency}
                totalPaid={balance?.totalPaid}
                totalOwed={balance?.totalOwed}
                balance={balance?.balance}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderSummary = () => {
    const percentageSpent = event.initialBudget > 0 
      ? (totalExpenses / event.initialBudget) * 100 
      : 0;

    return (
      <ScrollView
        style={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('eventDetail.summaryTitle')}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Presupuesto inicial</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(event.initialBudget, event.currency as any)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total gastado</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {formatCurrency(totalExpenses, event.currency as any)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Saldo restante</Text>
            <Text style={[styles.summaryValueBold, { color: remainingBalance >= 0 ? '#10B981' : '#EF4444' }]}>
              {formatCurrency(remainingBalance, event.currency as any)}
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(100, percentageSpent)}%`,
                  backgroundColor: percentageSpent > 100 ? '#EF4444' : '#6366F1',
                },
              ]}
            />
          </View>
          <Text style={styles.percentageText}>
            {percentageSpent.toFixed(1)}% del presupuesto usado
          </Text>
        </Card>

        {/* Recomendaciones Contextuales */}
        {expenses.length >= 1 && event && (
          <RecommendationsCard
            event={event}
            expenses={expenses}
            participants={participants}
          />
        )}

        {/* Predicción de Presupuesto con IA */}
        {expenses.length >= 2 && event && (
          <BudgetPredictionCard
            prediction={predictBudgetExceedance(event, expenses, participants)}
            insights={analyzeSpendingByCategory(expenses, event.initialBudget)}
            onViewDetails={() => {
              const comparison = compareWithSimilarEvents(event, totalExpenses);
              const efficiency = calculateGroupEfficiency(event, expenses, participants);
              
              Alert.alert(
                `${efficiency.badge} Análisis Completo`,
                `📊 Eficiencia del grupo: ${efficiency.level} (${efficiency.score}/100)\n\n` +
                `${comparison.message}\n\n` +
                `💡 Consejos:\n${efficiency.tips.map(tip => `• ${tip}`).join('\n')}`,
                [{ text: 'Entendido' }]
              );
            }}
          />
        )}

        <Button
          title="Ver gráficos y liquidaciones"
          onPress={() => navigation.navigate('Summary', { eventId })}
          variant="outline"
          fullWidth
        />
      </ScrollView>
    );
  };

  const handleExportToExcel = async () => {
    try {
      const { exportExpensesToExcel } = await import('../utils/exportUtils');
      await exportExpensesToExcel(event, expenses, participants);
      Alert.alert('Éxito', 'Los datos han sido exportados correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo exportar el archivo');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header minimalista */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerButton, { backgroundColor: theme.colors.primary + '15' }]}
        >
          <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>←</Text>
        </TouchableOpacity>
        
        <Text style={[styles.eventTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {event?.name}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.primary + '15' }]}
            onPress={handleShareEvent}
          >
            <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>⤴</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.tabs, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'expenses' ? theme.colors.primary : theme.colors.textSecondary }]}>
            {t('eventDetail.expensesTab')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'participants' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('participants')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'participants' ? theme.colors.primary : theme.colors.textSecondary }]}>
            {t('eventDetail.participantsTab')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'summary' ? theme.colors.primary : theme.colors.textSecondary }]}>
            {t('eventDetail.summaryTab')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar - Solo en tab Gastos */}
      {activeTab === 'expenses' && expenses.length > 0 && (
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder={t('eventDetail.searchExpenses')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setSearchQuery('')}
            >
              <Text style={[styles.clearButtonText, { color: theme.colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {activeTab === 'expenses' && renderExpenses()}
      {activeTab === 'participants' && renderParticipants()}
      {activeTab === 'summary' && renderSummary()}

      {activeTab === 'expenses' && expenses.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddExpense', { eventId })}
            activeOpacity={0.8}
          >
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons Footer */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Statistics', { 
            eventId: eventId, 
            eventName: event?.name || 'Estadísticas',
            currency: event?.currency || 'EUR'
          })}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={styles.actionButtonIcon}>📊</Text>
          </View>
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>{t('eventDetail.stats')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Chat', { 
            eventId: eventId, 
            title: event?.name || 'Chat' 
          })}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={styles.actionButtonIcon}>💬</Text>
          </View>
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>{t('eventDetail.chat')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShareEvent}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={styles.actionButtonIcon}>↗</Text>
          </View>
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>{t('common.share')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleEditEvent}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={styles.actionButtonIcon}>✎</Text>
          </View>
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>{t('common.edit')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleDeleteEvent}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#EF444415' }]}>
            <Text style={styles.actionButtonIcon}>×</Text>
          </View>
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  eventTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportIcon: {
    fontSize: 20,
    color: theme.colors.text,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    alignItems: 'center',
    padding: 4,
    minWidth: 60,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 4,
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '12',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  tabContent: {
    flex: 1,
    padding: 16,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    marginTop: 8,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
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
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginBottom: 16,
  },
  editParticipantsContainer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    zIndex: 10,
  },
  fab: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  fabIcon: {
    color: theme.colors.card,
    fontSize: 36,
    fontWeight: '300',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    borderColor: theme.colors.border,
  },
  clearButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.inputBackground,
  },
  clearButtonText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
});
