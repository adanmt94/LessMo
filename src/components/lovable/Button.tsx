/**
 * Componente Button - Botón personalizado reutilizable
 * REDISEÑADO para soporte completo de modo oscuro
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  testID,
}) => {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;
  
  // DEBUG: Log para identificar el problema
  if (!theme || !theme.colors) {
    console.error('❌ Button: theme o theme.colors es undefined', {
      theme,
      title,
      variant,
      size
    });
    return null;
  }
  
  // Asegurar que size nunca sea undefined
  const buttonSize = size || 'medium';

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
    };

    const sizes = {
      small: { paddingHorizontal: 18, paddingVertical: 10 },
      medium: { paddingHorizontal: 28, paddingVertical: 14 },
      large: { paddingHorizontal: 36, paddingVertical: 18 },
    };

    const variants = {
      primary: {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      },
      secondary: {
        backgroundColor: theme.colors.success,
        shadowColor: theme.colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
      },
      danger: {
        backgroundColor: theme.colors.error,
        shadowColor: theme.colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
    };

    return {
      ...baseStyle,
      ...variants[variant],
      ...sizes[buttonSize],
      ...(fullWidth && { width: '100%' as any }),
      ...(isDisabled && { opacity: 0.5 }),
    };
  };

  const getTextColor = () => {
    if (variant === 'outline') return theme.colors.primary;
    return '#FFFFFF'; // Siempre blanco para botones sólidos
  };

  return (
    <TouchableOpacity
      testID={testID}
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={getTextColor()}
          size="small"
        />
      ) : (
        <Text
          style={[
            { fontWeight: '700', fontSize: 17, letterSpacing: 0.3, color: getTextColor() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Sin estilos estáticos - todo se calcula dinámicamente con el tema
