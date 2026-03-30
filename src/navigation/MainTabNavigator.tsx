/**
 * MainTabNavigator - Navegador de pestañas principal
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { TabParamList } from '../types';
import { IndividualExpensesScreen } from '../screens/IndividualExpensesScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EventsIcon, GroupsIcon, ActivityIcon, SettingsIcon } from '../components/TabIcons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Shadows } from '../theme/designSystem';

const Tab = createBottomTabNavigator<TabParamList>();

export const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.borderLight,
          borderTopWidth: 0.5,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          ...Shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
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
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
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
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
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
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
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
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
    </Tab.Navigator>
  );
};
