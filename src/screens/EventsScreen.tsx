/**
 * EventsScreen - Pantalla principal de eventos con tabs Activos/Pasados
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList, Event, CurrencySymbols } from '../types';
import { Button, Card } from '../components/lovable';
import { EventCard } from '../components';
import { getUserEventsByStatus, getGroup, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useDebounce } from '../hooks/useDebounce';

type EventsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: EventsScreenNavigationProp;
  route?: any;
}

type EventTab = 'active' | 'past';

export const EventsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<EventTab>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFromTab, setIsFromTab] = useState(true);
  const [groupNames, setGroupNames] = useState<{[key: string]: string}>({});
  const [userName, setUserName] = useState<string>('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  // Cargar nombre del usuario desde Firestore
  useEffect(() => {
    const loadUserName = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.name || userData.displayName || user.displayName || user.email?.split('@')[0] || 'Usuario');
        } else {
          setUserName(user.displayName || user.email?.split('@')[0] || 'Usuario');
        }
      } catch (error) {
        console.error('Error loading user name:', error);
        setUserName(user.displayName || user.email?.split('@')[0] || 'Usuario');
      }
    };
    loadUserName();
  }, [user]);

  // Manejar filtro de evento cuando viene de navegación
  useFocusEffect(
    useCallback(() => {
      const hasGroupFilter = route?.params?.filterGroupId;
      
      console.log('🔍 EventsScreen Focus - Route params:', route?.params);
      console.log('🔍 EventsScreen Focus - Group filter:', hasGroupFilter);
      
      if (hasGroupFilter) {
        console.log('✅ Filtrando eventos del evento:', hasGroupFilter);
        setFilterGroupId(route.params.filterGroupId);
        setIsFromTab(false);
      } else {
        console.log('✅ Mostrando todos los eventos del usuario');
        setFilterGroupId(null);
        setIsFromTab(true);
        
        // Limpiar params de navegación para evitar que persistan
        if (route?.params) {
          navigation.setParams({ filterGroupId: undefined } as any);
        }
      }
    }, [route?.params, navigation])
  );

  // Reload events when screen gains focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      
      const load = async () => {
        if (isMounted) {
          await loadEvents();
        }
      };
      
      load();
      
      return () => {
        isMounted = false;
      };
    }, [user])
  );

  const loadEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Cargar eventos con timeout para evitar bloqueos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al cargar eventos')), 30000)
      );
      
      const loadPromise = (async () => {
        const [activeEvents, completedEvents, archivedEvents] = await Promise.all([
          getUserEventsByStatus(user.uid, 'active'),
          getUserEventsByStatus(user.uid, 'completed'),
          getUserEventsByStatus(user.uid, 'archived')
        ]);
        
        return [...activeEvents, ...completedEvents, ...archivedEvents];
      })();
      
      const allEvents = await Promise.race([loadPromise, timeoutPromise]) as Event[];
      setEvents(allEvents);
      
      // Cargar nombres de eventos para eventos que pertenecen a un evento
      const eventsWithGroup = allEvents.filter(e => e.groupId);
      const groupIds = [...new Set(eventsWithGroup.map(e => e.groupId!))];
      console.log('📁 Total eventos:', allEvents.length);
      console.log('📁 Eventos con groupId:', eventsWithGroup.length);
      console.log('📁 Eventos con groupId details:', eventsWithGroup.map(e => ({ id: e.id, name: e.name, groupId: e.groupId })));
      console.log('📁 GroupIds únicos a cargar:', groupIds);
      const names: {[key: string]: string} = {};
      
      await Promise.all(
        groupIds.map(async (groupId) => {
          try {
            const group = await getGroup(groupId);
            if (group) {
              names[groupId] = group.name;
              console.log('✅ Evento cargado:', groupId, '→', group.name);
            } else {
              console.warn('⚠️ Evento no encontrado:', groupId);
            }
          } catch (error) {
            console.error(`❌ Error loading group ${groupId}:`, error);
          }
        })
      );
      
      console.log('📁 Nombres de eventos cargados:', names);
      setGroupNames(names);
    } catch (error: any) {
      console.error('❌ Error loading events:', error);
      const errorMessage = error?.message || 'No se pudieron cargar los eventos';
      setError(errorMessage);
      
      // Solo mostrar alerta si no es un timeout o error de red común
      if (!error?.message?.includes('Timeout') && !error?.message?.includes('network')) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  // Funciones de selección múltiple
  const toggleSelection = (eventId: string) => {
    const newSelection = new Set(selectedEvents);
    if (newSelection.has(eventId)) {
      newSelection.delete(eventId);
    } else {
      newSelection.add(eventId);
    }
    setSelectedEvents(newSelection);
    
    // Salir del modo selección si no hay eventos seleccionados
    if (newSelection.size === 0) {
      setSelectionMode(false);
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedEvents(new Set());
  };

  const deleteSelectedEvents = async () => {
    if (selectedEvents.size === 0) return;

    Alert.alert(
      'Eliminar eventos',
      `¿Estás seguro de que quieres eliminar ${selectedEvents.size} evento(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteEvent } = await import('../services/firebase');
              const deletePromises = Array.from(selectedEvents).map(id => deleteEvent(id));
              await Promise.all(deletePromises);
              
              exitSelectionMode();
              await loadEvents();
              
              Alert.alert('Éxito', `${selectedEvents.size} evento(s) eliminado(s)`);
            } catch (error: any) {
              Alert.alert('Error', 'No se pudieron eliminar algunos eventos');
            }
          },
        },
      ]
    );
  };

  const deleteEvent = async (eventId: string) => {
    Alert.alert(
      'Eliminar evento',
      '¿Estás seguro de que quieres eliminar este evento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteEvent: deleteEventFn } = await import('../services/firebase');
              await deleteEventFn(eventId);
              await loadEvents();
              Alert.alert('Éxito', 'Evento eliminado');
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo eliminar el evento');
            }
          },
        },
      ]
    );
  };

  // Filtrar eventos
  let filteredEvents = events;
  
  // Si hay un filtro de evento específico, mostrar solo esos eventos
  if (filterGroupId) {
    filteredEvents = events.filter(e => e.groupId === filterGroupId);
  }
  // Si NO hay filtro de evento, mostrar TODOS los eventos (individuales + de eventos)
  // La pestaña "Eventos" debe mostrar todos los eventos del usuario
  
  // Aplicar filtro de búsqueda con debounce
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  if (debouncedSearchQuery.trim()) {
    const query = debouncedSearchQuery.toLowerCase().trim();
    filteredEvents = filteredEvents.filter(e => 
      e.name.toLowerCase().includes(query) ||
      e.description?.toLowerCase().includes(query) ||
      e.inviteCode?.toLowerCase().includes(query)
    );
  }

  const activeEvents = filteredEvents.filter(e => e.status === 'active');
  const pastEvents = filteredEvents.filter(e => e.status === 'completed' || e.status === 'archived');
  const displayEvents = activeTab === 'active' ? activeEvents : pastEvents;



  // Render item memoizado para FlatList
  const renderEventItem = useCallback(({ item: event }: { item: Event }) => {
    const isSelected = selectedEvents.has(event.id);
    
    // Render acción de eliminar para swipe
    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const trans = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [0, 80],
        extrapolate: 'clamp',
      });
      
      return (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => deleteEvent(event.id)}
        >
          <Animated.View style={{ transform: [{ translateX: trans }] }}>
            <Text style={styles.deleteActionText}>🗑️ Eliminar</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    };
    
    return (
      <Swipeable
        key={event.id}
        renderRightActions={renderRightActions}
        enabled={!selectionMode}
      >
        <View style={styles.eventCardWrapper}>
          <TouchableOpacity
            onPress={() => {
              if (selectionMode) {
                toggleSelection(event.id);
              } else {
                navigation.navigate('EventDetail', { eventId: event.id, eventName: event.name });
              }
            }}
            onLongPress={() => {
              if (!selectionMode) {
                setSelectionMode(true);
                setSelectedEvents(new Set([event.id]));
              }
            }}
            activeOpacity={0.7}
            style={[
              styles.eventCard,
              isSelected && styles.eventCardSelected
            ]}
          >
            {selectionMode && (
              <View style={styles.selectionCheckbox}>
                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected
                ]}>
                  {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
              </View>
            )}
        {/* Header con emoji y nombre */}
        <View style={styles.eventCardHeader}>
          <View style={styles.eventIconContainer}>
            <Text style={styles.eventIcon}>🎉</Text>
          </View>
          <View style={styles.eventInfoContainer}>
            <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
            <View style={styles.eventMetaRow}>
              {event.inviteCode && <Text style={styles.eventCode}>#{event.inviteCode}</Text>}
              {/* Badge de evento inline */}
              {event.groupId && (
                <View style={styles.groupBadgeInline}>
                  <Text style={styles.groupBadgeIconInline}>📁</Text>
                  <Text style={styles.groupBadgeTextInline}>
                    {groupNames[event.groupId] || 'Evento'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.statusDot, event.status === 'active' ? styles.statusDotActive : styles.statusDotPast]} />
        </View>
        
        {/* Barra de presupuesto visual tipo Splitwise */}
        <View style={styles.budgetSection}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>💰 Presupuesto</Text>
            <Text style={styles.budgetValue}>
              {CurrencySymbols[event.currency]}{event.initialBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { 
              width: '100%',
              backgroundColor: event.status === 'active' ? theme.colors.primary : '#9CA3AF'
            }]} />
          </View>
        </View>
        
        {/* Footer con info de participantes y fecha */}
        <View style={styles.eventFooter}>
          <View style={styles.participantsPreview}>
            <Text style={styles.participantsCount}>
              👥 {event.participantIds?.length || 0} {(event.participantIds?.length || 0) === 1 ? 'persona' : 'personas'}
            </Text>
          </View>
          <Text style={styles.eventDate}>
            {(() => {
              try {
                const date = (event.createdAt as any)?.toDate 
                  ? (event.createdAt as any).toDate() 
                  : new Date(event.createdAt);
                return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
              } catch {
                return 'Reciente';
              }
            })()}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
      </Swipeable>
    );
  }, [navigation, groupNames, theme.colors.primary, styles, selectionMode, selectedEvents]);

  // Componente empty state memoizado
  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={styles.emptyText}>Cargando eventos...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>
          {activeTab === 'active' ? '📝' : '📋'}
        </Text>
        <Text style={styles.emptyText}>
          {activeTab === 'active' 
            ? 'No tienes eventos activos'
            : 'No tienes eventos pasados'}
        </Text>
        {activeTab === 'active' && (
          <Button
            title="Crear primer evento"
            onPress={() => navigation.navigate('CreateEvent', { mode: 'create' })}
            style={styles.emptyButton}
          />
        )}
      </View>
    );
  }, [loading, activeTab, navigation, styles]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header de modo selección */}
      {selectionMode && (
        <View style={[styles.selectionHeader, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity onPress={exitSelectionMode} style={styles.selectionHeaderButton}>
            <Text style={styles.selectionHeaderButtonText}>✕ Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.selectionHeaderTitle}>
            {selectedEvents.size} seleccionado{selectedEvents.size !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity 
            onPress={deleteSelectedEvents}
            style={styles.selectionHeaderButton}
            disabled={selectedEvents.size === 0}
          >
            <Text style={[
              styles.selectionHeaderButtonText,
              selectedEvents.size === 0 && { opacity: 0.5 }
            ]}>
              🗑️ Eliminar
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
              Hola {userName.split(' ')[0]} 👋
            </Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {filterGroupId ? 'Gastos del Evento' : 'Mis Eventos'}
            </Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          {filterGroupId && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setFilterGroupId(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary + '15' }]}
            onPress={() => navigation.navigate('JoinEvent', { inviteCode: '' })}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonIcon}>🎟️</Text>
            <Text style={[styles.actionButtonLabel, { color: theme.colors.primary }]}>Unirse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('CreateEvent', { mode: 'create' })}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonIcon}>+</Text>
            <Text style={styles.createButtonText}>Crear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs con diseño moderno */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === 'active' && [styles.tabActive, { backgroundColor: theme.colors.primary + '15' }]
          ]}
          onPress={() => setActiveTab('active')}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Text style={styles.tabEmoji}>🟢</Text>
            <Text style={[
              styles.tabText, 
              activeTab === 'active' && [styles.tabTextActive, { color: theme.colors.primary }]
            ]}>
              Activos ({activeEvents.length})
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === 'past' && [styles.tabActive, { backgroundColor: theme.colors.primary + '15' }]
          ]}
          onPress={() => setActiveTab('past')}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Text style={styles.tabEmoji}>⏸️</Text>
            <Text style={[
              styles.tabText,
              activeTab === 'past' && [styles.tabTextActive, { color: theme.colors.primary }]
            ]}>
              Pasados ({pastEvents.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('groupEvents.searchPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={displayEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmptyComponent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    marginBottom: 12,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: -1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  createButtonIcon: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  tabActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabEmoji: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
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
  emptyButton: {
    marginTop: 16,
  },
  eventCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    position: 'relative',
    overflow: 'visible',
  },
  eventCardWrapper: {
    marginBottom: 14,
    marginHorizontal: 16,
    position: 'relative',
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  groupBadgeInline: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupBadgeIconInline: {
    fontSize: 10,
  },
  groupBadgeTextInline: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  eventIcon: {
    fontSize: 32,
  },
  eventInfoContainer: {
    flex: 1,
    marginRight: 12,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  eventCode: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  statusDotPast: {
    backgroundColor: '#9CA3AF',
  },
  budgetSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '40',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.border + '40',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '40',
  },
  participantsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsCount: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  eventDate: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: theme.isDark ? '#10B981' : '#DCFCE7',
  },
  statusPast: {
    backgroundColor: theme.isDark ? '#6B7280' : '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  eventDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  eventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  eventDetail: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  inviteCode: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clearButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  // Estilos para modo selección
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
  },
  selectionHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectionHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectionHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  eventCardSelected: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  selectionCheckbox: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Estilos para swipe
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    marginVertical: 4,
    borderRadius: 12,
    width: 100,
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
