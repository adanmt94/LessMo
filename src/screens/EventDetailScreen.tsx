/**
 * EventDetailScreen - Pantalla de detalle del evento con tabs
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Event, CurrencySymbols } from '../types';
import { Button, Card, ExpenseItem, ParticipantItem } from '../components/lovable';
import { getEvent, addParticipant } from '../services/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
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
import { shareEvent, generateEventDeepLink } from '../services/deepLinkService';
import { useAuth } from '../hooks/useAuth';

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
  const { user } = useAuth();
  const styles = getStyles(theme);
  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('expenses');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [userPhotos, setUserPhotos] = useState<{[userId: string]: string}>({});
  const [editParticipantsModalVisible, setEditParticipantsModalVisible] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [addingParticipant, setAddingParticipant] = useState(false);
  const hasMigratedRef = useRef(false);
  
  const {
    expenses,
    participants,
    loading,
    loadData,
    deleteExpense,
    getTotalExpenses,
    getTotalIncome,
    getRemainingBalance,
    getParticipantById,
    getParticipantBalances,
  } = useExpenses(eventId);

  // No header buttons - they will be in the screen content

  // Reload event data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        await loadEvent();
        await loadData();
      };
      init();
    }, [eventId])
  );

  // Stable serialized key for participant user IDs (for snapshot listeners)
  const participantUserIds = useMemo(() => 
    participants.filter(p => p.userId).map(p => p.userId!).sort().join(','),
    [participants]
  );

  // Migration effect — runs once when participants first load
  useEffect(() => {
    if (participants.length === 0 || hasMigratedRef.current) return;
    hasMigratedRef.current = true;

    const migrateParticipants = async () => {
      try {
        const { collection, query, where, getDocs, updateDoc } = await import('firebase/firestore');
        
        let needsReload = false;
        
        for (const participant of participants) {
          if (!participant.userId) {
            try {
              let usersSnapshot = null;
              
              if (participant.email) {
                const usersQuery = query(
                  collection(db, 'users'),
                  where('email', '==', participant.email.toLowerCase())
                );
                usersSnapshot = await getDocs(usersQuery);
              }
              
              if (!usersSnapshot || usersSnapshot.empty) {
                const allUsersSnapshot = await getDocs(collection(db, 'users'));
                const normalizeString = (str: string) => 
                  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                
                const participantNameNormalized = normalizeString(participant.name);
                
                const matchingUsers = allUsersSnapshot.docs.filter(userDoc => {
                  const userData = userDoc.data();
                  const userName = userData.name || userData.email?.split('@')[0] || '';
                  const userNameNormalized = normalizeString(userName);
                  return userNameNormalized.includes(participantNameNormalized) || 
                         participantNameNormalized.includes(userNameNormalized);
                });
                
                if (matchingUsers.length > 0) {
                  usersSnapshot = { empty: false, docs: matchingUsers } as any;
                }
              }
              
              if (usersSnapshot && !usersSnapshot.empty) {
                const userData = usersSnapshot.docs[0].data();
                const userId = usersSnapshot.docs[0].id;
                
                const updateData: any = { userId, email: userData.email };
                if (userData.photoURL) {
                  updateData.photoURL = userData.photoURL;
                }
                
                await updateDoc(doc(db, 'participants', participant.id), updateData);
                needsReload = true;
              }
            } catch (error) {
              // Skip individual participant migration errors
            }
          }
        }
        
        if (needsReload) {
          await loadData();
        }
      } catch (error) {
        // Migration failed silently
      }
    };

    migrateParticipants();
  }, [participants.length]);

  // Snapshot listeners for participant photo updates — keyed on stable user IDs
  useEffect(() => {
    if (!participantUserIds) return;

    const unsubscribers: (() => void)[] = [];
    
    participantUserIds.split(',').forEach(userId => {
      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(
          userDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const userData = docSnapshot.data();
              if (userData.photoURL) {
                setUserPhotos(prev => ({
                  ...prev,
                  [userId]: userData.photoURL
                }));
              }
            }
          },
          () => {} // Ignore snapshot errors
        );
        unsubscribers.push(unsubscribe);
      }
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [participantUserIds]);

  const loadEvent = async () => {
    try {
      const eventData = await getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      Alert.alert(t('common.error'), t('eventDetail.loadError'));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvent();
    await loadData();
    // loadUserPhotos se ejecutará automáticamente cuando participants cambie
    setRefreshing(false);
  };

  const handleEditEvent = () => {
    const groupId = event?.groupId;
    if (groupId) {
      navigation.navigate('CreateGroup', { 
        groupId, 
        mode: 'edit' 
      });
    }
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
    if (!event || !user) return;
    
    try {
      const userName = user.displayName || user.email?.split('@')[0] || t('eventDetail.user');
      
      const success = await shareEvent({
        eventId: event.id,
        eventName: event.name,
        creatorName: userName,
      });
      
      if (!success) {
        // Fallback: usar Share API nativa
        const deepLink = generateEventDeepLink({
          eventId: event.id,
          eventName: event.name,
          creatorName: userName,
        });
        
        const message = t('eventDetail.shareMessage', {
          name: event.name,
          budget: event.initialBudget,
          currency: CurrencySymbols[event.currency],
          creator: userName,
          link: deepLink,
        });

        await Share.share({
          message: message,
          title: t('eventDetail.shareTitle', { name: event.name }),
        });
      }
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing event:', error);
        Alert.alert(t('common.error'), t('eventDetail.shareError'));
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
              const success = await deleteExpense(expenseId);
              if (!success) {
                Alert.alert(t('common.error'), t('eventDetail.deleteExpenseError'));
              }
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
          <Text>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  const currencySymbol = CurrencySymbols[event.currency];
  const totalExpenses = getTotalExpenses();
  const totalIncome = getTotalIncome();
  const remainingBalance = getRemainingBalance(event.initialBudget);

  // Filtrar gastos por búsqueda y tipo
  const filteredExpenses = expenses.filter(e => {
    // Filter by type
    if (typeFilter === 'expense' && e.type === 'income') return false;
    if (typeFilter === 'income' && e.type !== 'income') return false;
    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesDescription = (e.description || '').toLowerCase().includes(q);
      const matchesParticipant = getParticipantById(e.paidBy)?.name.toLowerCase().includes(q);
      return matchesDescription || matchesParticipant;
    }
    return true;
  });

  const renderExpenses = () => (
    <View style={[styles.tabContent, { position: 'relative' }]}>
      {expenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyText}>{t('eventDetail.noExpenses')}</Text>
          <Text style={styles.emptySubtext}>{t('eventDetail.addFirstExpense')}</Text>
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
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {filteredExpenses.map((expense) => {
            const participant = getParticipantById(expense.paidBy);
            // Usar foto actualizada del usuario si existe
            const photoURL = participant?.userId 
              ? (userPhotos[participant.userId] || participant?.photoURL)
              : participant?.photoURL;
            
            return (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                participantName={participant?.name || t('eventDetail.unknown')}
                participantPhoto={photoURL}
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

  const renderParticipants = () => {
    // Calcular balances de participantes basado en gastos
    const participantBalances = getParticipantBalances();

    return (
      <View style={styles.tabContent}>
        <View style={styles.editParticipantsContainer}>
          <Button
            title={t('eventDetail.editParticipants')}
            onPress={() => setEditParticipantsModalVisible(true)}
            variant="outline"
            fullWidth
          />
        </View>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {participants.map((participant) => {
            const balance = participantBalances.find(b => b.participantId === participant.id);
            // Agregar foto del usuario si existe
            const participantWithPhoto = {
              ...participant,
              photoURL: participant.userId ? (userPhotos[participant.userId] || participant.photoURL) : participant.photoURL
            };
            return (
              <ParticipantItem
                key={participant.id}
                participant={participantWithPhoto}
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
        contentContainerStyle={{ paddingBottom: 180, flexGrow: 1 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        nestedScrollEnabled={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('eventDetail.summaryTitle')}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('eventDetail.initialBudget')}</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(event.initialBudget, event.currency as any)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('eventDetail.totalSpent')}</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {formatCurrency(totalExpenses, event.currency as any)}
            </Text>
          </View>

          {totalIncome > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('expense.totalIncome')}</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                +{formatCurrency(totalIncome, event.currency as any)}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>{t('eventDetail.remainingBalance')}</Text>
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
            {t('eventDetail.budgetUsed', { percentage: percentageSpent.toFixed(1) })}
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
                t('eventDetail.fullAnalysis', { badge: efficiency.badge }),
                `${t('eventDetail.eventEfficiency')} ${efficiency.level} (${efficiency.score}/100)\n\n` +
                `${comparison.message}\n\n` +
                `${t('eventDetail.tips')}\n${efficiency.tips.map(tip => `• ${tip}`).join('\n')}`,
                [{ text: t('eventDetail.understood') }]
              );
            }}
          />
        )}

        <Button
          title={t('eventDetail.viewChartsSettlements')}
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
      Alert.alert(t('common.success'), t('eventDetail.exportSuccess'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('eventDetail.exportError'));
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header con acciones */}
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
            onPress={() => navigation.navigate('Statistics', { 
              eventId: eventId, 
              eventName: event?.name || '',
              currency: event?.currency || 'EUR'
            })}
          >
            <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.primary + '15' }]}
            onPress={handleShareEvent}
          >
            <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>⤴</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.primary + '15' }]}
            onPress={() => {
              Alert.alert(
                event?.name || '',
                '',
                [
                  {
                    text: `💬 ${t('eventDetail.chat')}`,
                    onPress: () => navigation.navigate('Chat', { eventId, title: event?.name || 'Chat' }),
                  },
                  {
                    text: `✏️ ${t('common.edit')}`,
                    onPress: handleEditEvent,
                  },
                  {
                    text: `🗑️ ${t('common.delete')}`,
                    style: 'destructive',
                    onPress: handleDeleteEvent,
                  },
                  { text: t('common.cancel'), style: 'cancel' },
                ]
              );
            }}
          >
            <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>⋯</Text>
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
          {/* Type filter pills */}
          <View style={styles.filterRow}>
            {(['all', 'expense', 'income'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                  typeFilter === filter && (filter === 'income'
                    ? { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                    : filter === 'expense'
                    ? { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                    : { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }),
                ]}
                onPress={() => setTypeFilter(filter)}
              >
                <Text style={[
                  styles.filterPillText,
                  { color: theme.colors.textSecondary },
                  typeFilter === filter && (filter === 'income'
                    ? { color: '#10B981', fontWeight: '700' }
                    : filter === 'expense'
                    ? { color: '#EF4444', fontWeight: '700' }
                    : { color: theme.colors.primary, fontWeight: '700' }),
                ]}>
                  {filter === 'all' ? t('common.all') : filter === 'expense' ? t('addExpense.expense') : t('addExpense.income')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {activeTab === 'expenses' && renderExpenses()}
      {activeTab === 'participants' && renderParticipants()}
      {activeTab === 'summary' && renderSummary()}

      {activeTab === 'expenses' && (
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

      {/* Modal para Editar Participantes */}
      <Modal
        visible={editParticipantsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditParticipantsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('eventDetail.editParticipants')}
              </Text>
              <TouchableOpacity
                onPress={() => setEditParticipantsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseText, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Add participant form */}
              <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                {t('eventDetail.addParticipant')}
              </Text>
              <View style={styles.addParticipantForm}>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder={t('auth.namePlaceholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newParticipantName}
                  onChangeText={setNewParticipantName}
                />
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newParticipantEmail}
                  onChangeText={setNewParticipantEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.addParticipantButton, { backgroundColor: theme.colors.primary }]}
                  onPress={async () => {
                    if (!newParticipantName.trim()) {
                      Alert.alert(t('common.error'), t('createGroup.memberNameRequired'));
                      return;
                    }
                    setAddingParticipant(true);
                    try {
                      await addParticipant(
                        eventId,
                        newParticipantName.trim(),
                        0,
                        newParticipantEmail.trim() || undefined
                      );
                      setNewParticipantName('');
                      setNewParticipantEmail('');
                      await loadData();
                    } catch (error: any) {
                      Alert.alert(t('common.error'), error.message);
                    } finally {
                      setAddingParticipant(false);
                    }
                  }}
                  disabled={addingParticipant}
                >
                  <Text style={styles.addParticipantButtonText}>
                    {addingParticipant ? t('common.loading') : t('eventDetail.addParticipant')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.modalSectionTitle, { color: theme.colors.text, marginTop: 16 }]}>
                {t('eventDetail.participantsTab')} ({participants.length})
              </Text>
              
              {participants.map((participant) => (
                <View key={participant.id} style={[styles.modalParticipantItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={[styles.modalParticipantAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Text style={[styles.modalParticipantAvatarText, { color: theme.colors.primary }]}>
                      {participant.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalParticipantInfo}>
                    <Text style={[styles.modalParticipantName, { color: theme.colors.text }]}>
                      {participant.name}
                    </Text>
                    {participant.email && (
                      <Text style={[styles.modalParticipantEmail, { color: theme.colors.textSecondary }]}>
                        {participant.email}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={() => setEditParticipantsModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.card }]}>
                  {t('common.ok')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    bottom: 24,
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
    flexWrap: 'wrap',
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    width: '100%',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalParticipantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  modalParticipantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalParticipantAvatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalParticipantInfo: {
    flex: 1,
  },
  modalParticipantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  modalParticipantEmail: {
    fontSize: 13,
  },
  addParticipantForm: {
    gap: 10,
    marginBottom: 8,
  },
  modalInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  addParticipantButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addParticipantButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    borderWidth: 2,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingAddButtonText: {
    color: theme.colors.card,
    fontSize: 18,
    fontWeight: '700',
  },
  modalButtonPrimary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
