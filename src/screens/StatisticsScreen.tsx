/**
 * StatisticsScreen - Pantalla de estadísticas y análisis de gastos
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Expense, ExpenseCategory, Participant } from '../types';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { useExpenses } from '../hooks/useExpenses';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Card } from '../components/lovable/Card';
import { CategoryLabels, CategoryColors } from '../types';

const screenWidth = Dimensions.get('window').width;

type StatisticsScreenRouteProp = RouteProp<RootStackParamList, 'Statistics'>;
type StatisticsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Statistics'>;

interface StatisticsScreenProps {
  route: StatisticsScreenRouteProp;
  navigation: StatisticsScreenNavigationProp;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ route }) => {
  const { eventId, eventName, currency } = route.params;
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  
  const { expenses, participants } = useExpenses(eventId);
  
  const [selectedTab, setSelectedTab] = useState<'categories' | 'participants' | 'timeline'>('categories');

  // Calcular datos para gráfico de categorías
  const categoryData = useMemo(() => {
    const categoryTotals: { [key in ExpenseCategory]?: number } = {};
    
    expenses.forEach((expense: Expense) => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    return Object.entries(categoryTotals).map(([category, total]) => ({
      name: CategoryLabels[category as ExpenseCategory].split(' ')[1] || CategoryLabels[category as ExpenseCategory],
      population: total,
      color: CategoryColors[category as ExpenseCategory],
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    }));
  }, [expenses, theme]);

  // Calcular datos para gráfico de participantes (Top 5)
  const participantData = useMemo(() => {
    const participantTotals: { [key: string]: number } = {};
    
    expenses.forEach((expense: Expense) => {
      const participant = participants.find((p: Participant) => p.id === expense.paidBy);
      if (participant) {
        const name = participant.name.split(' ')[0]; // Primer nombre
        participantTotals[name] = (participantTotals[name] || 0) + expense.amount;
      }
    });
    
    // Ordenar y tomar top 5
    const sorted = Object.entries(participantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return {
      labels: sorted.map(([name]) => name),
      datasets: [{
        data: sorted.map(([, total]) => total),
      }],
    };
  }, [expenses, participants]);

  // Calcular datos para gráfico de timeline (últimos 7 días)
  const timelineData = useMemo(() => {
    const dailyTotals: { [key: string]: number } = {};
    
    expenses.forEach((expense: Expense) => {
      // Manejar Firestore Timestamp
      let date: Date;
      if (expense.date instanceof Date) {
        date = expense.date;
      } else if (expense.date && typeof expense.date === 'object' && 'toDate' in expense.date) {
        date = (expense.date as any).toDate();
      } else {
        date = new Date(expense.date);
      }
      
      const dateKey = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + expense.amount;
    });
    
    // Obtener últimos 7 días
    const dates = Object.keys(dailyTotals).slice(-7);
    const values = dates.map(date => dailyTotals[date]);
    
    return {
      labels: dates.length > 0 ? dates : ['Sin datos'],
      datasets: [{
        data: values.length > 0 ? values : [0],
      }],
    };
  }, [expenses]);

  // Calcular estadísticas generales
  const totalExpenses = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
  const expenseCount = expenses.length;
  const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;
  const highestExpense = expenseCount > 0
    ? (expenses.length === 1 ? expenses[0].amount : Math.max(...expenses.map((e: Expense) => e.amount)))
    : 0;

  // Insights
  const mostFrequentCategory = useMemo(() => {
    const categoryCounts: { [key in ExpenseCategory]?: number } = {};
    expenses.forEach((e: Expense) => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });
    
    let maxCategory: ExpenseCategory | null = null;
    let maxCount = 0;
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxCategory = category as ExpenseCategory;
      }
    });
    
    return maxCategory ? CategoryLabels[maxCategory] : 'N/A';
  }, [expenses]);

  const averagePerDay = useMemo(() => {
    if (expenses.length === 0) return 0;
    
    const dates = expenses.map((e: Expense) => {
      const date = e.date instanceof Date ? e.date : new Date(e.date);
      return date.toDateString();
    });
    
    const uniqueDays = new Set(dates).size;
    return uniqueDays > 0 ? expenses.length / uniqueDays : 0;
  }, [expenses]);

  const activeParticipants = useMemo(() => {
    const participantIds = new Set(expenses.map((e: Expense) => e.paidBy));
    return participantIds.size;
  }, [expenses]);

  const chartConfig = {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.isDark ? `rgba(147, 51, 234, ${opacity})` : `rgba(98, 0, 238, ${opacity})`,
    labelColor: (opacity = 1) => {
      const color = theme.isDark ? '255, 255, 255' : '0, 0, 0';
      return `rgba(${color}, ${opacity})`;
    },
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.isDark ? '#9333ea' : theme.colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid line
      stroke: theme.colors.border,
      strokeWidth: 1,
    },
  };

  return (
    <ScrollView style={styles.container}>
      {/* Estadísticas generales */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{totalExpenses.toFixed(2)} {currency}</Text>
          <Text style={styles.statLabel}>{t('statistics.totalSpent')}</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{expenseCount}</Text>
          <Text style={styles.statLabel}>{t('statistics.expenses')}</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{averageExpense.toFixed(2)} {currency}</Text>
          <Text style={styles.statLabel}>{t('statistics.average')}</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{highestExpense.toFixed(2)} {currency}</Text>
          <Text style={styles.statLabel}>{t('statistics.highest')}</Text>
        </Card>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'categories' && styles.tabActive]}
          onPress={() => setSelectedTab('categories')}
        >
          <Text style={[styles.tabText, selectedTab === 'categories' && styles.tabTextActive]}>
            {t('statistics.categories')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'participants' && styles.tabActive]}
          onPress={() => setSelectedTab('participants')}
        >
          <Text style={[styles.tabText, selectedTab === 'participants' && styles.tabTextActive]}>
            {t('statistics.topParticipants')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'timeline' && styles.tabActive]}
          onPress={() => setSelectedTab('timeline')}
        >
          <Text style={[styles.tabText, selectedTab === 'timeline' && styles.tabTextActive]}>
            {t('statistics.timeline')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Gráficos */}
      <Card style={styles.chartCard}>
        {selectedTab === 'categories' && categoryData.length > 0 && (
          <View>
            <Text style={styles.chartTitle}>{t('statistics.byCategory')}</Text>
            <PieChart
              data={categoryData}
              width={screenWidth - 48}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {selectedTab === 'participants' && participantData.labels.length > 0 && (
          <View>
            <Text style={styles.chartTitle}>{t('statistics.top5')}</Text>
            <BarChart
              data={participantData}
              width={screenWidth - 48}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              showValuesOnTopOfBars
              fromZero
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        )}

        {selectedTab === 'timeline' && timelineData.labels.length > 0 && (
          <View>
            <Text style={styles.chartTitle}>{t('statistics.trend')}</Text>
            <LineChart
              data={timelineData}
              width={screenWidth - 48}
              height={220}
              chartConfig={chartConfig}
              bezier
              fromZero
            />
          </View>
        )}

        {((selectedTab === 'categories' && categoryData.length === 0) ||
          (selectedTab === 'participants' && participantData.labels.length === 0) ||
          (selectedTab === 'timeline' && timelineData.labels.length === 0)) && (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>{t('statistics.noData')}</Text>
          </View>
        )}
      </Card>

      {/* Insights */}
      <Card style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>{t('statistics.insights')}</Text>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>{t('statistics.mostFrequent')}</Text>
          <Text style={styles.insightValue}>{mostFrequentCategory}</Text>
        </View>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>{t('statistics.perDay')}</Text>
          <Text style={styles.insightValue}>{averagePerDay.toFixed(1)}</Text>
        </View>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>{t('statistics.activeParticipants')}</Text>
          <Text style={styles.insightValue}>{activeParticipants} {t('statistics.of')} {participants.length}</Text>
        </View>
      </Card>
    </ScrollView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.card,
    fontWeight: '600',
  },
  chartCard: {
    margin: 16,
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  emptyChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.subtext,
  },
  insightsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  insightLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
