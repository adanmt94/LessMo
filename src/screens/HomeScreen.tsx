/**
 * HomeScreen - Pantalla principal con lista de eventos
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Event, CurrencySymbols } from '../types';
import { Button, Card } from '../components/lovable';
import { getUserEvents } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/numberUtils';

// DEPRECATED: Esta pantalla ha sido reemplazada por MainTabs (EventsScreen, GroupsScreen, SettingsScreen)
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    
    try {
      const userEvents = await getUserEvents(user.uid);
      setEvents(userEvents);
    } catch (error: any) {
      Alert.alert(t('common.error'), t('home.errorLoading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('home.signOut'),
      t('home.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('home.signOut'), 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const currencySymbol = CurrencySymbols[item.currency];
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        activeOpacity={0.7}
      >
        <Card style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={[styles.eventName, { color: theme.colors.text }]}>{item.name}</Text>
            <View style={[styles.statusBadge, item.isActive && styles.statusActive]}>
              <Text style={styles.statusText}>
                {item.isActive ? t('home.activeStatus') : t('home.finished')}
              </Text>
            </View>
          </View>

          {item.description && (
            <Text style={[styles.eventDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.eventFooter}>
            <View style={styles.budgetContainer}>
              <Text style={[styles.budgetLabel, { color: theme.colors.textSecondary }]}>{t('home.budget')}</Text>
              <Text style={[styles.budgetValue, { color: theme.colors.primary }]}>
                {formatCurrency(item.initialBudget, item.currency as any)}
              </Text>
            </View>
            <Text style={[styles.participantsCount, { color: theme.colors.textSecondary }]}>
              👥 {item.participantIds?.length || 0} {t('home.totalParticipants')}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('home.noEvents')}</Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        {t('home.noEventsMessage')}
      </Text>
      <Button
        title={t('home.createEvent')}
        onPress={() => navigation.navigate('CreateEvent')}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Hola 👋</Text>
          <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={[styles.logoutButton, { backgroundColor: theme.colors.error }]}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {events.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('CreateEvent')}
            activeOpacity={0.8}
          >
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </View>
      )}
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
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.error + '20',
  },
  logoutText: {
    color: theme.colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 24,
    paddingTop: 8,
  },
  eventCard: {
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    marginLeft: 8,
  },
  statusActive: {
    backgroundColor: theme.colors.success + '30',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.success,
  },
  eventDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetContainer: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  participantsCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  emptyButton: {
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    color: theme.colors.card,
    fontSize: 32,
    fontWeight: '300',
  },
});
