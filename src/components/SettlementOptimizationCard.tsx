/**
 * Settlement Optimization Card
 * Shows comparison between traditional and optimized settlements
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  OptimizationResult,
  Settlement,
  getSettlementInstructions,
} from '../services/settlementOptimizationService';

interface SettlementOptimizationCardProps {
  optimization: OptimizationResult;
  onSelectSettlement?: (settlement: Settlement) => void;
  currentUserId?: string;
  currentUserName?: string;
  currentUserEmail?: string;
  currentUserDisplayName?: string;
  currentUserFirstName?: string;
}

export const SettlementOptimizationCard: React.FC<SettlementOptimizationCardProps> = ({
  optimization,
  onSelectSettlement,
  currentUserId,
  currentUserName,
  currentUserEmail,
  currentUserDisplayName,
  currentUserFirstName,
}) => {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const language = currentLanguage.code as 'es' | 'en';
  const [showComparison, setShowComparison] = useState(false);
  const [useOptimized, setUseOptimized] = useState(true);

  const settlements = useOptimized ? optimization.optimized : optimization.traditional;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {language === 'es' ? '⚡ Liquidación Optimizada' : '⚡ Optimized Settlement'}
            </Text>
            {optimization.savings.transactionsSaved > 0 && (
              <View style={[styles.savingsBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.savingsText}>
                  {language === 'es'
                    ? `Ahorra ${optimization.savings.transactionsSaved} transacciones`
                    : `Save ${optimization.savings.transactionsSaved} transactions`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              !useOptimized && {
                backgroundColor: theme.isDark
                  ? 'rgba(99, 102, 241, 0.2)'
                  : 'rgba(99, 102, 241, 0.1)',
                borderColor: '#6366F1',
              },
            ]}
            onPress={() => setUseOptimized(false)}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color: !useOptimized ? '#6366F1' : theme.colors.textSecondary,
                  fontWeight: !useOptimized ? '600' : '400',
                },
              ]}
            >
              {language === 'es' ? 'Tradicional' : 'Traditional'} ({optimization.traditional.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              useOptimized && {
                backgroundColor: theme.isDark
                  ? 'rgba(99, 102, 241, 0.2)'
                  : 'rgba(99, 102, 241, 0.1)',
                borderColor: '#6366F1',
              },
            ]}
            onPress={() => setUseOptimized(true)}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color: useOptimized ? '#6366F1' : theme.colors.textSecondary,
                  fontWeight: useOptimized ? '600' : '400',
                },
              ]}
            >
              {language === 'es' ? 'Optimizada' : 'Optimized'} ({optimization.optimized.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settlements List */}
        <View style={styles.settlementsList}>
          {settlements.map((settlement, index) => {
            // PRIORIDAD: 1. userId, 2. email, 3. displayName, 4. nombre parcial
            const participantEmail = settlement.from.email?.toLowerCase();
            const participantName = settlement.from.name?.toLowerCase();
            
            const isDebtor = currentUserId && (
              settlement.from.id === currentUserId || 
              settlement.from.userId === currentUserId ||
              (participantEmail && participantEmail === currentUserEmail) || // Por email (más confiable)
              (participantName === currentUserDisplayName) || // Por displayName completo
              (participantName === currentUserFirstName) || // Por primer nombre
              (participantName === currentUserName?.toLowerCase()) // Fallback original
            );
            
            return (
              <View
                key={`${settlement.from.id}-${settlement.to.id}-${index}`}
                style={[
                  styles.settlementItem,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.02)',
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.settlementMainInfo}>
                  <View style={styles.settlementInfo}>
                    <Text style={[styles.fromName, { color: theme.colors.text }]}>
                      {settlement.from.name}
                    </Text>
                    <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>
                      →
                    </Text>
                    <Text style={[styles.toName, { color: theme.colors.text }]}>
                      {settlement.to.name}
                    </Text>
                  </View>
                  <Text style={[styles.amount, { color: '#10B981' }]}>
                    {settlement.amount.toFixed(2)}€
                  </Text>
                </View>
                
                {isDebtor && (
                  <TouchableOpacity
                    style={[styles.payButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => onSelectSettlement && onSelectSettlement(settlement)}
                  >
                    <Text style={styles.payButtonText}>💰 Realizar Pago</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Compare Button */}
        {optimization.savings.transactionsSaved > 0 && (
          <TouchableOpacity
            style={[
              styles.compareButton,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(99, 102, 241, 0.15)'
                  : 'rgba(99, 102, 241, 0.05)',
                borderColor: '#6366F1',
              },
            ]}
            onPress={() => setShowComparison(true)}
          >
            <Text style={[styles.compareButtonText, { color: '#6366F1' }]}>
              {language === 'es' ? '📊 Ver comparación detallada' : '📊 View detailed comparison'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Comparison Modal */}
      <Modal
        visible={showComparison}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComparison(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {language === 'es' ? '📊 Comparación de Liquidaciones' : '📊 Settlement Comparison'}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.card }]}
              onPress={() => setShowComparison(false)}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Savings Summary */}
            <View
              style={[
                styles.savingsSummary,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(16, 185, 129, 0.05)',
                  borderColor: '#10B981',
                },
              ]}
            >
              <Text style={styles.savingsIcon}>⚡</Text>
              <Text style={[styles.savingsSummaryTitle, { color: '#10B981' }]}>
                {language === 'es' ? 'Ahorro con optimización' : 'Savings with optimization'}
              </Text>
              <Text style={[styles.savingsSummaryValue, { color: theme.colors.text }]}>
                {optimization.savings.transactionsSaved}{' '}
                {language === 'es' ? 'transacciones menos' : 'fewer transactions'}
              </Text>
              <Text style={[styles.savingsSummaryPercentage, { color: theme.colors.textSecondary }]}>
                ({optimization.savings.percentageReduction.toFixed(0)}%{' '}
                {language === 'es' ? 'reducción' : 'reduction'})
              </Text>
            </View>

            {/* Traditional Settlements */}
            <View style={styles.comparisonSection}>
              <Text style={[styles.comparisonTitle, { color: theme.colors.text }]}>
                {language === 'es' ? '📋 Método Tradicional' : '📋 Traditional Method'} (
                {optimization.traditional.length})
              </Text>
              {optimization.traditional.map((settlement, index) => (
                <View
                  key={`trad-${index}`}
                  style={[
                    styles.comparisonItem,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.comparisonText, { color: theme.colors.text }]}>
                    {getSettlementInstructions(settlement, language)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Optimized Settlements */}
            <View style={styles.comparisonSection}>
              <Text style={[styles.comparisonTitle, { color: theme.colors.text }]}>
                {language === 'es' ? '⚡ Método Optimizado' : '⚡ Optimized Method'} (
                {optimization.optimized.length})
              </Text>
              {optimization.optimized.map((settlement, index) => (
                <View
                  key={`opt-${index}`}
                  style={[
                    styles.comparisonItem,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(16, 185, 129, 0.05)',
                      borderColor: '#10B981',
                    },
                  ]}
                >
                  <Text style={[styles.comparisonText, { color: theme.colors.text }]}>
                    {getSettlementInstructions(settlement, language)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Explanation */}
            <View
              style={[
                styles.explanation,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(99, 102, 241, 0.15)'
                    : 'rgba(99, 102, 241, 0.05)',
                  borderColor: '#6366F1',
                },
              ]}
            >
              <Text style={[styles.explanationTitle, { color: '#6366F1' }]}>
                {language === 'es' ? '💡 ¿Cómo funciona?' : '💡 How does it work?'}
              </Text>
              <Text style={[styles.explanationText, { color: theme.colors.text }]}>
                {language === 'es'
                  ? 'El algoritmo de optimización calcula el saldo neto de cada persona y minimiza las transacciones necesarias emparejando deudores con acreedores de forma inteligente. Esto reduce significativamente el número de pagos que deben realizarse.'
                  : 'The optimization algorithm calculates each person\'s net balance and minimizes necessary transactions by smartly matching debtors with creditors. This significantly reduces the number of payments that need to be made.'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    marginBottom: 12,
  },
  headerLeft: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  savingsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
  },
  settlementsList: {
    gap: 8,
    marginBottom: 12,
  },
  settlementItem: {
    flexDirection: 'column',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  settlementMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settlementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  payButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fromName: {
    fontSize: 14,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 14,
  },
  toName: {
    fontSize: 14,
    fontWeight: '600',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  compareButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  compareButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  savingsSummary: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  savingsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  savingsSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  savingsSummaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  savingsSummaryPercentage: {
    fontSize: 14,
  },
  comparisonSection: {
    gap: 8,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  comparisonItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  comparisonText: {
    fontSize: 14,
  },
  explanation: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
