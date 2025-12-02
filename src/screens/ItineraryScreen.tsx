/**
 * Itinerary Screen
 * Display combined timeline of trip stops and expenses
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Event, Expense, CategoryLabels, CategoryColors, CurrencySymbols } from '../types';
import {
  ItineraryStop,
  TimelineItem,
  getEventStops,
  generateTimeline,
  groupTimelineByDay,
  getStopTotalExpenses,
} from '../services/itineraryService';

interface ItineraryScreenProps {
  navigation: any;
  route: {
    params: {
      event: Event;
      expenses: Expense[];
    };
  };
}

export const ItineraryScreen: React.FC<ItineraryScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const language = currentLanguage.code as 'es' | 'en';
  const { event, expenses } = route.params;

  const [stops, setStops] = useState<ItineraryStop[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [groupedTimeline, setGroupedTimeline] = useState<Map<string, TimelineItem[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItinerary();
  }, []);

  const loadItinerary = async () => {
    setLoading(true);
    try {
      const eventStops = await getEventStops(event.id);
      setStops(eventStops);

      const timelineData = generateTimeline(eventStops, expenses);
      setTimeline(timelineData);

      const grouped = groupTimelineByDay(timelineData);
      setGroupedTimeline(grouped);
    } catch (error) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es'
          ? 'No se pudo cargar el itinerario'
          : 'Could not load itinerary'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      food: '🍽️',
      transport: '🚗',
      accommodation: '🏨',
      entertainment: '🎭',
      shopping: '🛍️',
      activity: '🎯',
      health: '⚕️',
      other: '📌',
    };
    return icons[category] || '📌';
  };

  const renderStopCard = (stop: ItineraryStop) => {
    const totalExpenses = getStopTotalExpenses(stop, expenses);
    const currencySymbol = CurrencySymbols[event.currency];

    return (
      <View
        key={stop.id}
        style={[
          styles.stopCard,
          {
            backgroundColor: theme.isDark
              ? 'rgba(99, 102, 241, 0.15)'
              : 'rgba(99, 102, 241, 0.05)',
            borderColor: '#6366F1',
          },
        ]}
      >
        <View style={styles.stopIcon}>
          <Text style={styles.stopIconText}>{getCategoryIcon(stop.category)}</Text>
        </View>
        
        <View style={styles.stopContent}>
          <Text style={[styles.stopName, { color: theme.colors.text }]}>
            {stop.name}
          </Text>
          
          {stop.description && (
            <Text style={[styles.stopDescription, { color: theme.colors.textSecondary }]}>
              {stop.description}
            </Text>
          )}
          
          {stop.location?.address && (
            <Text style={[styles.stopLocation, { color: theme.colors.textSecondary }]}>
              📍 {stop.location.address}
            </Text>
          )}
          
          {stop.linkedExpenseIds.length > 0 && (
            <View style={styles.stopExpenses}>
              <Text style={[styles.stopExpensesLabel, { color: theme.colors.textSecondary }]}>
                {stop.linkedExpenseIds.length}{' '}
                {language === 'es' ? 'gastos' : 'expenses'} • {currencySymbol}
                {totalExpenses.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderExpenseCard = (expense: Expense) => {
    const currencySymbol = CurrencySymbols[event.currency];
    const categoryLabel = CategoryLabels[expense.category];
    const categoryColor = CategoryColors[expense.category];

    return (
      <View
        key={expense.id}
        style={[
          styles.expenseCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={[styles.expenseCategoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.expenseCategoryText}>{categoryLabel}</Text>
        </View>
        
        <View style={styles.expenseContent}>
          <Text style={[styles.expenseDescription, { color: theme.colors.text }]}>
            {expense.description}
          </Text>
          
          <View style={styles.expenseFooter}>
            <Text style={[styles.expenseAmount, { color: '#10B981' }]}>
              {currencySymbol}{expense.amount.toFixed(2)}
            </Text>
            
            {expense.receiptPhoto && (
              <Text style={styles.expensePhoto}>📷</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTimelineItem = (item: TimelineItem) => {
    return (
      <View key={item.id} style={styles.timelineItem}>
        <View style={styles.timelineTime}>
          <Text style={[styles.timelineTimeText, { color: theme.colors.textSecondary }]}>
            {formatTime(item.date)}
          </Text>
        </View>
        
        <View style={styles.timelineDot}>
          <View
            style={[
              styles.timelineDotInner,
              {
                backgroundColor: item.type === 'stop' ? '#6366F1' : '#10B981',
              },
            ]}
          />
        </View>
        
        <View style={styles.timelineContent}>
          {item.type === 'stop'
            ? renderStopCard(item.data as ItineraryStop)
            : renderExpenseCard(item.data as Expense)}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {language === 'es' ? 'Cargando itinerario...' : 'Loading itinerary...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {language === 'es' ? '🗺️ Itinerario' : '🗺️ Itinerary'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {event.name}
        </Text>
      </View>

      {timeline.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            {language === 'es' ? 'No hay actividades aún' : 'No activities yet'}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
            {language === 'es'
              ? 'Los gastos aparecerán aquí en orden cronológico'
              : 'Expenses will appear here in chronological order'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Timeline grouped by day */}
          {Array.from(groupedTimeline.entries()).map(([dateKey, items]) => (
            <View key={dateKey} style={styles.daySection}>
              <View
                style={[
                  styles.dayHeader,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(99, 102, 241, 0.2)'
                      : 'rgba(99, 102, 241, 0.1)',
                  },
                ]}
              >
                <Text style={[styles.dayHeaderText, { color: '#6366F1' }]}>
                  {formatDate(items[0].date)}
                </Text>
                <Text style={[styles.dayHeaderCount, { color: theme.colors.textSecondary }]}>
                  {items.length} {language === 'es' ? 'eventos' : 'events'}
                </Text>
              </View>

              <View style={styles.dayTimeline}>
                {items.map(renderTimelineItem)}
              </View>
            </View>
          ))}

          {/* Summary */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
              {language === 'es' ? '📊 Resumen' : '📊 Summary'}
            </Text>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                {language === 'es' ? 'Paradas' : 'Stops'}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {stops.length}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                {language === 'es' ? 'Gastos' : 'Expenses'}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {expenses.length}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                {language === 'es' ? 'Duración' : 'Duration'}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {event.startDate && event.endDate 
                  ? Math.ceil(
                      (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : '-'
                }{' '}
                {language === 'es' ? 'días' : 'days'}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  daySection: {
    marginBottom: 32,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  dayHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dayHeaderCount: {
    fontSize: 13,
  },
  dayTimeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineTime: {
    width: 60,
    paddingTop: 4,
  },
  timelineTimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timelineDot: {
    width: 32,
    alignItems: 'center',
    paddingTop: 8,
  },
  timelineDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineContent: {
    flex: 1,
  },
  stopCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  stopIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stopIconText: {
    fontSize: 24,
  },
  stopContent: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stopDescription: {
    fontSize: 14,
    marginBottom: 6,
  },
  stopLocation: {
    fontSize: 13,
    marginBottom: 8,
  },
  stopExpenses: {
    marginTop: 4,
  },
  stopExpensesLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  expenseCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  expenseCategoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  expenseCategoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  expenseContent: {
    paddingRight: 60,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  expenseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  expensePhoto: {
    fontSize: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
