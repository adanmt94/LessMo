/**
 * GroupCard - Componente memoizado para tarjeta de grupo
 * Optimizado para listas con React.memo
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Card } from './lovable';
import { Button } from './lovable';
import { Group } from '../types';
import { useTheme } from '../context/ThemeContext';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
  onCreateEvent?: () => void;
  style?: ViewStyle;
}

const GROUP_COLORS: { [key: string]: string } = {
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6',
};

const GroupCardComponent: React.FC<GroupCardProps> = ({ 
  group, 
  onPress, 
  onCreateEvent,
  style 
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const getGroupColor = (colorName?: string): string => {
    return GROUP_COLORS[colorName || 'blue'] || '#3B82F6';
  };

  const participantsCount = group.totalParticipants || group.memberIds?.length || group.participantIds?.length || 0;

  return (
    <Card style={style || styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={styles.header}>
          <View style={[styles.icon, { backgroundColor: getGroupColor(group.color) }]}>
            <Text style={styles.emoji}>{group.icon || '📁'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{group.name}</Text>
            {group.description && (
              <Text style={styles.description} numberOfLines={1}>
                {group.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{group.eventIds.length}</Text>
            <Text style={styles.statLabel}>Eventos</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.stat}>
            <Text style={styles.statValue}>{participantsCount}</Text>
            <Text style={styles.statLabel}>
              {participantsCount === 1 ? 'Participante' : 'Participantes'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {onCreateEvent && (
        <View style={styles.actions}>
          <Button
            title="Ver Eventos"
            variant="outline"
            size="small"
            style={styles.actionButton}
            onPress={onPress}
          />
          <Button
            title="+ Evento"
            variant="primary"
            size="small"
            style={styles.actionButton}
            onPress={onCreateEvent}
          />
        </View>
      )}
    </Card>
  );
};

// Función de comparación personalizada
const areEqual = (prevProps: GroupCardProps, nextProps: GroupCardProps) => {
  return (
    prevProps.group.id === nextProps.group.id &&
    prevProps.group.name === nextProps.group.name &&
    prevProps.group.description === nextProps.group.description &&
    prevProps.group.icon === nextProps.group.icon &&
    prevProps.group.color === nextProps.group.color &&
    prevProps.group.eventIds.length === nextProps.group.eventIds.length &&
    (prevProps.group.memberIds?.length || 0) === (nextProps.group.memberIds?.length || 0) &&
    prevProps.group.totalParticipants === nextProps.group.totalParticipants
  );
};

export const GroupCard = memo(GroupCardComponent, areEqual);

const getStyles = (theme: any) => StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
});
