/**
 * Bank Transactions Screen
 * Show detected transactions and suggest matches with existing expenses
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  BankAccount,
  BankTransaction,
  TransactionMatch,
  fetchBankTransactions,
  findTransactionMatches,
  confirmTransactionMatch,
  getUnmatchedTransactions,
  transactionToExpenseSuggestion,
} from '../services/bankingService';
import { Event, Expense } from '../types';

interface BankTransactionsScreenProps {
  navigation: any;
  route: {
    params: {
      account: BankAccount;
      event: Event;
      expenses: Expense[];
      onExpenseCreated?: (expense: Partial<Expense>) => void;
    };
  };
}

export const BankTransactionsScreen: React.FC<BankTransactionsScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const language = currentLanguage.code as 'es' | 'en';
  const { account, event, expenses, onExpenseCreated } = route.params;

  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [matches, setMatches] = useState<TransactionMatch[]>([]);
  const [unmatchedTx, setUnmatchedTx] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'unmatched'>('matches');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // Usar fechas del evento o defaults (últimos 30 días)
      const now = new Date();
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const startDate = event.startDate ? new Date(event.startDate) : defaultStart;
      const endDate = event.endDate ? new Date(event.endDate) : now;
      
      const txList = await fetchBankTransactions(account.id, startDate, endDate);
      setTransactions(txList);
      
      const matchList = findTransactionMatches(txList, expenses, event);
      setMatches(matchList);
      
      const unmatchedList = getUnmatchedTransactions(txList, matchList);
      setUnmatchedTx(unmatchedList);
    } catch (error) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es'
          ? 'No se pudieron cargar las transacciones'
          : 'Could not load transactions'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTransactions();
    setIsRefreshing(false);
  };

  const handleConfirmMatch = async (match: TransactionMatch) => {
    Alert.alert(
      language === 'es' ? 'Confirmar coincidencia' : 'Confirm match',
      language === 'es'
        ? `¿Vincular transacción de ${Math.abs(match.transaction.amount)}€ con gasto "${match.expense.description}"?`
        : `Link transaction of ${Math.abs(match.transaction.amount)}€ with expense "${match.expense.description}"?`,
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'es' ? 'Confirmar' : 'Confirm',
          onPress: async () => {
            try {
              await confirmTransactionMatch(match.transaction.id, match.expense.id);
              Alert.alert(
                language === 'es' ? '✅ Vinculado' : '✅ Linked',
                language === 'es'
                  ? 'La transacción ha sido vinculada al gasto'
                  : 'Transaction has been linked to expense'
              );
              await loadTransactions();
            } catch (error) {
              Alert.alert(
                language === 'es' ? 'Error' : 'Error',
                language === 'es'
                  ? 'No se pudo vincular la transacción'
                  : 'Could not link transaction'
              );
            }
          },
        },
      ]
    );
  };

  const handleCreateFromTransaction = (transaction: BankTransaction) => {
    const suggestion = transactionToExpenseSuggestion(
      transaction,
      event,
      expenses[0]?.paidBy || '' // Use first expense paidBy as default
    );

    Alert.alert(
      language === 'es' ? 'Crear gasto' : 'Create expense',
      language === 'es'
        ? `¿Crear un nuevo gasto de ${Math.abs(transaction.amount)}€ para "${transaction.merchantName || transaction.description}"?`
        : `Create a new expense of ${Math.abs(transaction.amount)}€ for "${transaction.merchantName || transaction.description}"?`,
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'es' ? 'Crear' : 'Create',
          onPress: () => {
            if (onExpenseCreated) {
              onExpenseCreated(suggestion);
            }
            Alert.alert(
              language === 'es' ? '✅ Gasto creado' : '✅ Expense created',
              language === 'es'
                ? 'El gasto ha sido creado desde la transacción'
                : 'Expense has been created from transaction'
            );
            navigation.goBack();
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10B981';
    if (confidence >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const renderMatchCard = (match: TransactionMatch) => {
    return (
      <View
        key={match.transaction.id}
        style={[
          styles.matchCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {/* Confidence Badge */}
        <View
          style={[
            styles.confidenceBadge,
            { backgroundColor: getConfidenceColor(match.confidence) },
          ]}
        >
          <Text style={styles.confidenceText}>{Math.round(match.confidence)}%</Text>
        </View>

        {/* Transaction Info */}
        <View style={styles.transactionInfo}>
          <Text style={[styles.merchantName, { color: theme.colors.text }]}>
            {match.transaction.merchantName || match.transaction.description}
          </Text>
          <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
            {formatDate(match.transaction.date)}
          </Text>
          <Text style={[styles.amount, { color: '#EF4444' }]}>
            {Math.abs(match.transaction.amount).toFixed(2)}€
          </Text>
        </View>

        {/* Match Arrow */}
        <View style={styles.matchArrow}>
          <Text style={{ fontSize: 24 }}>↔️</Text>
        </View>

        {/* Expense Info */}
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDescription, { color: theme.colors.text }]}>
            {match.expense.description}
          </Text>
          <Text style={[styles.expenseDate, { color: theme.colors.textSecondary }]}>
            {formatDate(match.expense.date)}
          </Text>
          <Text style={[styles.amount, { color: '#10B981' }]}>
            {match.expense.amount.toFixed(2)}€
          </Text>
        </View>

        {/* Match Reasons */}
        <View style={styles.reasonsContainer}>
          {match.matchReasons.map((reason, index) => (
            <View
              key={index}
              style={[
                styles.reasonBadge,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(99, 102, 241, 0.2)'
                    : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
            >
              <Text style={[styles.reasonText, { color: '#6366F1' }]}>
                ✓ {reason}
              </Text>
            </View>
          ))}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: '#10B981' }]}
          onPress={() => handleConfirmMatch(match)}
        >
          <Text style={styles.confirmButtonText}>
            {language === 'es' ? '✓ Confirmar coincidencia' : '✓ Confirm match'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderUnmatchedCard = (transaction: BankTransaction) => {
    return (
      <View
        key={transaction.id}
        style={[
          styles.unmatchedCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.unmatchedInfo}>
          <Text style={[styles.merchantName, { color: theme.colors.text }]}>
            {transaction.merchantName || transaction.description}
          </Text>
          <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
            {formatDate(transaction.date)}
          </Text>
          {transaction.category && (
            <Text style={[styles.category, { color: theme.colors.textSecondary }]}>
              📂 {transaction.category}
            </Text>
          )}
        </View>
        <View style={styles.unmatchedActions}>
          <Text style={[styles.amount, { color: '#EF4444' }]}>
            {Math.abs(transaction.amount).toFixed(2)}€
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#6366F1' }]}
            onPress={() => handleCreateFromTransaction(transaction)}
          >
            <Text style={styles.createButtonText}>
              {language === 'es' ? '+ Crear gasto' : '+ Create expense'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {language === 'es' ? '🔍 Transacciones Detectadas' : '🔍 Detected Transactions'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {account.accountName}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'matches' && {
              borderBottomColor: '#6366F1',
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setActiveTab('matches')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'matches' ? '#6366F1' : theme.colors.textSecondary,
              },
            ]}
          >
            {language === 'es' ? `💡 Coincidencias (${matches.length})` : `💡 Matches (${matches.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'unmatched' && {
              borderBottomColor: '#6366F1',
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setActiveTab('unmatched')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'unmatched' ? '#6366F1' : theme.colors.textSecondary,
              },
            ]}
          >
            {language === 'es' ? `📋 Sin vincular (${unmatchedTx.length})` : `📋 Unmatched (${unmatchedTx.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {language === 'es' ? 'Analizando transacciones...' : 'Analyzing transactions...'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {activeTab === 'matches' ? (
            matches.length > 0 ? (
              matches.map(renderMatchCard)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {language === 'es'
                    ? 'No se encontraron coincidencias automáticas'
                    : 'No automatic matches found'}
                </Text>
              </View>
            )
          ) : (
            unmatchedTx.length > 0 ? (
              unmatchedTx.map(renderUnmatchedCard)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {language === 'es'
                    ? 'Todas las transacciones están vinculadas'
                    : 'All transactions are linked'}
                </Text>
              </View>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
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
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  matchCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
  },
  confidenceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  transactionInfo: {
    marginBottom: 12,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    marginBottom: 6,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  matchArrow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  expenseInfo: {
    marginBottom: 12,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 13,
    marginBottom: 6,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  reasonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confirmButton: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  unmatchedCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unmatchedInfo: {
    flex: 1,
  },
  category: {
    fontSize: 12,
    marginTop: 4,
  },
  unmatchedActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
