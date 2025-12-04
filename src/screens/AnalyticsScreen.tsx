/**
 * AnalyticsScreen - Dashboard de estadísticas y gráficos avanzados
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { RootStackParamList, Event } from '../types';
import { Card } from '../components/lovable';
import { useTheme } from '../context/ThemeContext';
import { useExpenses } from '../hooks/useExpenses';
import { getEvent } from '../services/firebase';
import {
  getMonthlyStats,
  getCategoryTrends,
  detectSpendingPatterns,
  getParticipantStats,
  getComparisonStats,
  getForecast,
  getTopExpenses,
  getDailySpendingRate,
} from '../services/analyticsService';

type AnalyticsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Analytics'>;
type AnalyticsScreenRouteProp = RouteProp<RootStackParamList, 'Analytics'>;

interface Props {
  navigation: AnalyticsScreenNavigationProp;
  route: AnalyticsScreenRouteProp;
}

const screenWidth = Dimensions.get('window').width;

export const AnalyticsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { eventId } = route.params;
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { expenses, participants } = useExpenses(eventId);
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'patterns' | 'participants'>('overview');

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      const eventData = await getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  if (loading || !event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Calcular todas las estadísticas con manejo de errores
  let monthlyStats: any[] = [];
  let categoryTrends: any[] = [];
  let patterns: any = { recurring: [], unusual: [], seasonal: [] };
  let participantStats: any[] = [];
  let comparison: any = { 
    percentageChange: { totalSpent: 0, expenseCount: 0, avgExpenseAmount: 0 },
    trend: 'stable' as const,
    currentPeriod: { totalSpent: 0, expenseCount: 0, avgExpenseAmount: 0 }
  };
  let forecast: any = { 
    predictedTotal: 0, 
    daysRemaining: 0, 
    willExceedBudget: false, 
    suggestedDailyLimit: 0,
    projectedSpending: 0,
    currentRunRate: 0
  };
  let topExpenses: any[] = [];
  let dailySpending: any = {};
  
  try {
    monthlyStats = getMonthlyStats(expenses, participants);
    categoryTrends = getCategoryTrends(expenses, 30);
    patterns = detectSpendingPatterns(expenses);
    participantStats = getParticipantStats(expenses, participants);
    comparison = getComparisonStats(expenses, 30);
    forecast = getForecast(expenses, event.initialBudget, event.endDate || new Date());
    topExpenses = getTopExpenses(expenses, 5);
    dailySpending = getDailySpendingRate(expenses);
  } catch (error) {
    console.error('Error calculando estadísticas:', error);
  }

  // Preparar datos para gráficos
  const dailySpendingData = {
    labels: Object.keys(dailySpending).slice(-7).map(d => d.substring(5)),
    datasets: [{
      data: Object.values(dailySpending).slice(-7).map(v => Number(v) || 0),
    }],
  };

  const categoryData = categoryTrends.slice(0, 5).map((trend, index) => ({
    name: trend.category,
    amount: trend.totalAmount,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][index],
    legendFontColor: theme.colors.text,
    legendFontSize: 12,
  }));

  const renderOverview = () => (
    <>
      {/* Comparación de períodos */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          📊 Últimos 30 días vs Período Anterior
        </Text>
        <View style={styles.comparisonGrid}>
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>
              Total Gastado
            </Text>
            <Text style={[styles.comparisonValue, { color: theme.colors.text }]}>
              €{comparison.currentPeriod.totalSpent.toFixed(2)}
            </Text>
            <Text style={[
              styles.comparisonChange,
              { color: comparison.percentageChange.totalSpent > 0 ? theme.colors.error : theme.colors.success }
            ]}>
              {comparison.percentageChange.totalSpent > 0 ? '↑' : '↓'} {Math.abs(comparison.percentageChange.totalSpent).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>
              # Gastos
            </Text>
            <Text style={[styles.comparisonValue, { color: theme.colors.text }]}>
              {comparison.currentPeriod.expenseCount}
            </Text>
            <Text style={[
              styles.comparisonChange,
              { color: comparison.percentageChange.expenseCount > 0 ? theme.colors.error : theme.colors.success }
            ]}>
              {comparison.percentageChange.expenseCount > 0 ? '↑' : '↓'} {Math.abs(comparison.percentageChange.expenseCount).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>
              Promedio
            </Text>
            <Text style={[styles.comparisonValue, { color: theme.colors.text }]}>
              €{comparison.currentPeriod.avgExpenseAmount.toFixed(2)}
            </Text>
            <Text style={[
              styles.comparisonChange,
              { color: comparison.percentageChange.avgExpenseAmount > 0 ? theme.colors.error : theme.colors.success }
            ]}>
              {comparison.percentageChange.avgExpenseAmount > 0 ? '↑' : '↓'} {Math.abs(comparison.percentageChange.avgExpenseAmount).toFixed(1)}%
            </Text>
          </View>
        </View>
      </Card>

      {/* Pronóstico */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          🔮 Pronóstico de Gasto
        </Text>
        <View style={styles.forecastContainer}>
          <View style={styles.forecastItem}>
            <Text style={[styles.forecastLabel, { color: theme.colors.textSecondary }]}>
              Gasto Proyectado
            </Text>
            <Text style={[styles.forecastValue, { 
              color: forecast.budgetStatus === 'over_budget' ? theme.colors.error : theme.colors.success 
            }]}>
              €{forecast.projectedSpending.toFixed(2)}
            </Text>
          </View>
          <View style={styles.forecastItem}>
            <Text style={[styles.forecastLabel, { color: theme.colors.textSecondary }]}>
              Tasa Diaria
            </Text>
            <Text style={[styles.forecastValue, { color: theme.colors.text }]}>
              €{forecast.currentRunRate.toFixed(2)}/día
            </Text>
          </View>
          <View style={styles.forecastItem}>
            <Text style={[styles.forecastLabel, { color: theme.colors.textSecondary }]}>
              Estado
            </Text>
            <Text style={[styles.forecastBadge, {
              backgroundColor: forecast.budgetStatus === 'over_budget' ? theme.colors.error + '20' :
                             forecast.budgetStatus === 'under_budget' ? theme.colors.success + '20' :
                             theme.colors.warning + '20',
              color: forecast.budgetStatus === 'over_budget' ? theme.colors.error :
                     forecast.budgetStatus === 'under_budget' ? theme.colors.success :
                     theme.colors.warning,
            }]}>
              {forecast.budgetStatus === 'over_budget' ? '⚠️ Sobre presupuesto' :
               forecast.budgetStatus === 'under_budget' ? '✓ Bajo presupuesto' :
               '✓ En camino'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Top 5 Gastos */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          💰 Top 5 Gastos Más Altos
        </Text>
        {topExpenses.map((expense, index) => (
          <View key={expense.id} style={styles.topExpenseItem}>
            <View style={styles.topExpenseRank}>
              <Text style={[styles.rankNumber, { color: theme.colors.primary }]}>#{index + 1}</Text>
            </View>
            <View style={styles.topExpenseInfo}>
              <Text style={[styles.topExpenseDesc, { color: theme.colors.text }]}>
                {expense.description}
              </Text>
              <Text style={[styles.topExpenseDate, { color: theme.colors.textSecondary }]}>
                {expense.createdAt?.toDate ? expense.createdAt.toDate().toLocaleDateString() : new Date(expense.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.topExpenseAmount, { color: theme.colors.primary }]}>
              €{expense.amount.toFixed(2)}
            </Text>
          </View>
        ))}
      </Card>
    </>
  );

  const renderTrends = () => (
    <>
      {/* Gráfico de gasto diario */}
      {Object.keys(dailySpending).length > 0 && (
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            📈 Gasto Diario (Últimos 7 días)
          </Text>
          <LineChart
            data={dailySpendingData}
            width={screenWidth - 64}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => theme.colors.text,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: theme.colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card>
      )}

      {/* Gráfico de categorías */}
      {categoryData.length > 0 && (
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            🎯 Distribución por Categoría
          </Text>
          <PieChart
            data={categoryData}
            width={screenWidth - 64}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card>
      )}

      {/* Tendencias de categorías */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          📊 Tendencias por Categoría
        </Text>
        {categoryTrends.slice(0, 5).map((trend) => (
          <View key={trend.category} style={styles.trendItem}>
            <View style={styles.trendInfo}>
              <Text style={[styles.trendCategory, { color: theme.colors.text }]}>
                {trend.category.toUpperCase()}
              </Text>
              <Text style={[styles.trendAmount, { color: theme.colors.textSecondary }]}>
                €{trend.totalAmount.toFixed(2)} • Promedio €{trend.averageAmount.toFixed(2)}
              </Text>
            </View>
            <Text style={[
              styles.trendChange,
              { color: trend.percentageChange > 0 ? theme.colors.error : theme.colors.success }
            ]}>
              {trend.percentageChange > 0 ? '↑' : '↓'} {Math.abs(trend.percentageChange).toFixed(1)}%
            </Text>
          </View>
        ))}
      </Card>
    </>
  );

  const renderPatterns = () => (
    <>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          🔍 Patrones de Gasto Detectados
        </Text>
        {patterns.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No hay suficientes datos para detectar patrones
          </Text>
        ) : (
          (patterns.recurring || []).map((pattern: any, index: number) => (
            <View key={index} style={styles.patternItem}>
              <View style={styles.patternIcon}>
                <Text style={styles.patternEmoji}>
                  {pattern.type === 'weekday' ? '📅' : pattern.type === 'time_of_day' ? '🕐' : '🔄'}
                </Text>
              </View>
              <View style={styles.patternInfo}>
                <Text style={[styles.patternDescription, { color: theme.colors.text }]}>
                  {pattern.description}
                </Text>
                <Text style={[styles.patternDetails, { color: theme.colors.textSecondary }]}>
                  {pattern.frequency} veces • Promedio €{pattern.avgAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </>
  );

  const renderParticipants = () => (
    <>
      {participantStats.map((stats) => (
        <Card key={stats.participantId} style={styles.card}>
          <View style={styles.participantHeader}>
            <Text style={[styles.participantName, { color: theme.colors.text }]}>
              {stats.participantName}
            </Text>
            <View style={[styles.trendBadge, {
              backgroundColor: stats.spendingTrend === 'increasing' ? theme.colors.error + '20' :
                             stats.spendingTrend === 'decreasing' ? theme.colors.success + '20' :
                             theme.colors.warning + '20',
            }]}>
              <Text style={[styles.trendBadgeText, {
                color: stats.spendingTrend === 'increasing' ? theme.colors.error :
                       stats.spendingTrend === 'decreasing' ? theme.colors.success :
                       theme.colors.warning,
              }]}>
                {stats.spendingTrend === 'increasing' ? '↑ Aumentando' :
                 stats.spendingTrend === 'decreasing' ? '↓ Disminuyendo' :
                 '→ Estable'}
              </Text>
            </View>
          </View>

          <View style={styles.participantStats}>
            <View style={styles.participantStatItem}>
              <Text style={[styles.participantStatLabel, { color: theme.colors.textSecondary }]}>
                Total Pagado
              </Text>
              <Text style={[styles.participantStatValue, { color: theme.colors.primary }]}>
                €{stats.totalPaid.toFixed(2)}
              </Text>
            </View>
            <View style={styles.participantStatItem}>
              <Text style={[styles.participantStatLabel, { color: theme.colors.textSecondary }]}>
                Total Adeudado
              </Text>
              <Text style={[styles.participantStatValue, { color: theme.colors.text }]}>
                €{stats.totalOwed.toFixed(2)}
              </Text>
            </View>
            <View style={styles.participantStatItem}>
              <Text style={[styles.participantStatLabel, { color: theme.colors.textSecondary }]}>
                Promedio
              </Text>
              <Text style={[styles.participantStatValue, { color: theme.colors.text }]}>
                €{stats.avgExpenseAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          {stats.topCategories.length > 0 && (
            <>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.text }]}>
                Top Categorías
              </Text>
              {(stats.topCategories || []).map((cat: any) => (
                <View key={cat.category} style={styles.categoryStatItem}>
                  <Text style={[styles.categoryStatName, { color: theme.colors.text }]}>
                    {cat.category.toUpperCase()}
                  </Text>
                  <Text style={[styles.categoryStatAmount, { color: theme.colors.textSecondary }]}>
                    €{cat.amount.toFixed(2)} ({cat.count} gastos)
                  </Text>
                </View>
              ))}
            </>
          )}
        </Card>
      ))}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Analíticas</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'overview' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Resumen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'trends' && styles.tabActive]}
          onPress={() => setSelectedTab('trends')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'trends' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Tendencias
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'patterns' && styles.tabActive]}
          onPress={() => setSelectedTab('patterns')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'patterns' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Patrones
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'participants' && styles.tabActive]}
          onPress={() => setSelectedTab('participants')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'participants' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Personas
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'trends' && renderTrends()}
        {selectedTab === 'patterns' && renderPatterns()}
        {selectedTab === 'participants' && renderParticipants()}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: theme.colors.primary + '15',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  comparisonValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  comparisonChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  forecastContainer: {
    gap: 16,
  },
  forecastItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: 14,
  },
  forecastValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  forecastBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  topExpenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topExpenseRank: {
    width: 40,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  topExpenseInfo: {
    flex: 1,
  },
  topExpenseDesc: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  topExpenseDate: {
    fontSize: 12,
  },
  topExpenseAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  trendInfo: {
    flex: 1,
  },
  trendCategory: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendAmount: {
    fontSize: 12,
  },
  trendChange: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  patternIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patternEmoji: {
    fontSize: 24,
  },
  patternInfo: {
    flex: 1,
  },
  patternDescription: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  patternDetails: {
    fontSize: 12,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantName: {
    fontSize: 18,
    fontWeight: '700',
  },
  trendBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  participantStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  participantStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  participantStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  participantStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  categoryStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryStatName: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryStatAmount: {
    fontSize: 13,
  },
});
