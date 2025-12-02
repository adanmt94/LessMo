/**
 * Componente ExpenseItem - Item de lista de gastos
 * Generado con estilo Lovable.dev
 * Optimizado con React.memo
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Expense, CategoryLabels, CategoryColors, CurrencySymbols, Currency } from '../../types';
import { Card } from './Card';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface ExpenseItemProps {
  expense: Expense;
  participantName: string;
  participantPhoto?: string;
  currency: Currency;
  onPress?: () => void;
  onDelete?: () => void;
}

const ExpenseItemComponent: React.FC<ExpenseItemProps> = ({
  expense,
  participantName,
  participantPhoto,
  currency,
  onPress,
  onDelete,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
          <Text style={styles.deleteButtonLabel}>{t('common.delete')}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const content = (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.categoryContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20', borderColor: categoryColor }]}>
              <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
              <Text style={[styles.categoryText, { color: categoryColor }]}>{categoryLabel}</Text>
            </View>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>
              {currencySymbol}{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>{expense.description}</Text>

        {expense.receiptPhoto && (
          <TouchableOpacity 
            style={styles.receiptPhotoContainer}
            onPress={() => {
              // Modal o navegación para ver foto completa
            }}
          >
            <Image 
              source={{ uri: expense.receiptPhoto }} 
              style={styles.receiptThumbnail}
              resizeMode="cover"
            />
            <Text style={styles.receiptLabel}>📷 Ver recibo</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <View style={styles.participantInfo}>
            {participantPhoto && (
              <Image 
                source={{ uri: participantPhoto }} 
                style={styles.participantAvatar}
              />
            )}
            <Text style={styles.participant}>Pagado por {participantName}</Text>
          </View>
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: -0.8,
  },
  description: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 10,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: theme.colors.border,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  participant: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  date: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    fontWeight: '500',
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
  receiptPhotoContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.inputBackground,
  },
  receiptThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.border,
  },
  receiptLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    padding: 6,
    textAlign: 'center',
    backgroundColor: theme.colors.inputBackground,
  },
});

// Función de comparación para React.memo
const areEqual = (prevProps: ExpenseItemProps, nextProps: ExpenseItemProps) => {
  return (
    prevProps.expense.id === nextProps.expense.id &&
    prevProps.expense.description === nextProps.expense.description &&
    prevProps.expense.amount === nextProps.expense.amount &&
    prevProps.expense.category === nextProps.expense.category &&
    prevProps.participantName === nextProps.participantName &&
    prevProps.participantPhoto === nextProps.participantPhoto &&
    prevProps.currency === nextProps.currency
  );
};

// Exportar componente memoizado
export const ExpenseItem = memo(ExpenseItemComponent, areEqual);
