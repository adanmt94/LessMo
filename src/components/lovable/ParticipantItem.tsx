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
  totalPaid?: number;
  totalOwed?: number;
  balance?: number;
}

export const ParticipantItem: React.FC<ParticipantItemProps> = ({
  participant,
  currency,
  totalPaid,
  totalOwed,
  balance,
}) => {
  const currencySymbol = CurrencySymbols[currency];
  
  // Si tenemos balance calculado (desde el resumen de gastos), usarlo
  // Si no, usar el sistema de presupuesto individual
  const showBalanceMode = balance !== undefined && totalPaid !== undefined && totalOwed !== undefined;
  
  // Calcular porcentaje - manejar caso cuando individualBudget es 0
  const balancePercentage = participant.individualBudget > 0 
    ? (participant.currentBalance / participant.individualBudget) * 100 
    : 0;
  
  const getBalanceColor = () => {
    if (showBalanceMode) {
      return balance! >= 0 ? '#10B981' : '#EF4444';
    }
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
        {showBalanceMode ? (
          <>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Pagó</Text>
              <Text style={styles.budgetValue}>
                {currencySymbol}{totalPaid!.toFixed(2)}
              </Text>
            </View>

            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Debe</Text>
              <Text style={styles.budgetValue}>
                {currencySymbol}{totalOwed!.toFixed(2)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabelBold}>Balance</Text>
              <Text style={[styles.budgetValueBold, { color: getBalanceColor() }]}>
                {balance! >= 0 ? '+' : ''}
                {currencySymbol}{balance!.toFixed(2)}
              </Text>
            </View>

            <Text style={styles.balanceDescription}>
              {balance! > 0 
                ? '💰 Le deben dinero' 
                : balance! < 0 
                  ? '💸 Tiene deudas pendientes'
                  : '✅ Está a mano'}
            </Text>
          </>
        ) : (
          <>
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
          </>
        )}
      </View>
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
  budgetLabelBold: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  budgetValueBold: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  balanceDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
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
