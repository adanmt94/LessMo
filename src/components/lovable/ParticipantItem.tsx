/**
 * Componente ParticipantItem - Item de lista de participantes
 * Generado con estilo Lovable.dev
 * Optimizado con React.memo
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Participant, CurrencySymbols, Currency } from '../../types';
import { Card } from './Card';
import { useTheme } from '../../context/ThemeContext';

interface ParticipantItemProps {
  participant: Participant;
  currency: Currency;
  totalPaid?: number;
  totalOwed?: number;
  balance?: number;
}

const ParticipantItemComponent: React.FC<ParticipantItemProps> = ({
  participant,
  currency,
  totalPaid,
  totalOwed,
  balance,
}) => {
  const { theme } = useTheme();
  const currencySymbol = CurrencySymbols[currency];
  const styles = getStyles(theme);
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  
  // Debug: Log para ver si llega photoURL
  React.useEffect(() => {
    console.log('👤 ParticipantItem renderizado:', {
      name: participant.name,
      hasPhotoURL: !!participant.photoURL,
      photoURL: participant.photoURL,
      userId: participant.userId
    });
    // Reset error state cuando cambia el participante
    setImageError(false);
    setImageLoading(true);
  }, [participant.photoURL, participant.id]);
  
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
          <View style={[styles.avatar, { backgroundColor: imageError || !participant.photoURL ? theme.colors.primary : 'transparent' }]}>
            {participant.photoURL && !imageError ? (
              <Image 
                source={{ uri: participant.photoURL }} 
                style={styles.avatarImage}
                resizeMode="cover"
                onError={(e) => {
                  console.error('❌ Error al cargar imagen de', participant.name, ':', participant.photoURL);
                  console.error('Error details:', e.nativeEvent?.error);
                  setImageError(true);
                  setImageLoading(false);
                }}
                onLoadStart={() => {
                  console.log('🔄 Iniciando carga de imagen para', participant.name);
                  setImageLoading(true);
                }}
                onLoad={() => {
                  console.log('✅ Imagen cargada correctamente para', participant.name);
                  setImageLoading(false);
                  setImageError(false);
                }}
              />
            ) : (
              <Text style={styles.avatarText}>
                {participant.name.charAt(0).toUpperCase()}
              </Text>
            )}
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

const getStyles = (theme: any) => StyleSheet.create({
  card: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    marginBottom: 12,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: theme.colors.card,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  email: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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
    color: theme.colors.textSecondary,
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  budgetLabelBold: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  budgetValueBold: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
  },
  balanceDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.disabled,
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
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
});

// Función de comparación para React.memo
const areEqual = (prevProps: ParticipantItemProps, nextProps: ParticipantItemProps) => {
  return (
    prevProps.participant.id === nextProps.participant.id &&
    prevProps.participant.name === nextProps.participant.name &&
    prevProps.participant.photoURL === nextProps.participant.photoURL &&
    prevProps.participant.currentBalance === nextProps.participant.currentBalance &&
    prevProps.participant.individualBudget === nextProps.participant.individualBudget &&
    prevProps.currency === nextProps.currency &&
    prevProps.totalPaid === nextProps.totalPaid &&
    prevProps.totalOwed === nextProps.totalOwed &&
    prevProps.balance === nextProps.balance
  );
};

// Exportar componente memoizado
export const ParticipantItem = memo(ParticipantItemComponent, areEqual);
