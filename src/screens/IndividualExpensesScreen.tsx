/**
 * IndividualExpensesScreen - Pantalla de gastos individuales (sin eventos)
 * Muestra los gastos que no están asociados a ningún evento
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Expense, RootStackParamList } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const IndividualExpensesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const styles = getStyles(theme);
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadIndividualExpenses();
    }
  }, [user]);

  const loadIndividualExpenses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Obtener gastos sin eventId o con eventId vacío
      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('paidBy', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const allExpenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      
      // Filtrar solo los que NO tienen eventId
      const individualExpenses = allExpenses.filter(expense => !expense.eventId);
      
      setExpenses(individualExpenses);
    } catch (error) {
      console.error('Error loading individual expenses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadIndividualExpenses();
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: any) => {
    try {
      const dateObj = date?.toDate ? date.toDate() : new Date(date);
      return format(dateObj, "d 'de' MMMM, yyyy", { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity style={styles.expenseCard} activeOpacity={0.7}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseIconContainer}>
          <Text style={styles.expenseIcon}>💰</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.expenseAmountContainer}>
          <Text style={styles.expenseAmount}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
        </View>
      </View>
      {item.category && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No tienes gastos individuales</Text>
      <Text style={styles.emptyDescription}>
        Los gastos individuales son aquellos que no están asociados a ningún evento.
      </Text>
      <Text style={styles.emptyHint}>
        Para crear gastos individuales, añádelos sin seleccionar un evento.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mis Gastos Individuales</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Gastos Individuales</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>
            {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}
          </Text>
        </View>
      </View>
      
      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          expenses.length === 0 && styles.listContentEmpty,
          { paddingBottom: 100 }
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {/* Botón flotante para añadir gasto individual */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          // Navegar a AddExpense SIN eventId para crear gasto individual
          navigation.navigate('AddExpense', { 
            eventId: 'individual',
            mode: 'create'
          });
        }}
      >
        <Text style={styles.floatingButtonIcon}>+</Text>
        <Text style={styles.floatingButtonText}>Añadir Gasto</Text>
      </TouchableOpacity>
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
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStatsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flex: 1,
  },
  expenseCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expenseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.isDark ? theme.colors.surface : theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseIcon: {
    fontSize: 24,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  categoryBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: theme.isDark ? theme.colors.surface : theme.colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  emptyHint: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.card,
    marginRight: 8,
  },
  floatingButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.card,
  },
});
