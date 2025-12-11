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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Event, CurrencySymbols } from '../types';
import { Button, Card, ExpenseItem, ParticipantItem } from '../components/lovable';
import { getEvent } from '../services/firebase';
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
  const [userPhotos, setUserPhotos] = useState<{[userId: string]: string}>({});
  const [editParticipantsModalVisible, setEditParticipantsModalVisible] = useState(false);
  
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
      const init = async () => {
        await loadEvent();
        await loadData();
      };
      init();
    }, [eventId])
  );

  // Migrar participantes y cargar fotos cuando cambien los participantes
  useEffect(() => {
    if (participants.length === 0) return;

    
    
    // Primero ejecutar migración
    const migrateAndLoadPhotos = async () => {
      // Migrar participantes sin userId pero con email que coincide con usuarios
      try {
        const { collection, query, where, getDocs, updateDoc } = await import('firebase/firestore');
        
        let needsReload = false;
        
        
        participants.forEach((p, i) => {
          
        });
        
        for (const participant of participants) {
          // Solo procesar participantes sin userId
          if (!participant.userId) {
            try {
              let usersSnapshot = null;
              
              // Estrategia 1: Buscar por email si existe
              if (participant.email) {
                
                const usersQuery = query(
                  collection(db, 'users'),
                  where('email', '==', participant.email.toLowerCase())
                );
                usersSnapshot = await getDocs(usersQuery);
              }
              
              // Estrategia 2: Si no hay email o no se encontró, buscar por nombre
              if (!usersSnapshot || usersSnapshot.empty) {
                
                
                // Obtener todos los usuarios y buscar coincidencia por nombre
                const allUsersSnapshot = await getDocs(collection(db, 'users'));
                const normalizeString = (str: string) => 
                  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                
                const participantNameNormalized = normalizeString(participant.name);
                
                // Buscar coincidencia exacta o parcial
                const matchingUsers = allUsersSnapshot.docs.filter(userDoc => {
                  const userData = userDoc.data();
                  const userName = userData.name || userData.email?.split('@')[0] || '';
                  const userNameNormalized = normalizeString(userName);
                  
                  // Coincidencia: nombre contiene el nombre del participante o viceversa
                  return userNameNormalized.includes(participantNameNormalized) || 
                         participantNameNormalized.includes(userNameNormalized);
                });
                
                if (matchingUsers.length > 0) {
                  
                  usersSnapshot = { 
                    empty: false, 
                    docs: matchingUsers 
                  } as any;
                }
              }
              
              if (usersSnapshot && !usersSnapshot.empty) {
                const userData = usersSnapshot.docs[0].data();
                const userId = usersSnapshot.docs[0].id;
                
                
                
                // Actualizar participante con userId y photoURL
                const updateData: any = { 
                  userId,
                  email: userData.email // También guardar el email
                };
                if (userData.photoURL) {
                  updateData.photoURL = userData.photoURL;
                }
                
                await updateDoc(
                  doc(db, 'participants', participant.id),
                  updateData
                );
                
                
                needsReload = true;
              } else {
                
              }
            } catch (error) {
              
            }
          }
        }
        
        // Si se actualizó algún participante, recargar datos
        if (needsReload) {
          
          await loadData();
        }
      } catch (error) {
        
      }
    };

    migrateAndLoadPhotos();

    const unsubscribers: (() => void)[] = [];
    
    // Crear un listener para cada usuario
    participants.forEach(participant => {
      if (participant.userId) {
        const userDocRef = doc(db, 'users', participant.userId);
        
        const unsubscribe = onSnapshot(
          userDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const userData = docSnapshot.data();
              if (userData.photoURL) {
                setUserPhotos(prev => ({
                  ...prev,
                  [participant.userId!]: userData.photoURL
                }));
              }
            }
          },
          (error) => {
            
          }
        );
        
        unsubscribers.push(unsubscribe);
      }
    });

    // Cleanup: cancelar todos los listeners cuando el componente se desmonte
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [participants]);

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
    await loadEvent();
    await loadData();
    // loadUserPhotos se ejecutará automáticamente cuando participants cambie
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
    if (!event || !user) return;
    
    try {
      const userName = user.displayName || user.email?.split('@')[0] || 'Usuario';
      
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
        
        const message = `🎉 ¡Únete a "${event.name}"!\n\n💰 Presupuesto: ${event.initialBudget} ${CurrencySymbols[event.currency]}\n\n👤 Creado por: ${userName}\n\n🔗 ${deepLink}\n\nDescarga LessMo para gestionar gastos compartidos`;

        await Share.share({
          message: message,
          title: `Invitación a ${event.name}`,
        });
      }
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing event:', error);
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
        (e.description || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        getParticipantById(e.paidBy)?.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : expenses;

  const renderExpenses = () => (
    <View style={[styles.tabContent, { position: 'relative' }]}>
      {expenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyText}>{t('eventDetail.noExpenses')}</Text>
          <Text style={styles.emptySubtext}>Añade tu primer gasto para comenzar</Text>
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
                participantName={participant?.name || 'Desconocido'}
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
      
      {/* Botón flotante SIEMPRE visible */}
      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={() => navigation.navigate('AddExpense', { eventId })}
      >
        <Text style={styles.floatingAddButtonText}>+ Añadir Gasto</Text>
      </TouchableOpacity>
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
                `📊 Eficiencia del evento: ${efficiency.level} (${efficiency.score}/100)\n\n` +
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
      <View style={[styles.actionButtonsContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Statistics', { 
            eventId: eventId, 
            eventName: event?.name || 'Estadísticas',
            currency: event?.currency || 'EUR'
          })}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.actionButtonIcon, { color: theme.colors.primary }]}>📊</Text>
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
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.actionButtonIcon, { color: theme.colors.primary }]}>💬</Text>
          </View>
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>{t('eventDetail.chat')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShareEvent}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.actionButtonIcon, { color: theme.colors.primary }]}>↗</Text>
          </View>
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>{t('common.share')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleEditEvent}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.actionButtonIcon, { color: theme.colors.primary }]}>✏️</Text>
          </View>
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>{t('common.edit')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleDeleteEvent}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#EF444420' }]}>
            <Text style={[styles.actionButtonIcon, { color: '#EF4444' }]}>×</Text>
          </View>
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>

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
                ✏️ Editar Participantes
              </Text>
              <TouchableOpacity
                onPress={() => setEditParticipantsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseText, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
                Para agregar o quitar participantes del evento, ve a la pantalla de edición completa.
              </Text>
              
              <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                Participantes Actuales ({participants.length})
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
                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => setEditParticipantsModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setEditParticipantsModalVisible(false);
                  handleEditEvent();
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.card }]}>
                  Ir a Editar
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
