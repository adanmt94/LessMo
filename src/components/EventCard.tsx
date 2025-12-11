/**
 * EventCard - Componente memoizado para tarjeta de evento
 * Optimizado para listas con React.memo
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Card } from './lovable';
import { Event, CurrencySymbols } from '../types';
import { useTheme } from '../context/ThemeContext';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  showGroupBadge?: boolean;
  groupName?: string;
  style?: ViewStyle;
}

const EventCardComponent: React.FC<EventCardProps> = ({ 
  event, 
  onPress, 
  showGroupBadge = false,
  groupName,
  style 
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const currencySymbol = CurrencySymbols[event.currency];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={style || styles.card}>
        <View style={styles.header}>
          <Text style={styles.name}>{event.name}</Text>
          <View style={[
            styles.statusBadge, 
            event.status === 'active' ? styles.statusActive : styles.statusPast
          ]}>
            <Text style={styles.statusText}>
              {event.status === 'active' ? '🟢 Activo' : '⚪ Finalizado'}
            </Text>
          </View>
        </View>
        
        {event.description && (
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
        )}
        
        <View style={styles.details}>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Presupuesto</Text>
            <Text style={styles.detailValue}>
              {currencySymbol}{event.initialBudget.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Participantes</Text>
            <Text style={styles.detailValue}>
              👥 {event.participantIds?.length || 0}
            </Text>
          </View>
          
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Creado</Text>
            <Text style={styles.detailValue}>
              {(() => {
                try {
                  const date = (event.createdAt as any)?.toDate 
                    ? (event.createdAt as any).toDate() 
                    : new Date(event.createdAt);
                  return date.toLocaleDateString('es-ES', { 
                    day: 'numeric',
                    month: 'short' 
                  });
                } catch {
                  return 'N/A';
                }
              })()}
            </Text>
          </View>
        </View>

        {/* Badge de evento si corresponde */}
        {showGroupBadge && groupName && (
          <View style={styles.metaRow}>
            <View style={styles.groupBadgeInline}>
              <Text style={styles.groupBadgeIconInline}>📁</Text>
              <Text style={styles.groupBadgeTextInline}>{groupName}</Text>
            </View>
            {event.inviteCode && (
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Código:</Text>
                <Text style={styles.code}>{event.inviteCode}</Text>
              </View>
            )}
          </View>
        )}

        {/* Código de invitación si no hay evento */}
        {!showGroupBadge && event.inviteCode && (
          <View style={styles.inviteCodeContainer}>
            <Text style={styles.inviteCodeLabel}>Código:</Text>
            <Text style={styles.inviteCode}>{event.inviteCode}</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

// Función de comparación personalizada para evitar re-renders innecesarios
const areEqual = (prevProps: EventCardProps, nextProps: EventCardProps) => {
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.event.name === nextProps.event.name &&
    prevProps.event.description === nextProps.event.description &&
    prevProps.event.status === nextProps.event.status &&
    prevProps.event.initialBudget === nextProps.event.initialBudget &&
    (prevProps.event.participantIds?.length || 0) === (nextProps.event.participantIds?.length || 0) &&
    prevProps.event.inviteCode === nextProps.event.inviteCode &&
    prevProps.showGroupBadge === nextProps.showGroupBadge &&
    prevProps.groupName === nextProps.groupName
  );
};

export const EventCard = memo(EventCardComponent, areEqual);

const getStyles = (theme: any) => StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: theme.dark ? '#064E3B' : '#DCFCE7',
  },
  statusPast: {
    backgroundColor: theme.dark ? '#374151' : '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detail: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  groupBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.dark ? '#1E3A8A' : '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  groupBadgeIconInline: {
    fontSize: 10,
    marginRight: 4,
  },
  groupBadgeTextInline: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.dark ? '#93C5FD' : '#1E40AF',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginRight: 4,
  },
  code: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
    fontFamily: 'Courier',
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  inviteCode: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    fontFamily: 'Courier',
  },
});
