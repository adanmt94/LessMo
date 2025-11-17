/**
 * Componente ExpenseItem - Item de lista de gastos
 * Generado con estilo Lovable.dev
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Expense, CategoryLabels, CategoryColors, CurrencySymbols, Currency } from '../../types';
import { Card } from './Card';
import { useTheme } from '../../context/ThemeContext';

interface ExpenseItemProps {
  expense: Expense;
  participantName: string;
  currency: Currency;
  onPress?: () => void;
  onDelete?: () => void;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  participantName,
  currency,
  onPress,
  onDelete,
}) => {
  const { theme } = useTheme();
  const categoryColor = CategoryColors[expense.category];
  const categoryLabel = CategoryLabels[expense.category];
  const currencySymbol = CurrencySymbols[currency];
  const styles = getStyles(theme);

  const formatDate = (date: Date) => {
    // Manejar timestamps de Firestore
    let d: Date;
    if (date && typeof date === 'object' && 'seconds' in date) {
      // Es un Timestamp de Firestore
      d = new Date((date as any).seconds * 1000);
    } else {
      d = new Date(date);
    }
    
    // Verificar si la fecha es válida
    if (isNaN(d.getTime())) {
      return 'Fecha inválida';
    }
    
    return d.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric' 
    });
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    if (!onDelete) return null;

    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
      >
        <Animated.View
          style={[
            styles.deleteButtonInner,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
          <Text style={styles.deleteButtonLabel}>Eliminar</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const content = (
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

  if (onDelete) {
    return (
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
      >
        {content}
      </Swipeable>
    );
  }

  return content;
};

const getStyles = (theme: any) => StyleSheet.create({
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
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  description: {
    fontSize: 16,
    color: theme.colors.text,
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
    color: theme.colors.textSecondary,
  },
  date: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginBottom: 12,
    borderRadius: 12,
  },
  deleteButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  deleteButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  deleteButtonLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
