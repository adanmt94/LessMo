/**
 * EventDetailScreen - Pantalla de detalle del evento con tabs
 */

import React, { useState, useEffect, useCallback } from 'react';
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
      'Eliminar evento',
      '¿Estás seguro? Se eliminarán todos los gastos y participantes.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteEvent } = await import('../services/firebase');
              await deleteEvent(eventId);
              Alert.alert('Éxito', 'Evento eliminado correctamente', [
                {
                  text: 'Aceptar',
                  onPress: () => navigation.navigate('MainTabs', { screen: 'Events' } as any),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el evento');
            }
          },
        },
      ]
    );
  };

  const handleDeleteExpense = async (expenseId: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implementar función deleteExpense que revierta los balances
              Alert.alert('Aviso', 'La eliminación de gastos aún no está implementada completamente. Se agregará pronto.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el gasto');
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
          <Text style={styles.emptyText}>No hay gastos registrados</Text>
          <Button
            title="Agregar gasto"
            onPress={() => navigation.navigate('AddExpense', { eventId })}
            style={styles.emptyButton}
          />
        </View>
      ) : filteredExpenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No se encontraron gastos</Text>
          <Text style={styles.emptySubtext}>Intenta con otro término</Text>
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
            title="✏️ Editar participantes"
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
          <Text style={styles.summaryTitle}>Resumen general</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Presupuesto inicial</Text>
            <Text style={styles.summaryValue}>
              {currencySymbol}{event.initialBudget.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total gastado</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {currencySymbol}{totalExpenses.toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Saldo restante</Text>
            <Text style={[styles.summaryValueBold, { color: remainingBalance >= 0 ? '#10B981' : '#EF4444' }]}>
              {currencySymbol}{remainingBalance.toFixed(2)}
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

  const handleShareEvent = async () => {
    if (!event) return;

    try {
      const inviteCode = event.inviteCode || event.id;
      const shareUrl = `lessmo://join/${inviteCode}`;
      const message = `¡Únete a "${event.name}" en LessMo!\n\n` +
        `Usa este código: ${inviteCode}\n` +
        `O abre este enlace: ${shareUrl}\n\n` +
        `Gestiona gastos compartidos de forma fácil con LessMo.`;

      await Share.share({
        message,
        title: `Únete a ${event.name}`,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.tabs, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'expenses' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Gastos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'participants' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('participants')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'participants' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Participantes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'summary' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Resumen
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar - Solo en tab Gastos */}
      {activeTab === 'expenses' && expenses.length > 0 && (
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Buscar gastos..."
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
    </View>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  tabContent: {
    flex: 1,
    padding: 16,
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
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 32,
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
