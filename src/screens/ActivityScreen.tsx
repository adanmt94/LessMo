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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Card } from '../components/lovable';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
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
  userPhoto?: string; // URL de la foto del usuario
}

export const ActivityScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
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

      // Helper para obtener nombre y foto de usuario
      const getUserInfo = async (userId: string): Promise<{ name: string, photo?: string }> => {
        const cacheKey = userCache.get(userId);
        if (cacheKey) {
          return JSON.parse(cacheKey);
        }
        
        try {
          const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId), limit(1)));
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            const userInfo = {
              name: userData.displayName || 'Usuario',
              photo: userData.photoURL
            };
            userCache.set(userId, JSON.stringify(userInfo));
            return userInfo;
          }
        } catch (error) {
          console.error('Error getting user info:', error);
        }
        return { name: 'Usuario' };
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
        const userInfo = await getUserInfo(data.createdBy || user.uid);
        allActivities.push({
          id: `event_${doc.id}`,
          type: 'event_created',
          title: 'Evento creado',
          description: data.name,
          date: data.createdAt?.toDate() || new Date(),
          icon: '📅',
          eventId: doc.id,
          userName: userInfo.name,
          userPhoto: userInfo.photo,
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
          const userInfo = await getUserInfo(data.paidBy);
          allActivities.push({
            id: `expense_${doc.id}`,
            type: 'expense_added',
            title: 'Gasto agregado',
            description: data.description,
            date: data.date?.toDate() || new Date(),
            icon: '💰',
            eventId: data.eventId,
            userName: userInfo.name,
            userPhoto: userInfo.photo,
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
        const userInfo = await getUserInfo(data.createdBy || user.uid);
        allActivities.push({
          id: `group_${doc.id}`,
          type: 'group_created',
          title: t('activity.groupCreated'),
          description: data.name,
          date: data.createdAt?.toDate() || new Date(),
          icon: '👥',
          groupId: doc.id,
          userName: userInfo.name,
          userPhoto: userInfo.photo,
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
              <View style={styles.userInfo}>
                {activity.userPhoto && (
                  <Image 
                    source={{ uri: activity.userPhoto }} 
                    style={[styles.userAvatar, { borderColor: theme.colors.border }]}
                  />
                )}
                {activity.userName && (
                  <Text style={[styles.userName, { color: theme.colors.primary }]}>
                    {activity.userPhoto ? '' : '• '}{activity.userName}
                  </Text>
                )}
              </View>
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
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('activity.title')}</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {t('activity.emptySubtitle')}
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
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>{t('activity.loading')}</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('activity.empty')}</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('activity.emptySubtitle')}
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

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    backgroundColor: theme.colors.card,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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
    color: theme.colors.textSecondary,
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
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  activitiesList: {
    padding: 16,
  },
  activityCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.text,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
    backgroundColor: theme.colors.border,
    borderWidth: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  activityDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  activityTime: {
    fontSize: 12,
    marginLeft: 8,
    color: theme.colors.textTertiary,
  },
});
