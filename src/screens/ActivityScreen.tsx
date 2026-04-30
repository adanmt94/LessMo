/**
 * ActivityScreen - Dashboard / Resumen global
 * Primera pestaña: muestra balance global, gastos del mes, acciones rápidas y actividad reciente
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Card } from '../components/lovable';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Gradients, Spacing, Radius, Shadows, Typography } from '../theme/designSystem';
import * as Haptics from 'expo-haptics';
import { GlobalSearchModal } from '../components/GlobalSearchModal';
import { FeatureTooltip } from '../components/FeatureTooltip';

type ActivityScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: ActivityScreenNavigationProp;
}

interface ActivityItem {
  id: string;
  type: 'event_created' | 'expense_added' | 'group_created';
  title: string;
  description: string;
  amount?: number;
  currency?: string;
  date: Date;
  icon: string;
  eventId?: string;
  userName?: string;
  userPhoto?: string;
  userId?: string;
}

interface DashboardData {
  totalBalance: number;
  youOwe: number;
  owedToYou: number;
  monthExpenses: number;
  monthIncome: number;
  monthTransactions: number;
  totalBudget: number;
  totalSpent: number;
  activeEvents: number;
}

export const ActivityScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { currentCurrency } = useCurrency();
  const styles = getStyles(theme);
  const [dashboard, setDashboard] = useState<DashboardData>({
    totalBalance: 0, youOwe: 0, owedToYou: 0,
    monthExpenses: 0, monthIncome: 0, monthTransactions: 0,
    totalBudget: 0, totalSpent: 0, activeEvents: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchVisible, setSearchVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) loadAll();
    }, [user])
  );

  const loadAll = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      await Promise.all([loadDashboard(), loadActivities()]);
      // Process recurring expenses in background
      import('../services/recurringExpenseService').then(({ processRecurringExpenses }) => {
        processRecurringExpenses(user.uid).catch(() => {});
      }).catch(() => {});
      // Update widget data in background
      import('../services/widgetDataService').then(({ updateWidgetData }) => {
        updateWidgetData(user.uid).catch(() => {});
      }).catch(() => {});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    try {
      const { getUserEventsByStatus, getEventExpenses, getEventParticipants } = await import('../services/firebase');

      const userEvents = await getUserEventsByStatus(user.uid);
      const activeEvents = userEvents.filter(e => e.status === 'active');

      let totalBalance = 0;
      let youOwe = 0;
      let owedToYou = 0;
      let totalBudget = 0;
      let totalSpent = 0;

      for (const event of activeEvents) {
        try {
          if (event.budget) totalBudget += event.budget;
          
          // Buscar el participant ID del usuario en este evento
          const participants = await getEventParticipants(event.id);
          const userParticipant = participants.find(p => p.userId === user.uid);
          if (!userParticipant) continue;
          
          const pid = userParticipant.id;
          const expenses = await getEventExpenses(event.id);
          
          // Lo que el usuario PAGÓ (paidBy = participant doc ID)
          const userPaid = expenses
            .filter(e => e.paidBy === pid)
            .reduce((sum, e) => sum + e.amount, 0);
          
          // Lo que el usuario DEBE (su parte según tipo de split)
          const userOwes = expenses
            .filter(e => (e.participantIds || []).includes(pid))
            .reduce((sum, e) => {
              if (e.splitType === 'percentage' && e.percentageSplits) {
                const pct = e.percentageSplits[pid] || 0;
                return sum + (e.amount * pct / 100);
              }
              if ((e.splitType === 'custom' || e.splitType === 'amount') && e.customSplits) {
                return sum + (e.customSplits[pid] || 0);
              }
              const parts = (e.participantIds || []).length;
              return sum + (parts > 0 ? e.amount / parts : 0);
            }, 0);
          
          totalSpent += userOwes;
          const eventBal = userPaid - userOwes;
          totalBalance += eventBal;
          if (eventBal > 0) owedToYou += eventBal;
          else youOwe += Math.abs(eventBal);
        } catch { /* skip event */ }
      }

      // Individual expenses (paidBy = auth UID, sin eventId)
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      let monthExpenses = 0;
      let monthIncome = 0;
      let monthTransactions = 0;

      try {
        const indQ = query(
          collection(db, 'expenses'),
          where('paidBy', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(indQ);
        snap.docs.forEach(doc => {
          const d = doc.data();
          if (d.eventId && d.eventId !== 'individual') return; // Solo individuales (sin eventId o eventId === 'individual')
          const date = d.date?.toDate ? d.date.toDate() : new Date(d.date);
          const amt = d.amount || 0;
          if (d.type === 'income') {
            totalBalance += amt;
            if (date >= monthStart) { monthIncome += amt; monthTransactions++; }
          } else {
            totalBalance -= amt;
            if (date >= monthStart) { monthExpenses += amt; monthTransactions++; }
          }
        });
      } catch { /* skip */ }

      // Event expenses for monthly totals
      for (const event of activeEvents.slice(0, 5)) {
        try {
          const participants = await getEventParticipants(event.id);
          const userParticipant = participants.find(p => p.userId === user.uid);
          if (!userParticipant) continue;
          const pid = userParticipant.id;
          
          const expenses = await getEventExpenses(event.id);
          expenses.forEach(exp => {
            const date = exp.date instanceof Date ? exp.date : new Date(exp.date);
            if (date >= monthStart) {
              if ((exp.participantIds || []).includes(pid)) {
                if (exp.splitType === 'percentage' && exp.percentageSplits) {
                  monthExpenses += exp.amount * (exp.percentageSplits[pid] || 0) / 100;
                } else if ((exp.splitType === 'custom' || exp.splitType === 'amount') && exp.customSplits) {
                  monthExpenses += exp.customSplits[pid] || 0;
                } else {
                  const parts = (exp.participantIds || []).length;
                  monthExpenses += parts > 0 ? exp.amount / parts : 0;
                }
              }
              monthTransactions++;
            }
          });
        } catch { /* skip */ }
      }

      setDashboard({
        totalBalance, youOwe, owedToYou,
        monthExpenses, monthIncome, monthTransactions,
        totalBudget, totalSpent,
        activeEvents: activeEvents.length,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadActivities = async () => {
    if (!user) return;
    try {
      const allActivities: ActivityItem[] = [];
      const userCache = new Map<string, { name: string; photo?: string }>();

      const getUserInfo = async (userId: string) => {
        if (userCache.has(userId)) return userCache.get(userId)!;
        try {
          const snap = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId), limit(1)));
          if (!snap.empty) {
            const d = snap.docs[0].data();
            const info = { name: d.displayName || 'Usuario', photo: d.photoURL };
            userCache.set(userId, info);
            return info;
          }
        } catch { /* skip */ }
        return { name: 'Usuario' };
      };

      // Recent events
      const eventsSnap = await getDocs(query(
        collection(db, 'events'),
        where('participantIds', 'array-contains', user.uid),
        limit(20)
      ));
      for (const doc of eventsSnap.docs) {
        const d = doc.data();
        const info = await getUserInfo(d.createdBy || user.uid);
        allActivities.push({
          id: `ev_${doc.id}`, type: 'event_created',
          title: 'Evento creado', description: d.name,
          date: d.createdAt?.toDate() || new Date(),
          icon: '📅', eventId: doc.id,
          userName: info.name, userPhoto: info.photo, userId: d.createdBy,
        });
      }

      // Recent expenses - individual (paidBy = auth UID, no eventId)
      const indExpSnap = await getDocs(query(
        collection(db, 'expenses'),
        where('paidBy', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      ));
      for (const doc of indExpSnap.docs) {
        const d = doc.data();
        if (d.eventId && d.eventId !== 'individual') continue; // Skip event expenses here
        const info = await getUserInfo(d.paidBy);
        allActivities.push({
          id: `exp_${doc.id}`, type: 'expense_added',
          title: 'Gasto rápido',
          description: d.description, amount: d.amount, currency: d.currency,
          date: d.date?.toDate() || new Date(),
          icon: d.type === 'income' ? '📈' : '💸',
          userName: info.name, userPhoto: info.photo, userId: d.paidBy,
        });
      }

      // Recent expenses - from events (paidBy = participant doc ID)
      const { getUserEventsByStatus, getEventExpenses, getEventParticipants } = await import('../services/firebase');
      const userEvents = await getUserEventsByStatus(user.uid);
      const activeEvents = userEvents.filter(e => e.status === 'active');
      for (const event of activeEvents.slice(0, 5)) {
        try {
          const participants = await getEventParticipants(event.id);
          const userParticipant = participants.find((p: any) => p.userId === user.uid);
          if (!userParticipant) continue;
          const pid = userParticipant.id;
          const expenses = await getEventExpenses(event.id);
          for (const exp of expenses.slice(0, 10)) {
            if (exp.paidBy === pid || (exp.participantIds || []).includes(pid)) {
              const payerParticipant = participants.find((p: any) => p.id === exp.paidBy);
              const payerName = payerParticipant ? (payerParticipant.name || 'Usuario') : 'Usuario';
              allActivities.push({
                id: `exp_${exp.id}`, type: 'expense_added',
                title: event.name || 'Evento',
                description: exp.description || exp.name || 'Gasto', amount: exp.amount, currency: event.currency,
                date: exp.date instanceof Date ? exp.date : new Date(exp.date),
                icon: '💸', eventId: event.id,
                userName: payerName, userId: exp.paidBy,
              });
            }
          }
        } catch { /* skip event */ }
      }

      allActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
      setActivities(allActivities.slice(0, 20));
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: currentCurrency.code }).format(amount);

  const getTimeAgo = (date: Date): string => {
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const budgetPct = dashboard.totalBudget > 0
    ? Math.min(1, dashboard.totalSpent / dashboard.totalBudget) : 0;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Header con balance global */}
        <LinearGradient
          colors={theme.isDark ? Gradients.primaryDark : Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>{t('activity.title')}</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearchVisible(true);
              }}
              style={styles.searchButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.searchIcon}>🔍</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroLabel}>{t('activity.globalBalance')}</Text>
          <Text style={styles.heroBalance}>
            {dashboard.totalBalance >= 0 ? '+' : ''}{formatMoney(dashboard.totalBalance)}
          </Text>

          <View style={styles.balanceCards}>
            <View style={[styles.balanceCard, styles.balanceCardPositive]}>
              <Text style={styles.balanceCardLabel}>{t('activity.owedToYou')}</Text>
              <Text style={[styles.balanceCardAmount, { color: '#10B981' }]}>
                +{formatMoney(dashboard.owedToYou)}
              </Text>
            </View>
            <View style={[styles.balanceCard, styles.balanceCardNegative]}>
              <Text style={styles.balanceCardLabel}>{t('activity.youOwe')}</Text>
              <Text style={[styles.balanceCardAmount, { color: '#EF4444' }]}>
                -{formatMoney(dashboard.youOwe)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Acciones rápidas */}
        <FeatureTooltip
          id="activity_new_features"
          title="🆕 Nuevas funcionalidades"
          message="Ahora puedes buscar gastos con 🔍, añadir etiquetas, notas, gastos recurrentes y mucho más. ¡Explora!"
          position="bottom"
        >
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('activity.quickActions')}</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: theme.colors.primary + '15' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('QuickExpense', {});
              }}
            >
              <Text style={styles.quickActionIcon}>⚡</Text>
              <Text style={[styles.quickActionText, { color: theme.colors.primary }]}>
                {t('activity.createQuickExpense')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: '#8B5CF6' + '15' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('CreateEvent', { mode: 'create' });
              }}
            >
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={[styles.quickActionText, { color: '#8B5CF6' }]}>
                {t('activity.createEvent')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </FeatureTooltip>

        {/* Gastos del mes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('activity.monthSpending')}</Text>
          <View style={styles.monthGrid}>
            <View style={[styles.monthCard, { backgroundColor: theme.colors.card }]}>
              <Text style={styles.monthCardIcon}>💸</Text>
              <Text style={[styles.monthCardLabel, { color: theme.colors.textSecondary }]}>Gastado</Text>
              <Text style={[styles.monthCardValue, { color: '#EF4444' }]}>
                {formatMoney(dashboard.monthExpenses)}
              </Text>
            </View>
            <View style={[styles.monthCard, { backgroundColor: theme.colors.card }]}>
              <Text style={styles.monthCardIcon}>📈</Text>
              <Text style={[styles.monthCardLabel, { color: theme.colors.textSecondary }]}>Ingresos</Text>
              <Text style={[styles.monthCardValue, { color: '#10B981' }]}>
                {formatMoney(dashboard.monthIncome)}
              </Text>
            </View>
            <View style={[styles.monthCard, { backgroundColor: theme.colors.card }]}>
              <Text style={styles.monthCardIcon}>🔄</Text>
              <Text style={[styles.monthCardLabel, { color: theme.colors.textSecondary }]}>
                {t('activity.movements')}
              </Text>
              <Text style={[styles.monthCardValue, { color: theme.colors.text }]}>
                {dashboard.monthTransactions}
              </Text>
            </View>
          </View>
        </View>

        {/* Presupuesto */}
        {dashboard.totalBudget > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('activity.budgetUsed')}</Text>
            <Card style={{ ...styles.budgetCard, backgroundColor: theme.colors.card }}>
              <View style={styles.budgetHeader}>
                <Text style={[styles.budgetSpent, { color: theme.colors.text }]}>
                  {formatMoney(dashboard.totalSpent)}
                </Text>
                <Text style={[styles.budgetTotal, { color: theme.colors.textSecondary }]}>
                  / {formatMoney(dashboard.totalBudget)}
                </Text>
              </View>
              <View style={styles.budgetBarBg}>
                <View style={[
                  styles.budgetBarFill,
                  {
                    width: `${Math.round(budgetPct * 100)}%` as any,
                    backgroundColor: budgetPct > 0.8 ? '#EF4444' : budgetPct > 0.5 ? '#F59E0B' : '#10B981'
                  }
                ]} />
              </View>
              <Text style={[styles.budgetPct, { color: theme.colors.textSecondary }]}>
                {Math.round(budgetPct * 100)}% usado • {formatMoney(Math.max(0, dashboard.totalBudget - dashboard.totalSpent))} restante
              </Text>
            </Card>
          </View>
        )}

        {/* Eventos activos */}
        {dashboard.activeEvents > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Eventos activos</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Events' } as any)}>
                <Text style={[styles.seeAll, { color: theme.colors.primary }]}>{t('activity.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <Card style={{ ...styles.eventsCard, backgroundColor: theme.colors.card }}>
              <Text style={styles.eventsCardIcon}>📋</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eventsCardCount, { color: theme.colors.text }]}>
                  {dashboard.activeEvents} evento{dashboard.activeEvents === 1 ? '' : 's'}
                </Text>
                <Text style={[styles.eventsCardSub, { color: theme.colors.textSecondary }]}>
                  {dashboard.youOwe > 0
                    ? `Debes ${formatMoney(dashboard.youOwe)} en total`
                    : t('activity.allCaughtUp')}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Actividad reciente */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('activity.recentActivity')}</Text>
          {loading && activities.length === 0 ? (
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>{t('activity.loading')}</Text>
          ) : activities.length === 0 ? (
            <Card style={{ ...styles.emptyCard, backgroundColor: theme.colors.card }}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('activity.empty')}</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('activity.emptySubtitle')}
              </Text>
            </Card>
          ) : (
            activities.slice(0, 10).map((activity) => (
              <TouchableOpacity
                key={activity.id}
                onPress={() => {
                  if (activity.eventId) navigation.navigate('EventDetail', { eventId: activity.eventId, eventName: activity.title });
                }}
                activeOpacity={0.7}
              >
                <Card style={{ ...styles.activityCard, backgroundColor: theme.colors.card }}>
                  <View style={styles.activityRow}>
                    <View style={[styles.activityIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                      <Text style={styles.activityIconText}>{activity.icon}</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <View style={styles.activityTopRow}>
                        <Text style={[styles.activityTitle, { color: theme.colors.text }]} numberOfLines={1}>
                          {activity.description || activity.title}
                        </Text>
                        <Text style={[styles.activityTime, { color: theme.colors.textTertiary }]}>
                          {getTimeAgo(activity.date)}
                        </Text>
                      </View>
                      <View style={styles.activityBottomRow}>
                        <View style={styles.activityUserRow}>
                          {activity.userPhoto && (
                            <Image source={{ uri: activity.userPhoto }} style={styles.activityAvatar} />
                          )}
                          <Text style={[styles.activityUser, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {activity.userName || activity.title}
                          </Text>
                          {activity.type === 'expense_added' && (
                            <View style={[styles.activityTag, {
                              backgroundColor: activity.eventId
                                ? theme.colors.primary + '20'
                                : '#F59E0B20'
                            }]}>
                              <Text style={[styles.activityTagText, {
                                color: activity.eventId
                                  ? theme.colors.primary
                                  : '#F59E0B'
                              }]} numberOfLines={1}>
                                {activity.title}
                              </Text>
                            </View>
                          )}
                        </View>
                        {activity.amount != null && (
                          <Text style={[
                            styles.activityAmount,
                            { color: activity.icon === '📈' ? '#10B981' : '#EF4444' }
                          ]}>
                            {activity.icon === '📈' ? '+' : '-'}{formatMoney(activity.amount)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <GlobalSearchModal visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
  },
  heroLabel: {
    ...Typography.subhead,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  heroBalance: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: Spacing.lg,
  },
  balanceCards: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  balanceCard: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  balanceCardPositive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  balanceCardNegative: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  balanceCardLabel: {
    ...Typography.caption1,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 2,
  },
  balanceCardAmount: {
    ...Typography.headline,
    fontWeight: '700',
  },
  quickActionsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  quickActionText: {
    ...Typography.subhead,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.headline,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  seeAll: {
    ...Typography.subhead,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  monthGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  monthCard: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  monthCardIcon: {
    fontSize: 22,
    marginBottom: Spacing.xs,
  },
  monthCardLabel: {
    ...Typography.caption1,
    fontWeight: '500',
    marginBottom: 2,
  },
  monthCardValue: {
    ...Typography.subhead,
    fontWeight: '800',
  },
  budgetCard: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  budgetSpent: {
    ...Typography.title3,
    fontWeight: '800',
  },
  budgetTotal: {
    ...Typography.subhead,
    fontWeight: '500',
    marginLeft: 4,
  },
  budgetBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  budgetBarFill: {
    height: '100%' as any,
    borderRadius: 4,
  },
  budgetPct: {
    ...Typography.caption1,
    fontWeight: '500',
  },
  eventsCard: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  eventsCardIcon: {
    fontSize: 28,
  },
  eventsCardCount: {
    ...Typography.headline,
    fontWeight: '700',
  },
  eventsCardSub: {
    ...Typography.caption1,
    fontWeight: '500',
  },
  activityCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityIconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityTitle: {
    ...Typography.subhead,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  activityTime: {
    ...Typography.caption1,
  },
  activityBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 4,
    backgroundColor: theme.colors.border,
  },
  activityUser: {
    ...Typography.caption1,
    fontWeight: '500',
  },
  activityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  activityTagText: {
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 80,
  },
  activityAmount: {
    ...Typography.subhead,
    fontWeight: '700',
  },
  loadingText: {
    ...Typography.body,
    textAlign: 'center',
    padding: Spacing.xl,
  },
  emptyCard: {
    padding: Spacing.xxl,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.headline,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.subhead,
    textAlign: 'center',
  },
});
