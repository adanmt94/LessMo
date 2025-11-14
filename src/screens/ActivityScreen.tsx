/**
 * ActivityScreen - Pantalla de historial y actividad reciente
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Card } from '../components/lovable';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

type ActivityScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: ActivityScreenNavigationProp;
}

interface ActivityItem {
  id: string;
  type: 'event_created' | 'event_updated' | 'expense_added' | 'expense_updated' | 'participant_added' | 'group_created';
  title: string;
  description: string;
  date: Date;
  icon: string;
  eventId?: string;
  groupId?: string;
  userName?: string; // Nombre del usuario que realizó la acción
  userId?: string; // ID del usuario
}

export const ActivityScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [user]);

  const loadActivities = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allActivities: ActivityItem[] = [];
      const userCache = new Map<string, string>(); // Cache de userId -> userName

      // Helper para obtener nombre de usuario
      const getUserName = async (userId: string): Promise<string> => {
        if (userCache.has(userId)) {
          return userCache.get(userId)!;
        }
        
        try {
          const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId), limit(1)));
          if (!userDoc.empty) {
            const userName = userDoc.docs[0].data().displayName || 'Usuario';
            userCache.set(userId, userName);
            return userName;
          }
        } catch (error) {
          console.error('Error getting user name:', error);
        }
        return 'Usuario';
      };

      // Cargar eventos recientes (sin índice compuesto)
      const eventsQuery = query(
        collection(db, 'events'),
        where('participantIds', 'array-contains', user.uid),
        limit(50)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      
      for (const doc of eventsSnapshot.docs) {
        const data = doc.data();
        const userName = await getUserName(data.createdBy || user.uid);
        allActivities.push({
          id: `event_${doc.id}`,
          type: 'event_created',
          title: 'Evento creado',
          description: data.name,
          date: data.createdAt?.toDate() || new Date(),
          icon: '📅',
          eventId: doc.id,
          userName,
          userId: data.createdBy,
        });
      }

      // Cargar gastos recientes (sin orderBy para evitar índice)
      const expensesQuery = query(
        collection(db, 'expenses'),
        limit(50)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      
      for (const doc of expensesSnapshot.docs) {
        const data = doc.data();
        // Filtrar solo gastos donde el usuario está involucrado
        if (data.paidBy === user.uid || (data.beneficiaries && data.beneficiaries.includes(user.uid))) {
          const userName = await getUserName(data.paidBy);
          allActivities.push({
            id: `expense_${doc.id}`,
            type: 'expense_added',
            title: 'Gasto agregado',
            description: data.description,
            date: data.date?.toDate() || new Date(),
            icon: '💰',
            eventId: data.eventId,
            userName,
            userId: data.paidBy,
          });
        }
      }

      // Cargar grupos recientes (sin índice compuesto)
      const groupsQuery = query(
        collection(db, 'groups'),
        where('memberIds', 'array-contains', user.uid),
        limit(50)
      );
      const groupsSnapshot = await getDocs(groupsQuery);
      
      for (const doc of groupsSnapshot.docs) {
        const data = doc.data();
        const userName = await getUserName(data.createdBy || user.uid);
        allActivities.push({
          id: `group_${doc.id}`,
          type: 'group_created',
          title: 'Grupo creado',
          description: data.name,
          date: data.createdAt?.toDate() || new Date(),
          icon: '👥',
          groupId: doc.id,
          userName,
          userId: data.createdBy,
        });
      }

      // Ordenar todas las actividades por fecha
      allActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setActivities(allActivities.slice(0, 50)); // Limitar a 50 actividades
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const handleActivityPress = (activity: ActivityItem) => {
    if (activity.eventId) {
      navigation.navigate('EventDetail', { eventId: activity.eventId });
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const renderActivity = (activity: ActivityItem) => (
    <TouchableOpacity
      key={activity.id}
      onPress={() => handleActivityPress(activity)}
      activeOpacity={0.7}
    >
      <Card style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight + '20' }]}>
            <Text style={styles.activityIcon}>{activity.icon}</Text>
          </View>
          <View style={styles.activityContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.activityTitle, { color: theme.colors.text }]}>{activity.title}</Text>
              {activity.userName && (
                <Text style={[styles.userName, { color: theme.colors.primary }]}>
                  • {activity.userName}
                </Text>
              )}
            </View>
            <Text style={[styles.activityDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {activity.description}
            </Text>
          </View>
          <Text style={[styles.activityTime, { color: theme.colors.textTertiary }]}>{getTimeAgo(activity.date)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Actividad Reciente</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          Historial de eventos, gastos y cambios
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Cargando actividad...</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Sin actividad reciente</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Tus eventos y gastos aparecerán aquí
            </Text>
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {activities.map(renderActivity)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  activitiesList: {
    padding: 16,
  },
  activityCard: {
    marginBottom: 12,
    padding: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 22,
  },
  activityContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  userName: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  activityDescription: {
    fontSize: 13,
  },
  activityTime: {
    fontSize: 12,
    marginLeft: 8,
  },
});
