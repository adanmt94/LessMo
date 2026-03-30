/**
 * IndividualExpensesScreen - Pantalla de gastos individuales (sin eventos)
 * Muestra los gastos que no están asociados a ningún evento
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  ActionSheetIOS,
  Platform,
  TextInput,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Expense, RootStackParamList, AllCategoryLabels } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Gradients, Spacing, Radius, Shadows, Typography } from '../theme/designSystem';

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = expenses.filter((expense) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const desc = (expense.description || '').toLowerCase();
    const name = (expense.name || '').toLowerCase();
    const cat = (AllCategoryLabels[expense.category] || '').toLowerCase();
    return desc.includes(q) || name.includes(q) || cat.includes(q);
  });

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

  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    Alert.alert(
      t('common.confirm'),
      t('eventDetail.deleteExpenseConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'expenses', expenseId));
              setExpenses(prev => prev.filter(e => e.id !== expenseId));
            } catch (error) {
              Alert.alert(t('common.error'), 'No se pudo eliminar el gasto');
            }
          },
        },
      ]
    );
  }, [t]);

  const handleEditExpense = useCallback((expenseId: string) => {
    navigation.navigate('AddExpense', {
      eventId: 'individual',
      expenseId,
      mode: 'edit',
    });
  }, [navigation]);

  const handleLongPress = useCallback((item: Expense) => {
    const options = [
      t('common.edit'),
      t('common.delete'),
      t('common.cancel'),
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
          title: item.description || item.name,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) handleEditExpense(item.id);
          if (buttonIndex === 1) handleDeleteExpense(item.id);
        }
      );
    } else {
      Alert.alert(item.description || item.name, '', [
        { text: t('common.edit'), onPress: () => handleEditExpense(item.id) },
        { text: t('common.delete'), style: 'destructive', onPress: () => handleDeleteExpense(item.id) },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  }, [handleEditExpense, handleDeleteExpense, t]);

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

  const renderRightActions = (expenseId: string) => (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#EF4444',
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
          marginBottom: 12,
        }}
        onPress={() => handleDeleteExpense(expenseId)}
      >
        <Animated.View style={{ transform: [{ translateX: trans }], alignItems: 'center' }}>
          <Text style={{ fontSize: 22 }}>🗑️</Text>
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600', marginTop: 4 }}>{t('common.delete')}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (expenseId: string) => (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [-80, 0],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          marginBottom: 12,
        }}
        onPress={() => handleEditExpense(expenseId)}
      >
        <Animated.View style={{ transform: [{ translateX: trans }], alignItems: 'center' }}>
          <Text style={{ fontSize: 22 }}>✏️</Text>
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600', marginTop: 4 }}>{t('common.edit')}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const isIncome = item.type === 'income';
    return (
    <Swipeable
      renderRightActions={renderRightActions(item.id)}
      renderLeftActions={renderLeftActions(item.id)}
      overshootRight={false}
      overshootLeft={false}
    >
    <TouchableOpacity
      style={styles.expenseCard}
      activeOpacity={0.7}
      onPress={() => handleEditExpense(item.id)}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={400}
    >
      <View style={styles.expenseHeader}>
        <View style={styles.expenseIconContainer}>
          <Text style={styles.expenseIcon}>{isIncome ? '📈' : '💰'}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.expenseAmountContainer}>
          <Text style={[styles.expenseAmount, isIncome ? { color: '#10B981' } : { color: '#EF4444' }]}>
            {isIncome ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
          </Text>
        </View>
      </View>
      {item.category && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{AllCategoryLabels[item.category] || item.category}</Text>
        </View>
      )}
    </TouchableOpacity>
    </Swipeable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⚡</Text>
      <Text style={styles.emptyTitle}>No tienes gastos rápidos</Text>
      <Text style={styles.emptyDescription}>
        Los gastos rápidos son tus gastos personales del día a día, sin necesidad de crear un evento.
      </Text>
      <Text style={styles.emptyHint}>
        Pulsa el botón de abajo para crear tu primer gasto rápido.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={theme.isDark ? [theme.colors.card, theme.colors.background] : Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Text style={styles.headerTitle}>Gastos Rápidos</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={theme.isDark ? [theme.colors.card, theme.colors.background] : Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <Text style={styles.headerTitle}>Gastos Rápidos</Text>
        <View style={styles.headerStats}>
          <View style={styles.statPill}>
            <Text style={styles.headerStatsText}>
              {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search') || 'Buscar...'}
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <FlatList
        data={filteredExpenses}
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
        <Text style={styles.floatingButtonIcon}>⚡</Text>
        <Text style={styles.floatingButtonText}>Crear Gasto Rápido</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerTitle: {
    ...Typography.title1,
    color: theme.isDark ? theme.colors.text : '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.round,
  },
  headerStatsText: {
    ...Typography.subhead,
    color: theme.isDark ? theme.colors.textSecondary : 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
  },
  searchClear: {
    padding: 4,
    marginLeft: 4,
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
