/**
 * TabIcons - Iconos ULTRA MINIMALISTAS rediseñados desde 0
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface TabIconProps {
  focused: boolean;
  color: string;
}

// 📅 EVENTOS - Línea simple con punto
export const EventsIcon: React.FC<TabIconProps> = ({ focused, color }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.lineIcon, { backgroundColor: color, opacity: focused ? 1 : 0.5 }]} />
    {focused && (
      <View style={[styles.focusDot, { backgroundColor: color }]} />
    )}
  </View>
);

// 👥 EVENTOS - Dos círculos superpuestos
export const GroupsIcon: React.FC<TabIconProps> = ({ focused, color }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.circleLeft, { 
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      opacity: focused ? 1 : 0.6
    }]} />
    <View style={[styles.circleRight, { 
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      opacity: focused ? 1 : 0.6
    }]} />
  </View>
);

// 📊 ACTIVIDAD - Tres líneas verticales minimalistas
export const ActivityIcon: React.FC<TabIconProps> = ({ focused, color }) => (
  <View style={styles.iconContainer}>
    <View style={styles.barsContainer}>
      <View style={[styles.thinBar, { 
        backgroundColor: color,
        height: focused ? 16 : 12,
        opacity: focused ? 1 : 0.5
      }]} />
      <View style={[styles.thinBar, { 
        backgroundColor: color,
        height: focused ? 20 : 16,
        opacity: focused ? 0.8 : 0.4
      }]} />
      <View style={[styles.thinBar, { 
        backgroundColor: color,
        height: focused ? 12 : 8,
        opacity: focused ? 0.6 : 0.3
      }]} />
    </View>
  </View>
);

// ⚙️ AJUSTES - Círculo con cruz minimalista
export const SettingsIcon: React.FC<TabIconProps> = ({ focused, color }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.settingsOuter, { 
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      opacity: focused ? 1 : 0.6
    }]}>
      {focused && (
        <View style={[styles.settingsInner, { backgroundColor: color }]} />
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // EVENTOS - Línea con punto
  lineIcon: {
    width: 20,
    height: 1.5,
    borderRadius: 1,
  },
  focusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    top: 10,
  },
  
  // EVENTOS - Círculos superpuestos
  circleLeft: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
    left: 0,
    top: 5,
  },
  circleRight: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
    right: 0,
    top: 5,
  },
  
  // ACTIVIDAD - Barras minimalistas
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 20,
  },
  thinBar: {
    width: 2,
    borderRadius: 1,
  },
  
  // AJUSTES - Círculo con centro
  settingsOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
