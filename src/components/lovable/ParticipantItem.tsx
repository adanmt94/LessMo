/**
 * Componente ParticipantItem - Item de lista de participantes
 * Generado con estilo Lovable.dev
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Participant, CurrencySymbols, Currency } from '../../types';
import { Card } from './Card';

interface ParticipantItemProps {
  participant: Participant;
  currency: Currency;
}

export const ParticipantItem: React.FC<ParticipantItemProps> = ({
  participant,
  currency,
}) => {
  const currencySymbol = CurrencySymbols[currency];
  
  // Calcular porcentaje - manejar caso cuando individualBudget es 0
  const balancePercentage = participant.individualBudget > 0 
    ? (participant.currentBalance / participant.individualBudget) * 100 
    : 0;
  
  const getBalanceColor = () => {
    if (participant.individualBudget === 0) return '#6B7280'; // Gris si no hay presupuesto
    if (balancePercentage > 50) return '#10B981'; // Verde
    if (balancePercentage > 20) return '#F59E0B'; // Naranja
    return '#EF4444'; // Rojo
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {participant.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{participant.name}</Text>
            {participant.email && (
              <Text style={styles.email}>{participant.email}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.budgetContainer}>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Presupuesto inicial</Text>
          <Text style={styles.budgetValue}>
            {currencySymbol}{participant.individualBudget.toFixed(2)}
          </Text>
        </View>

        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Saldo actual</Text>
          <Text style={[styles.budgetValue, { color: getBalanceColor() }]}>
            {currencySymbol}{participant.currentBalance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.max(0, Math.min(100, balancePercentage))}%`,
              backgroundColor: getBalanceColor(),
            },
          ]}
        />
      </View>
      <Text style={styles.percentageText}>
        {participant.individualBudget > 0 
          ? `${balancePercentage.toFixed(0)}% restante`
          : 'Sin presupuesto asignado'}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    marginBottom: 12,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  email: {
    fontSize: 12,
    color: '#6B7280',
  },
  budgetContainer: {
    marginBottom: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
});
