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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Event, CurrencySymbols } from '../types';
import { Button, Card } from '../components/lovable';
import { getUserEventsByStatus } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type GroupEventsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GroupEvents'>;
type GroupEventsScreenRouteProp = RouteProp<RootStackParamList, 'GroupEvents'>;

interface Props {
  navigation: GroupEventsScreenNavigationProp;
  route: GroupEventsScreenRouteProp;
}

type EventTab = 'active' | 'past';

const getGroupColor = (colorName?: string): string => {
  const colors: Record<string, string> = {
    blue: '#6366F1',
    green: '#10B981',
    red: '#EF4444',
    yellow: '#F59E0B',
    purple: '#8B5CF6',
    pink: '#EC4899',
    orange: '#F97316',
    teal: '#14B8A6',
  };
  return colors[colorName || 'blue'] || colors.blue;
};

export const GroupEventsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { groupId, groupName: initialGroupName, groupIcon: initialGroupIcon, groupColor: initialGroupColor } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<EventTab>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState(initialGroupName || '');
  const [groupIcon, setGroupIcon] = useState(initialGroupIcon);
  const [groupColor, setGroupColor] = useState(initialGroupColor);
  const [groupType, setGroupType] = useState<'project' | 'recurring'>('project');
  const [defaultEventId, setDefaultEventId] = useState<string | undefined>();

  useFocusEffect(
    useCallback(() => {
      loadGroupData();
      loadEvents();
    }, [user, groupId])
  );

  const loadGroupData = async () => {
    try {
      const { getGroup } = await import('../services/firebase');
      const groupData = await getGroup(groupId);
      if (groupData) {
        setGroupName(groupData.name);
        setGroupIcon(groupData.icon);
        setGroupColor(groupData.color);
        setGroupType(groupData.type || 'project'); // Cargar tipo
        setDefaultEventId(groupData.defaultEventId); // Cargar evento default si existe
      }
    } catch (error) {
      console.error('Error loading group data:', error);
    }
  };

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
      Alert.alert(t('common.error'), t('groupEvents.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleShareGroup = async () => {
    try {
      const deepLink = `lessmo://group/${groupId}`;
      const message = `🎯 ¡Únete al grupo "${groupName}" ${groupIcon || '👥'}!\n\n📊 ${activeEvents.length} ${t('groups.activeEvents')}\n\n🔗 Enlace directo: ${deepLink}\n\n📱 Descarga LessMo para gestionar gastos compartidos en grupo`;

      await Share.share({
        message: message,
        title: `${t('home.groupEvents')} ${groupName}`,
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'No se pudo compartir el grupo');
      }
    }
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

  // Ocultar evento "General" en grupos recurring
  const visibleEvents = groupType === 'recurring' 
    ? filteredEvents.filter(e => e.name !== 'General')
    : filteredEvents;

  const activeEvents = visibleEvents.filter(e => e.status === 'active');
  const pastEvents = visibleEvents.filter(e => e.status === 'completed' || e.status === 'archived');
  const displayEvents = activeTab === 'active' ? activeEvents : pastEvents;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { shadowColor: theme.colors.text }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backIcon, { color: theme.colors.text }]}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={[styles.groupIconContainer, { 
              backgroundColor: getGroupColor(groupColor) + '20',
              borderColor: getGroupColor(groupColor) + '40',
              shadowColor: getGroupColor(groupColor)
            }]}>
              <Text style={styles.groupIcon}>{groupIcon || '👥'}</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.groupName, { color: theme.colors.text }]}>{groupName}</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {activeEvents.length} {activeEvents.length === 1 ? 'evento activo' : 'eventos activos'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: theme.colors.primary + '15',
              borderColor: theme.colors.primary + '30',
              shadowColor: theme.colors.primary 
            }]}
            onPress={() => navigation.navigate('Chat', { 
              groupId: groupId, 
              title: groupName 
            })}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.actionIcon, { color: theme.colors.primary }]}>💬</Text>
            </View>
            <Text style={[styles.actionLabel, { color: theme.colors.primary }]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: theme.colors.primary + '15',
              borderColor: theme.colors.primary + '30',
              shadowColor: theme.colors.primary
            }]}
            onPress={handleShareGroup}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.actionIcon, { color: theme.colors.primary }]}>↗</Text>
            </View>
            <Text style={[styles.actionLabel, { color: theme.colors.primary }]}>Compartir</Text>
          </TouchableOpacity>
          
          {/* Botón principal según tipo de grupo */}
          {groupType === 'recurring' && defaultEventId ? (
            <TouchableOpacity
              style={[styles.createButton, { 
                backgroundColor: '#10B981',
                shadowColor: '#10B981'
              }]}
              onPress={() => navigation.navigate('AddExpense', { 
                eventId: defaultEventId,
                mode: 'create'
              })}
            >
              <Text style={[styles.actionIcon, { color: '#FFFFFF' }]}>+</Text>
              <Text style={[styles.actionLabel, { color: '#FFFFFF' }]}>Añadir Gasto</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.createButton, { 
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary
              }]}
              onPress={() => navigation.navigate('CreateEvent', { mode: 'create', groupId })}
            >
              <Text style={[styles.actionIcon, { color: '#FFFFFF' }]}>+</Text>
              <Text style={[styles.actionLabel, { color: '#FFFFFF' }]}>Crear Evento</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.tab, 
            activeTab === 'active' && [styles.tabActive, { 
              backgroundColor: theme.colors.primary + '15',
              borderColor: theme.colors.primary,
              shadowColor: theme.colors.primary
            }]
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={styles.tabEmoji}>🟢</Text>
          <Text style={[styles.tabText, { color: activeTab === 'active' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Activos ({activeEvents.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, 
            activeTab === 'past' && [styles.tabActive, { 
              backgroundColor: theme.colors.primary + '15',
              borderColor: theme.colors.primary,
              shadowColor: theme.colors.primary
            }]
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={styles.tabEmoji}>⏸️</Text>
          <Text style={[styles.tabText, { color: activeTab === 'past' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Pasados ({pastEvents.length})
          </Text>
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

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyText}>{t('groupEvents.loading')}</Text>
          </View>
        ) : displayEvents.length === 0 && !searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active' ? t('groupEvents.noActiveEvents') : t('groupEvents.noPastEvents')}
            </Text>
            <Button
              title={t('groupEvents.createEvent')}
              onPress={() => navigation.navigate('CreateEvent', { mode: 'create', groupId })}
              style={styles.emptyButton}
            />
          </View>
        ) : displayEvents.length === 0 && searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>{t('groupEvents.noResults')}</Text>
            <Text style={styles.emptySubtext}>{t('groupEvents.tryAnotherTerm')}</Text>
          </View>
        ) : (
          displayEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id, eventName: event.name })}
              activeOpacity={0.7}
              style={[styles.eventCard, { 
                backgroundColor: theme.colors.card,
                shadowColor: event.status === 'active' ? '#10B981' : theme.colors.textSecondary,
                borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
              }]}
            >
              <View style={styles.eventHeader}>
                <View style={[styles.eventIconContainer, {
                  backgroundColor: event.status === 'active' ? '#10B981' + '20' : '#6B7280' + '20',
                  borderColor: event.status === 'active' ? '#10B981' + '40' : '#6B7280' + '40',
                  shadowColor: event.status === 'active' ? '#10B981' : '#6B7280'
                }]}>
                  <Text style={styles.eventIconLarge}>🎉</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventName, { color: theme.colors.text }]}>{event.name}</Text>
                  {event.description && (
                    <Text style={[styles.eventDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {event.description}
                    </Text>
                  )}
                </View>
              </View>

              {/* Budget Section con Progress Bar */}
              <View style={[styles.budgetSection, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                <View style={styles.budgetHeader}>
                  <Text style={[styles.budgetLabel, { color: theme.colors.textSecondary }]}>💰 Presupuesto</Text>
                  <Text style={[styles.budgetValue, { color: theme.colors.text }]}>
                    {CurrencySymbols[event.currency]}{event.initialBudget.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Footer con estadísticas */}
              <View style={styles.eventFooter}>
                <View style={[styles.statusDot, 
                  event.status === 'active' ? styles.statusDotActive : styles.statusDotPast
                ]} />
                <View style={styles.footerItem}>
                  <Text style={styles.footerIcon}>👥</Text>
                  <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                    {event.participantIds.length} {event.participantIds.length === 1 ? 'persona' : 'personas'}
                  </Text>
                </View>
                <View style={styles.footerDivider} />
                <View style={styles.footerItem}>
                  <Text style={styles.footerIcon}>📅</Text>
                  <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
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
                {event.inviteCode && (
                  <>
                    <View style={styles.footerDivider} />
                    <View style={styles.footerItem}>
                      <Text style={styles.footerIcon}>🔑</Text>
                      <Text style={[styles.footerText, { color: theme.colors.primary, fontWeight: '700' }]}>
                        {event.inviteCode}
                      </Text>
                    </View>
                  </>
                )}
              </View>
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
    padding: 20,
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    gap: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  groupIcon: {
    fontSize: 28,
  },
  headerTextContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: theme.colors.background,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  tabEmoji: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    paddingTop: 12,
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
    marginBottom: 14,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    position: 'relative',
  },
  statusBadgeFloating: {
    position: 'absolute',
    top: -8,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    zIndex: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  statusTextFloating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 14,
  },
  eventIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  eventIconLarge: {
    fontSize: 28,
  },
  eventInfo: {
    flex: 1,
    paddingTop: 2,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  budgetSection: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  footerIcon: {
    fontSize: 14,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footerDivider: {
    width: 1,
    height: 16,
    backgroundColor: theme.colors.border,
    marginHorizontal: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
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
});
