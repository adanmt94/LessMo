/**
 * MainTabNavigator - Navegador de pestañas principal
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';
import { IndividualExpensesScreen } from '../screens/IndividualExpensesScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EventsIcon, GroupsIcon, ActivityIcon, SettingsIcon } from '../components/TabIcons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Tab = createBottomTabNavigator<TabParamList>();

export const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Expenses"
        component={IndividualExpensesScreen}
        options={{
          headerShown: false,
          tabBarLabel: t('tabs.expenses'),
          tabBarIcon: ({ color, focused }) => (
            <EventsIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={GroupsScreen}
        options={{
          headerShown: false,
          tabBarLabel: t('tabs.events'),
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
          tabBarLabel: t('tabs.activity'),
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
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <SettingsIcon color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
