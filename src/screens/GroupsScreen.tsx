/**
 * GroupsScreen - Pantalla de grupos
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
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

type GroupsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: GroupsScreenNavigationProp;
}

export const GroupsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const getGroupColor = (color?: string) => color || '#6366F1';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Grupos</Text>
        <Button
          title="+ Crear Grupo"
          onPress={() => navigation.navigate('CreateGroup', { mode: 'create' })}
          size="small"
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyText}>Cargando grupos...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No tienes grupos creados</Text>
            <Text style={styles.emptySubtext}>
              Los grupos te permiten organizar múltiples eventos relacionados
            </Text>
            <Button
              title="Crear primer grupo"
              onPress={() => navigation.navigate('CreateGroup', { mode: 'create' })}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          groups.map((group) => (
            <TouchableOpacity key={group.id}>
              <Card style={styles.groupCard}>
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

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    title="Ver Eventos"
                    variant="outline"
                    size="small"
                    style={{ flex: 1 }}
                    onPress={() => {
                      // TODO: Navegar a vista filtrada de eventos del grupo
                      Alert.alert('Próximamente', 'Ver eventos del grupo');
                    }}
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
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
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
    color: '#111827',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#111827',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  groupStats: {
    flexDirection: 'row',
    paddingVertical: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
});
