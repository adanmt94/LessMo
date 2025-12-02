/**
 * BudgetPredictionCard - Muestra predicciones y alertas de presupuesto
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BudgetPrediction, SpendingInsight } from '../services/budgetPredictionService';

interface Props {
  prediction: BudgetPrediction;
  insights: SpendingInsight[];
  onViewDetails?: () => void;
}

export function BudgetPredictionCard({ prediction, insights, onViewDetails }: Props) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    icon: {
      fontSize: 24,
      marginRight: 12,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.text,
      flex: 1,
    },
    confidenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    confidenceText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    predictionText: {
      fontSize: 15,
      color: theme.colors.text,
      marginBottom: 12,
      lineHeight: 22,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    statBox: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    alertsContainer: {
      gap: 8,
      marginBottom: 12,
    },
    alert: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 12,
      borderRadius: 12,
      gap: 10,
    },
    alertDanger: {
      backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
    },
    alertWarning: {
      backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.2)',
    },
    alertInfo: {
      backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
    },
    alertIcon: {
      fontSize: 18,
    },
    alertText: {
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
      lineHeight: 20,
    },
    alertTextDanger: {
      color: theme.isDark ? '#FCA5A5' : '#DC2626',
    },
    alertTextWarning: {
      color: theme.isDark ? '#FCD34D' : '#D97706',
    },
    alertTextInfo: {
      color: theme.isDark ? '#93C5FD' : '#2563EB',
    },
    insightsContainer: {
      gap: 8,
      marginTop: 8,
    },
    insightTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    insight: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surface,
      padding: 10,
      borderRadius: 10,
      gap: 8,
    },
    insightIcon: {
      fontSize: 16,
    },
    insightTextContainer: {
      flex: 1,
    },
    insightCategory: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    insightSuggestion: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    insightSavings: {
      fontSize: 14,
      fontWeight: '700',
      color: '#10B981',
    },
    viewDetailsButton: {
      marginTop: 12,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    viewDetailsText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      food: '🍽️',
      transport: '🚗',
      accommodation: '🏨',
      entertainment: '🎭',
      shopping: '🛍️',
    };
    return icons[category] || '📦';
  };

  const getCategoryName = (category: string): string => {
    const names: { [key: string]: string } = {
      food: 'Comida',
      transport: 'Transporte',
      accommodation: 'Alojamiento',
      entertainment: 'Entretenimiento',
      shopping: 'Compras',
    };
    return names[category] || category;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>🤖</Text>
        <Text style={styles.title}>Predicción IA</Text>
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceText}>
            {Math.round(prediction.confidence * 100)}% confianza
          </Text>
        </View>
      </View>

      <Text style={styles.predictionText}>{prediction.suggestion}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{prediction.dailyAverage.toFixed(0)}€</Text>
          <Text style={styles.statLabel}>/ día actual</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, prediction.willExceed && { color: '#EF4444' }]}>
            {prediction.projectedTotal.toFixed(0)}€
          </Text>
          <Text style={styles.statLabel}>proyectado</Text>
        </View>
        {prediction.daysUntilExceeded !== undefined && (
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>
              {prediction.daysUntilExceeded}
            </Text>
            <Text style={styles.statLabel}>días hasta exceder</Text>
          </View>
        )}
      </View>

      {prediction.alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          {prediction.alerts.map((alert, index) => (
            <View
              key={index}
              style={[
                styles.alert,
                alert.type === 'danger' && styles.alertDanger,
                alert.type === 'warning' && styles.alertWarning,
                alert.type === 'info' && styles.alertInfo,
              ]}
            >
              <Text style={styles.alertIcon}>{alert.icon}</Text>
              <Text
                style={[
                  styles.alertText,
                  alert.type === 'danger' && styles.alertTextDanger,
                  alert.type === 'warning' && styles.alertTextWarning,
                  alert.type === 'info' && styles.alertTextInfo,
                ]}
              >
                {alert.message}
              </Text>
            </View>
          ))}
        </View>
      )}

      {insights.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightTitle}>💡 Sugerencias de ahorro</Text>
          {insights.slice(0, 2).map((insight, index) => (
            <View key={index} style={styles.insight}>
              <Text style={styles.insightIcon}>{getCategoryIcon(insight.category)}</Text>
              <View style={styles.insightTextContainer}>
                <Text style={styles.insightCategory}>{getCategoryName(insight.category)}</Text>
                <Text style={styles.insightSuggestion}>{insight.suggestion}</Text>
              </View>
              <Text style={styles.insightSavings}>-{insight.savings.toFixed(0)}€</Text>
            </View>
          ))}
        </View>
      )}

      {onViewDetails && (
        <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails}>
          <Text style={styles.viewDetailsText}>Ver análisis completo →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
