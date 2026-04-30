/**
 * FeatureTooltip - Tooltips contextuales para nuevas funcionalidades
 * Se muestran una sola vez por feature
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const SEEN_KEY = 'lessmo_tooltips_seen';

interface Props {
  id: string;           // Unique tooltip ID
  title: string;
  message: string;
  icon?: string;
  position?: 'top' | 'bottom';
  children: React.ReactNode;
}

export const FeatureTooltip: React.FC<Props> = ({
  id,
  title,
  message,
  icon = '💡',
  position = 'bottom',
  children,
}) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    checkSeen();
  }, []);

  const checkSeen = async () => {
    try {
      const seen = await AsyncStorage.getItem(SEEN_KEY);
      const seenList: string[] = seen ? JSON.parse(seen) : [];
      if (!seenList.includes(id)) {
        setVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    } catch {
      // Ignore
    }
  };

  const dismiss = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(async () => {
      setVisible(false);
      try {
        const seen = await AsyncStorage.getItem(SEEN_KEY);
        const seenList: string[] = seen ? JSON.parse(seen) : [];
        seenList.push(id);
        await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(seenList));
      } catch {
        // Ignore
      }
    });
  };

  const styles = getStyles(theme, position);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {visible && (
        <Animated.View style={[styles.tooltip, { opacity: fadeAnim }]}>
          <View style={styles.tooltipContent}>
            <Text style={styles.tooltipIcon}>{icon}</Text>
            <View style={styles.tooltipText}>
              <Text style={styles.tooltipTitle}>{title}</Text>
              <Text style={styles.tooltipMessage}>{message}</Text>
            </View>
            <TouchableOpacity onPress={dismiss} style={styles.dismissBtn}>
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.arrow, position === 'top' ? styles.arrowBottom : styles.arrowTop]} />
        </Animated.View>
      )}
    </View>
  );
};

/**
 * Reset all tooltips (for testing or re-show)
 */
export async function resetAllTooltips(): Promise<void> {
  await AsyncStorage.removeItem(SEEN_KEY);
}

/**
 * Mark a specific tooltip as seen programmatically
 */
export async function markTooltipSeen(id: string): Promise<void> {
  const seen = await AsyncStorage.getItem(SEEN_KEY);
  const seenList: string[] = seen ? JSON.parse(seen) : [];
  if (!seenList.includes(id)) {
    seenList.push(id);
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(seenList));
  }
}

const getStyles = (theme: any, position: 'top' | 'bottom') => StyleSheet.create({
  tooltip: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    ...(position === 'bottom' ? { top: '100%', marginTop: 8 } : { bottom: '100%', marginBottom: 8 }),
  },
  tooltipContent: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  tooltipIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  tooltipText: {
    flex: 1,
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tooltipMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 8,
  },
  dismissText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
  },
  arrowTop: {
    borderBottomWidth: 8,
    borderBottomColor: theme.colors.primary,
    position: 'absolute',
    top: -8,
  },
  arrowBottom: {
    borderTopWidth: 8,
    borderTopColor: theme.colors.primary,
    position: 'absolute',
    bottom: -8,
  },
});
