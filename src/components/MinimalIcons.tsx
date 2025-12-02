/**
 * MinimalIcons - Iconos minimalistas para toda la app
 * Reemplaza emojis con componentes View minimalistas
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  focused?: boolean;
  style?: ViewStyle;
}

// 📅 CALENDAR ICON (Eventos, fechas)
export const CalendarIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.calendarLine, { backgroundColor: color, opacity: focused ? 1 : 0.5 }]} />
    {focused && (
      <View style={[styles.calendarDot, { backgroundColor: color }]} />
    )}
  </View>
);

// 👥 PEOPLE ICON (Participantes, grupos)
export const PeopleIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.circleOutline, styles.circleLeft, { 
      borderColor: color,
      borderWidth: focused ? 1.5 : 1,
      opacity: focused ? 1 : 0.6
    }]} />
    <View style={[styles.circleOutline, styles.circleRight, { 
      borderColor: color,
      borderWidth: focused ? 1.5 : 1,
      opacity: focused ? 1 : 0.6
    }]} />
  </View>
);

// 💰 MONEY ICON (Gastos, pagos)
export const MoneyIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.moneyCircle, { 
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      opacity: focused ? 1 : 0.6
    }]}>
      <View style={[styles.moneyLine, { 
        backgroundColor: color,
        opacity: focused ? 1 : 0.7
      }]} />
    </View>
  </View>
);

// 📊 CHART ICON (Estadísticas, resumen)
export const ChartIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={styles.barsContainer}>
      <View style={[styles.thinBar, { 
        backgroundColor: color,
        height: size * 0.6,
        opacity: focused ? 1 : 0.5
      }]} />
      <View style={[styles.thinBar, { 
        backgroundColor: color,
        height: size * 0.8,
        opacity: focused ? 0.8 : 0.4
      }]} />
      <View style={[styles.thinBar, { 
        backgroundColor: color,
        height: size * 0.4,
        opacity: focused ? 0.6 : 0.3
      }]} />
    </View>
  </View>
);

// ⚙️ SETTINGS ICON (Configuración)
export const SettingsIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.settingsCircle, { 
      width: size,
      height: size,
      borderRadius: size / 2,
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      opacity: focused ? 1 : 0.6
    }]}>
      {focused && (
        <View style={[styles.settingsDot, { 
          width: size * 0.2,
          height: size * 0.2,
          borderRadius: size * 0.1,
          backgroundColor: color 
        }]} />
      )}
    </View>
  </View>
);

// 🔔 BELL ICON (Notificaciones)
export const BellIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.bellShape, { 
      width: size * 0.7,
      height: size * 0.7,
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      borderTopLeftRadius: size * 0.4,
      borderTopRightRadius: size * 0.4,
      opacity: focused ? 1 : 0.6
    }]} />
    {focused && (
      <View style={[styles.bellDot, { 
        width: size * 0.2,
        height: size * 0.2,
        borderRadius: size * 0.1,
        backgroundColor: color,
        top: size * 0.75
      }]} />
    )}
  </View>
);

// 🎟️ TICKET ICON (Invitación, código)
export const TicketIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.ticketRect, { 
      width: size * 0.8,
      height: size * 0.6,
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      borderRadius: 4,
      opacity: focused ? 1 : 0.6
    }]}>
      <View style={[styles.ticketLine, { backgroundColor: color, opacity: 0.5 }]} />
      <View style={[styles.ticketLine, { backgroundColor: color, opacity: 0.5 }]} />
    </View>
  </View>
);

// 🗑️ TRASH ICON (Eliminar)
export const TrashIcon: React.FC<IconProps> = ({ size = 20, color = '#EF4444', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.trashCan, { 
      width: size * 0.6,
      height: size * 0.7,
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      borderTopWidth: 0,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
      opacity: focused ? 1 : 0.6
    }]} />
    <View style={[styles.trashLid, { 
      width: size * 0.7,
      height: 2,
      backgroundColor: color,
      top: size * 0.15,
      opacity: focused ? 1 : 0.6
    }]} />
  </View>
);

// 🌍 GLOBE ICON (Idioma)
export const GlobeIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.globeCircle, { 
      width: size * 0.8,
      height: size * 0.8,
      borderRadius: size * 0.4,
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      opacity: focused ? 1 : 0.6
    }]} />
    <View style={[styles.globeLine, { 
      width: 1,
      height: size * 0.8,
      backgroundColor: color,
      opacity: focused ? 0.6 : 0.4
    }]} />
  </View>
);

// 🔒 LOCK ICON (Seguridad, privacidad)
export const LockIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.lockArc, { 
      width: size * 0.5,
      height: size * 0.4,
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      borderTopLeftRadius: size * 0.25,
      borderTopRightRadius: size * 0.25,
      borderBottomWidth: 0,
      top: 0,
      opacity: focused ? 1 : 0.6
    }]} />
    <View style={[styles.lockBody, { 
      width: size * 0.7,
      height: size * 0.5,
      backgroundColor: color,
      borderRadius: 2,
      top: size * 0.35,
      opacity: focused ? 1 : 0.6
    }]} />
  </View>
);

// 📥 DOWNLOAD ICON (Exportar, descargar)
export const DownloadIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.downloadArrow, { 
      width: 2,
      height: size * 0.6,
      backgroundColor: color,
      opacity: focused ? 1 : 0.6
    }]} />
    <View style={[styles.downloadBase, { 
      width: size * 0.6,
      height: 2,
      backgroundColor: color,
      top: size * 0.75,
      opacity: focused ? 1 : 0.6
    }]} />
  </View>
);

// 🎉 PARTY ICON (Celebración, entretenimiento)
export const PartyIcon: React.FC<IconProps> = ({ size = 20, color = '#EC4899', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.partyStar, { 
      width: size * 0.4,
      height: size * 0.4,
      backgroundColor: color,
      opacity: focused ? 1 : 0.6,
      transform: [{ rotate: '45deg' }]
    }]} />
    <View style={[styles.partyCircle, { 
      width: size * 0.2,
      height: size * 0.2,
      borderRadius: size * 0.1,
      backgroundColor: color,
      opacity: focused ? 0.7 : 0.4,
      left: size * 0.6,
      top: size * 0.1
    }]} />
  </View>
);

// 👤 USER ICON (Perfil, anónimo)
export const UserIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.userCircle, { 
      width: size * 0.4,
      height: size * 0.4,
      borderRadius: size * 0.2,
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      top: 0,
      opacity: focused ? 1 : 0.6
    }]} />
    <View style={[styles.userBody, { 
      width: size * 0.7,
      height: size * 0.5,
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      borderTopLeftRadius: size * 0.35,
      borderTopRightRadius: size * 0.35,
      borderBottomWidth: 0,
      top: size * 0.45,
      opacity: focused ? 1 : 0.6
    }]} />
  </View>
);

// ✨ SPARKLE ICON (Novedad, destacado)
export const SparkleIcon: React.FC<IconProps> = ({ size = 20, color = '#FBBF24', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.sparkleCross, { 
      width: 2,
      height: size * 0.7,
      backgroundColor: color,
      opacity: focused ? 1 : 0.6
    }]} />
    <View style={[styles.sparkleCross, { 
      width: size * 0.7,
      height: 2,
      backgroundColor: color,
      opacity: focused ? 1 : 0.6
    }]} />
  </View>
);

// 🔑 KEY ICON (Código, acceso)
export const KeyIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1', focused = true }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.keyCircle, { 
      width: size * 0.4,
      height: size * 0.4,
      borderRadius: size * 0.2,
      borderColor: color,
      borderWidth: focused ? 2 : 1.5,
      left: 0,
      opacity: focused ? 1 : 0.6
    }]} />
    <View style={[styles.keyShaft, { 
      width: size * 0.5,
      height: 2,
      backgroundColor: color,
      left: size * 0.3,
      opacity: focused ? 1 : 0.6
    }]} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Calendar
  calendarLine: {
    width: '80%',
    height: 1.5,
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  
  // People
  circleOutline: {
    width: '40%',
    height: '40%',
    borderRadius: 100,
    position: 'absolute',
  },
  circleLeft: {
    left: 0,
    top: '30%',
  },
  circleRight: {
    right: 0,
    top: '30%',
  },
  
  // Money
  moneyCircle: {
    width: '80%',
    height: '80%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyLine: {
    width: '40%',
    height: 2,
    transform: [{ rotate: '20deg' }],
  },
  
  // Chart
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: '100%',
  },
  thinBar: {
    width: 2,
    borderRadius: 1,
  },
  
  // Settings
  settingsCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsDot: {
    position: 'absolute',
  },
  
  // Bell
  bellShape: {
    borderBottomWidth: 0,
  },
  bellDot: {
    position: 'absolute',
  },
  
  // Ticket
  ticketRect: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  ticketLine: {
    width: '50%',
    height: 1,
  },
  
  // Trash
  trashCan: {
    position: 'absolute',
    top: '25%',
  },
  trashLid: {
    position: 'absolute',
  },
  
  // Globe
  globeCircle: {
    position: 'absolute',
  },
  globeLine: {
    position: 'absolute',
  },
  
  // Lock
  lockArc: {
    position: 'absolute',
  },
  lockBody: {
    position: 'absolute',
  },
  
  // Download
  downloadArrow: {
    position: 'absolute',
    top: '10%',
  },
  downloadBase: {
    position: 'absolute',
  },
  
  // Party
  partyStar: {
    position: 'absolute',
  },
  partyCircle: {
    position: 'absolute',
  },
  
  // User
  userCircle: {
    position: 'absolute',
  },
  userBody: {
    position: 'absolute',
  },
  
  // Sparkle
  sparkleCross: {
    position: 'absolute',
  },
  
  // Key
  keyCircle: {
    position: 'absolute',
  },
  keyShaft: {
    position: 'absolute',
  },
});
