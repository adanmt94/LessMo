/**
 * Componente Card - Tarjeta contenedora reutilizable
 * Generado con estilo Lovable.dev
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  const { theme } = useTheme();
  
  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: theme.colors.card,
    };
    
    if (variant === 'elevated') {
      return {
        ...baseStyle,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme.isDark ? 0.3 : 0.1,
        shadowRadius: 12,
        elevation: 5,
      };
    }
    
    if (variant === 'outlined') {
      return {
        ...baseStyle,
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
    }
    
    return baseStyle;
  };
  
  return (
    <View style={[styles.card, getCardStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
});
