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

const Tab = createBottomTabNavigator<TabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 90,
          paddingBottom: 25,
          paddingTop: 8,
          paddingHorizontal: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
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
