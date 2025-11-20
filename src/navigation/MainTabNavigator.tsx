/**
 * MainTabNavigator - Navegador de pestañas principal
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';
import { EventsScreen } from '../screens/EventsScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EventsIcon, GroupsIcon, ActivityIcon, SettingsIcon } from '../components/TabIcons';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<TabParamList>();

export const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          height: 90,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600' as '600',
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarLabel: 'Eventos',
          tabBarIcon: ({ color, focused }) => (
            <EventsIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarLabel: 'Grupos',
          tabBarIcon: ({ color, focused }) => (
            <GroupsIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          tabBarLabel: 'Actividad',
          tabBarIcon: ({ color, focused }) => (
            <ActivityIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <SettingsIcon color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
