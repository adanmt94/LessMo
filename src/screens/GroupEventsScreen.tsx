/**
 * GroupEventsScreen - Pantalla de eventos de un grupo específico
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Event, CurrencySymbols } from '../types';
import { Button, Card } from '../components/lovable';
import { getUserEventsByStatus } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

type GroupEventsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GroupEvents'>;
type GroupEventsScreenRouteProp = RouteProp<RootStackParamList, 'GroupEvents'>;

interface Props {
  navigation: GroupEventsScreenNavigationProp;
  route: GroupEventsScreenRouteProp;
}

type EventTab = 'active' | 'past';

export const GroupEventsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<EventTab>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [user, groupId])
  );

  const loadEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userEvents = await getUserEventsByStatus(user.uid);
      // Filtrar solo eventos de este grupo
      const groupEvents = userEvents.filter(e => e.groupId === groupId);
      setEvents(groupEvents);
    } catch (error) {
      console.error('Error loading group events:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos del grupo');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  // Aplicar filtro de búsqueda
  let filteredEvents = events;
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.subtitle}>Eventos del grupo</Text>
        </View>
        <Button
          title="+ Crear Evento"
          onPress={() => navigation.navigate('CreateEvent', { mode: 'create', groupId })}
          size="small"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Activos ({activeEvents.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
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

      {/* Content */}
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
        ) : displayEvents.length === 0 && !searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active' ? 'No hay eventos activos' : 'No hay eventos pasados'}
            </Text>
            <Button
              title="Crear evento"
              onPress={() => navigation.navigate('CreateEvent', { mode: 'create', groupId })}
              style={styles.emptyButton}
            />
          </View>
        ) : displayEvents.length === 0 && searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No se encontraron eventos</Text>
            <Text style={styles.emptySubtext}>Intenta con otro término</Text>
          </View>
        ) : (
          displayEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
              activeOpacity={0.7}
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
  headerContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
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
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
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
    fontFamily: 'Courier',
  },
});
