/**
 * TabIcons - Iconos minimalistas para la barra de navegación
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface TabIconProps {
  focused: boolean;
  color: string;
}

export const EventsIcon: React.FC<TabIconProps> = ({ focused, color }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.calendarIcon, { borderColor: color }]}>
      <View style={[styles.calendarTop, { backgroundColor: color }]} />
      <View style={styles.calendarDots}>
        <View style={[styles.dot, { backgroundColor: color, opacity: focused ? 1 : 0.6 }]} />
        <View style={[styles.dot, { backgroundColor: color, opacity: focused ? 1 : 0.6 }]} />
        <View style={[styles.dot, { backgroundColor: color, opacity: focused ? 1 : 0.6 }]} />
        <View style={[styles.dot, { backgroundColor: color, opacity: focused ? 1 : 0.6 }]} />
      </View>
    </View>
  </View>
);

export const GroupsIcon: React.FC<TabIconProps> = ({ focused, color }) => (
  <View style={styles.iconContainer}>
    <View style={styles.groupsContainer}>
      <View style={[styles.personCircle, styles.personLeft, { 
        backgroundColor: color,
        opacity: focused ? 1 : 0.6,
        transform: [{ scale: focused ? 1 : 0.9 }]
      }]} />
      <View style={[styles.personCircle, styles.personRight, { 
        backgroundColor: color,
        opacity: focused ? 1 : 0.6,
        transform: [{ scale: focused ? 1 : 0.9 }]
      }]} />
    </View>
  </View>
);

export const SettingsIcon: React.FC<TabIconProps> = ({ focused, color }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.settingsCircle, { 
      borderColor: color,
      transform: [{ rotate: focused ? '45deg' : '0deg' }]
    }]}>
      <View style={[styles.settingsLine, styles.settingsLineH, { backgroundColor: color }]} />
      <View style={[styles.settingsLine, styles.settingsLineV, { backgroundColor: color }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Calendar Icon
  calendarIcon: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  calendarTop: {
    height: 6,
    width: '100%',
  },
  calendarDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 3,
    gap: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  // Groups Icon
  groupsContainer: {
    flexDirection: 'row',
    width: 24,
    height: 24,
    position: 'relative',
  },
  personCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
  },
  personLeft: {
    left: 0,
    top: 5,
  },
  personRight: {
    right: 0,
    top: 5,
  },
  // Settings Icon
  settingsCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLine: {
    position: 'absolute',
  },
  settingsLineH: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  settingsLineV: {
    width: 2,
    height: 12,
    borderRadius: 1,
  },
});
