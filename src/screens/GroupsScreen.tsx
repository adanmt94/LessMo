/**
 * GroupsScreen - Pantalla de grupos
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Group } from '../types';
import { Button, Card } from '../components/lovable';
import { getUserGroups } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

type GroupsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: GroupsScreenNavigationProp;
}

export const GroupsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Reload groups when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [user])
  );

  const loadGroups = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userGroups = await getUserGroups(user.uid);
      setGroups(userGroups);
    } catch (error: any) {
      console.error('Error loading groups:', error);
      // Si es error de permisos, no mostrar alert (simplemente dejar lista vacía)
      if (!error.message?.includes('permission') && !error.message?.includes('Missing')) {
        Alert.alert('Error', 'No se pudieron cargar los grupos');
      }
      setGroups([]); // Establecer array vacío si hay error
    } finally {
      setLoading(false);
    }
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

  // Filtro de búsqueda
  const filteredGroups = searchQuery.trim()
    ? groups.filter(g => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : groups;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Mis Grupos</Text>
        <Button
          title="+ Crear Grupo"
          onPress={() => navigation.navigate('CreateGroup', { mode: 'create' })}
          size="small"
        />
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

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Cargando grupos...</Text>
          </View>
        ) : filteredGroups.length === 0 && !searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No tienes grupos creados</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Los grupos te permiten organizar múltiples eventos relacionados
            </Text>
            <Button
              title="Crear primer grupo"
              onPress={() => navigation.navigate('CreateGroup', { mode: 'create' })}
              style={styles.emptyButton}
            />
          </View>
        ) : filteredGroups.length === 0 && searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No se encontraron grupos</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Intenta con otro término de búsqueda
            </Text>
          </View>
        ) : (
          filteredGroups.map((group) => (
            <Card key={group.id} style={styles.groupCard}>
              <TouchableOpacity 
                onPress={() => handleViewGroupEvents(group.id, group.name, group.icon, group.color)}
                activeOpacity={0.7}
              >
                <View style={styles.groupHeader}>
                  <View style={[styles.groupIcon, { backgroundColor: getGroupColor(group.color) }]}>
                    <Text style={styles.groupEmoji}>{group.icon || '📁'}</Text>
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.groupDescription} numberOfLines={1}>
                        {group.description}
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.groupStats}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{group.eventIds.length}</Text>
                    <Text style={styles.statLabel}>Eventos</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{group.memberIds.length}</Text>
                    <Text style={styles.statLabel}>Miembros</Text>
                  </View>
                </View>
              </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <Button
                    title="Ver Eventos"
                    variant="outline"
                    size="small"
                    style={{ flex: 1 }}
                    onPress={() => handleViewGroupEvents(group.id, group.name, group.icon, group.color)}
                  />
                  <Button
                    title="+ Evento"
                    variant="primary"
                    size="small"
                    style={{ flex: 1 }}
                    onPress={() => {
                      navigation.navigate('CreateEvent', { 
                        mode: 'create', 
                        groupId: group.id 
                      });
                    }}
                  />
                </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button
                  title="✏️ Editar"
                  variant="outline"
                  size="small"
                  style={{ flex: 1 }}
                  onPress={() => handleEditGroup(group.id)}
                />
                <Button
                  title="🗑️ Eliminar"
                  variant="danger"
                  size="small"
                  style={{ flex: 1 }}
                  onPress={() => handleDeleteGroup(group.id, group.name)}
                />
              </View>
            </Card>
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
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
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
    paddingHorizontal: 32,
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
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupEmoji: {
    fontSize: 28,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  groupStats: {
    flexDirection: 'row',
    paddingVertical: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
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
