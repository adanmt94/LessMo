/**
 * EventsScreen - Pantalla principal de eventos con tabs Activos/Pasados
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList, Event, CurrencySymbols } from '../types';
import { Button, Card, OnboardingModal } from '../components/lovable';
import { getUserEventsByStatus } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

type EventsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: EventsScreenNavigationProp;
  route?: any;
}

type EventTab = 'active' | 'past';

export const EventsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<EventTab>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if first time and show onboarding
  useEffect(() => {
    checkFirstTime();
  }, []);

  // Check for filter from route params
  useEffect(() => {
    if (route?.params?.filterGroupId) {
      setFilterGroupId(route.params.filterGroupId);
    } else {
      // Si no hay params, limpiar el filtro
      setFilterGroupId(null);
    }
  }, [route?.params?.filterGroupId]);

  // Reload events when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [user])
  );

  const checkFirstTime = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('@LessMo:hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleCloseOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@LessMo:hasSeenOnboarding', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const loadEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Cargar eventos activos y pasados por separado
      const activeEvents = await getUserEventsByStatus(user.uid, 'active');
      const completedEvents = await getUserEventsByStatus(user.uid, 'completed');
      const archivedEvents = await getUserEventsByStatus(user.uid, 'archived');
      
      setEvents([...activeEvents, ...completedEvents, ...archivedEvents]);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  // Filtrar eventos - SEPARAR eventos de grupos
  let filteredEvents = events;
  if (filterGroupId) {
    // Mostrar solo eventos de este grupo
    filteredEvents = events.filter(e => e.groupId === filterGroupId);
  } else {
    // Mostrar solo eventos SIN grupo (individuales)
    filteredEvents = events.filter(e => !e.groupId);
  }

  // Aplicar filtro de búsqueda
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredEvents = filteredEvents.filter(e => 
      e.name.toLowerCase().includes(query) ||
      e.description?.toLowerCase().includes(query)
    );
  }

  const activeEvents = filteredEvents.filter(e => e.status === 'active');
  const pastEvents = filteredEvents.filter(e => e.status === 'completed' || e.status === 'archived');
  const displayEvents = activeTab === 'active' ? activeEvents : pastEvents;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <OnboardingModal
        visible={showOnboarding}
        onClose={handleCloseOnboarding}
      />
      
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {filterGroupId ? 'Eventos del Grupo' : 'Mis Eventos'}
        </Text>
        <View style={styles.headerButtons}>
          {filterGroupId && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setFilterGroupId(null)}
            >
              <Text style={[styles.backButtonText, { color: '#FFFFFF' }]}>← Atrás</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowOnboarding(true)}
          >
            <Text style={styles.iconButtonText}>❓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('JoinEvent', { inviteCode: '' })}
          >
            <Text style={styles.iconButtonText}>🎟️</Text>
          </TouchableOpacity>
          <Button
            title="+ Crear"
            onPress={() => navigation.navigate('CreateEvent', { mode: 'create' })}
            size="small"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'active' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Activos ({activeEvents.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'past' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Pasados ({pastEvents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar eventos..."
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

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyText}>Cargando eventos...</Text>
          </View>
        ) : displayEvents.length === 0 ? (
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
        ) : (
          displayEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            >
              <Card style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <View style={[styles.statusBadge, event.status === 'active' ? styles.statusActive : styles.statusPast]}>
                    <Text style={styles.statusText}>
                      {event.status === 'active' ? '🟢 Activo' : '⚪ Finalizado'}
                    </Text>
                  </View>
                </View>
                
                {event.description && (
                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {event.description}
                  </Text>
                )}
                
                <View style={styles.eventDetails}>
                  <View style={styles.eventDetail}>
                    <Text style={styles.detailLabel}>Presupuesto</Text>
                    <Text style={styles.detailValue}>
                      {CurrencySymbols[event.currency]}{event.initialBudget.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.eventDetail}>
                    <Text style={styles.detailLabel}>Participantes</Text>
                    <Text style={styles.detailValue}>
                      👥 {event.participantIds.length}
                    </Text>
                  </View>
                  
                  <View style={styles.eventDetail}>
                    <Text style={styles.detailLabel}>Creado</Text>
                    <Text style={styles.detailValue}>
                      {(() => {
                        try {
                          const date = (event.createdAt as any)?.toDate 
                            ? (event.createdAt as any).toDate() 
                            : new Date(event.createdAt);
                          return date.toLocaleDateString('es-ES', { 
                            day: 'numeric',
                            month: 'short' 
                          });
                        } catch {
                          return 'N/A';
                        }
                      })()}
                    </Text>
                  </View>
                </View>

                {event.inviteCode && (
                  <View style={styles.inviteCodeContainer}>
                    <Text style={styles.inviteCodeLabel}>Código:</Text>
                    <Text style={styles.inviteCode}>{event.inviteCode}</Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: theme.colors.surface,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 24,
  },
  tabContainer: {
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
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90, // Espacio para la barra de tabs
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
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
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: theme.dark ? '#064E3B' : '#DCFCE7',
  },
  statusPast: {
    backgroundColor: theme.dark ? '#374151' : '#F3F4F6',
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
});
