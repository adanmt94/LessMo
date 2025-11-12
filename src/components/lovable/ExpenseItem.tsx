/**
 * Componente ExpenseItem - Item de lista de gastos
 * Generado con estilo Lovable.dev
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Expense, CategoryLabels, CategoryColors, CurrencySymbols, Currency } from '../../types';
import { Card } from './Card';

interface ExpenseItemProps {
  expense: Expense;
  participantName: string;
  currency: Currency;
  onPress?: () => void;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  participantName,
  currency,
  onPress,
}) => {
  const categoryColor = CategoryColors[expense.category];
  const categoryLabel = CategoryLabels[expense.category];
  const currencySymbol = CurrencySymbols[currency];

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric' 
    });
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.categoryContainer}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
            <Text style={styles.categoryText}>{categoryLabel}</Text>
          </View>
          <Text style={styles.amount}>
            {currencySymbol}{expense.amount.toFixed(2)}
          </Text>
        </View>

        <Text style={styles.description}>{expense.description}</Text>

        <View style={styles.footer}>
          <Text style={styles.participant}>Pagado por {participantName}</Text>
          <Text style={styles.date}>{formatDate(expense.date)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participant: {
    fontSize: 12,
    color: '#6B7280',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
