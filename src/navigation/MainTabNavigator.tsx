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
    <Tab.Navigator>
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          headerShown: false,
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
          headerShown: false,
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
          headerShown: false,
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
          headerShown: false,
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <SettingsIcon color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
