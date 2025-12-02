/**
 * GroupsScreen - Pantalla de grupos
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Group } from '../types';
import { Button, Card } from '../components/lovable';
import { GroupCard } from '../components';
import { getUserGroups, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useDebounce } from '../hooks/useDebounce';

type GroupsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: GroupsScreenNavigationProp;
}

export const GroupsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState<string>('');

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

  // Reload groups when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [user])
  );

  const loadGroups = async () => {
    if (!user) return;
    
    let isCancelled = false;
    
    try {
      setLoading(true);
      
      // Timeout de 30 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al cargar grupos')), 30000)
      );
      
      const loadPromise = (async () => {
        const userGroups = await getUserGroups(user.uid);
        if (isCancelled) return [];
        
        // Para cada grupo, calcular el número real de participantes únicos
        const { getEventParticipants } = await import('../services/firebase');
        const groupsWithStats = await Promise.all(userGroups.map(async (group) => {
          if (isCancelled) return group;
          
          const eventIds = group.eventIds || [];
          const memberIds = group.memberIds || [];
          
          // Obtener todos los participantes únicos de los eventos del grupo
          const allParticipantIds = new Set<string>();
          
          // Limitar consultas concurrentes para evitar sobrecarga
          const batchSize = 5;
          for (let i = 0; i < eventIds.length; i += batchSize) {
            if (isCancelled) break;
            
            const batch = eventIds.slice(i, i + batchSize);
            await Promise.allSettled(
              batch.map(async (eventId: string) => {
                try {
                  const participants = await getEventParticipants(eventId);
                  participants.forEach(p => {
                    if (p.userId) {
                      allParticipantIds.add(p.userId);
                    }
                  });
                } catch (error) {
                  console.error('⚠️ Error loading participants for event:', eventId, error);
                }
              })
            );
          }
          
          // El conteo real incluye miembros del grupo + participantes de eventos
          const uniqueParticipants = new Set([...memberIds, ...Array.from(allParticipantIds)]);
          
          return {
            ...group,
            eventIds,
            memberIds,
            totalParticipants: uniqueParticipants.size,
          };
        }));
        
        return groupsWithStats;
      })();
      
      const groupsWithStats = await Promise.race([loadPromise, timeoutPromise]) as any[];
      
      if (!isCancelled) {
        setGroups(groupsWithStats);
      }
    } catch (error: any) {
      if (isCancelled) return;
      
      console.error('❌ Error loading groups:', error);
      
      // Si es error de permisos o timeout, no mostrar alert
      if (!error.message?.includes('permission') && 
          !error.message?.includes('Missing') &&
          !error.message?.includes('Timeout')) {
        Alert.alert('Error', 'No se pudieron cargar los grupos');
      }
      setGroups([]);
    } finally {
      if (!isCancelled) {
        setLoading(false);
      }
    }
    
    return () => {
      isCancelled = true;
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleViewGroupEvents = (groupId: string, groupName: string, groupIcon?: string, groupColor?: string) => {
    // Navegar a pantalla dedicada de eventos del grupo
    navigation.navigate('GroupEvents', { groupId, groupName, groupIcon, groupColor });
  };

  const handleEditGroup = (groupId: string) => {
    navigation.navigate('CreateGroup', { 
      groupId, 
      mode: 'edit' 
    });
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      'Eliminar grupo',
      `¿Estás seguro de eliminar "${groupName}"? Los eventos asociados no se eliminarán.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteGroup } = await import('../services/firebase');
              await deleteGroup(groupId);
              Alert.alert('Éxito', 'Grupo eliminado correctamente');
              loadGroups();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el grupo');
            }
          },
        },
      ]
    );
  };

  const getGroupColor = (color?: string) => color || '#6366F1';

  // Filtro de búsqueda con debounce
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const filteredGroups = debouncedSearchQuery.trim()
    ? groups.filter(g => 
        g.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase().trim()) ||
        g.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase().trim())
      )
    : groups;

  // Render item memoizado para FlatList
  const renderGroupItem = useCallback(({ item: group }: { item: Group }) => (
    <TouchableOpacity 
      key={group.id}
      onPress={() => handleViewGroupEvents(group.id, group.name, group.icon, group.color)}
      activeOpacity={0.7}
      style={[styles.groupCard, { 
        backgroundColor: theme.colors.card,
        shadowColor: getGroupColor(group.color),
        borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
      }]}
    >
      <View style={styles.groupHeader}>
        <View style={[styles.groupIconContainer, { 
          backgroundColor: getGroupColor(group.color) + '20',
          borderColor: getGroupColor(group.color) + '40'
        }]}>
          <Text style={styles.groupEmoji}>{group.icon || '📁'}</Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: theme.colors.text }]}>{group.name}</Text>
          {group.description && (
            <Text style={[styles.groupDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {group.description}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.groupStatsContainer}>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: '#3B82F6' + '20' }]}>
            <Text style={styles.statIcon}>🎉</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{group.eventIds.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {group.eventIds.length === 1 ? 'Evento' : 'Eventos'}
            </Text>
          </View>
        </View>
        
        <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
        
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: '#10B981' + '20' }]}>
            <Text style={styles.statIcon}>👥</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {group.totalParticipants || group.memberIds.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {(group.totalParticipants || group.memberIds.length) === 1 ? 'Participante' : 'Participantes'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.groupFooter}>
        <View style={styles.groupActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { 
              backgroundColor: theme.colors.primary + '15',
              borderColor: theme.colors.primary + '30'
            }]}
            onPress={(e) => {
              e.stopPropagation();
              handleViewGroupEvents(group.id, group.name, group.icon, group.color);
            }}
          >
            <Text style={styles.actionIcon}>👀</Text>
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Ver Eventos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { 
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary
            }]}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('CreateEvent', { 
                mode: 'create', 
                groupId: group.id 
              });
            }}
          >
            <Text style={[styles.actionIcon, { color: '#FFFFFF' }]}>+</Text>
            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Añadir Evento</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.groupSecondaryActions}>
          <TouchableOpacity 
            style={[styles.secondaryButton, { 
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.background
            }]}
            onPress={(e) => {
              e.stopPropagation();
              handleEditGroup(group.id);
            }}
          >
            <Text style={styles.secondaryIcon}>✏️</Text>
            <Text style={[styles.secondaryText, { color: theme.colors.text }]}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryButton, { 
              borderColor: '#EF4444' + '30',
              backgroundColor: '#EF4444' + '10'
            }]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteGroup(group.id, group.name);
            }}
          >
            <Text style={styles.secondaryIcon}>🗑️</Text>
            <Text style={[styles.secondaryText, { color: '#EF4444' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation, theme, styles, handleViewGroupEvents, handleEditGroup, handleDeleteGroup, getGroupColor]);

  // Componente empty state memoizado
  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('groups.loading')}</Text>
        </View>
      );
    }
    
    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('groups.noGroups')}</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
            Los grupos te permiten organizar múltiples eventos relacionados
          </Text>
          <Button
            title="Crear primer grupo"
            onPress={() => navigation.navigate('CreateGroup', { mode: 'create' })}
            style={styles.emptyButton}
          />
        </View>
      );
    }
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('groups.notFound')}</Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
          Intenta con otro término de búsqueda
        </Text>
      </View>
    );
  }, [loading, searchQuery, navigation, theme, styles, t]);

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, shadowColor: theme.colors.text }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
            Hola {userName.split(' ')[0]} 👋
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>Mis Grupos</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.joinButton, { 
              backgroundColor: theme.colors.primary + '15',
              borderColor: theme.colors.primary,
              shadowColor: theme.colors.primary 
            }]}
            onPress={() => navigation.navigate('JoinGroup', {})}
          >
            <Text style={[styles.buttonIcon, { color: theme.colors.primary }]}>🔗</Text>
            <Text style={[styles.buttonLabel, { color: theme.colors.primary }]}>Unirse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, { 
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary 
            }]}
            onPress={() => navigation.navigate('CreateGroup', { mode: 'create' })}
          >
            <Text style={[styles.buttonIcon, { color: '#FFFFFF' }]}>+</Text>
            <Text style={[styles.buttonLabel, { color: '#FFFFFF' }]}>Crear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Buscar grupos..."
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

      <FlatList
        data={filteredGroups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmptyComponent}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
      />
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
  },
  headerTop: {
    marginBottom: 12,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: -1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 8,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 16,
  },
  groupCard: {
    marginBottom: 14,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 14,
  },
  groupIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  groupEmoji: {
    fontSize: 32,
  },
  groupInfo: {
    flex: 1,
    paddingTop: 4,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  groupDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  groupStatsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 18,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 18,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: 12,
  },
  groupFooter: {
    gap: 10,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  groupSecondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1.5,
  },
  secondaryIcon: {
    fontSize: 14,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  clearButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 18,
  },
});
