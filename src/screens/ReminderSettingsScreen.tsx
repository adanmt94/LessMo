/**
 * Reminder Settings Screen
 * Configure notification frequency and quiet hours
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuthContext } from '../context/AuthContext';
import {
  ReminderSettings as ReminderSettingsType,
  ReminderFrequency,
  getReminderSettings,
  saveReminderSettings,
  requestNotificationPermissions,
  cancelAllReminders,
} from '../services/reminderService';

export const ReminderSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const language = currentLanguage.code as 'es' | 'en';
  const { user } = useAuthContext();

  const [settings, setSettings] = useState<ReminderSettingsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    const userSettings = await getReminderSettings(user.uid);
    setSettings(userSettings);
    setLoading(false);
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (!settings) return;

    if (value) {
      // Request permissions when enabling
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          language === 'es' ? 'Permisos necesarios' : 'Permissions required',
          language === 'es'
            ? 'Necesitas otorgar permisos de notificaciones en Ajustes para activar los recordatorios.'
            : 'You need to grant notification permissions in Settings to enable reminders.'
        );
        return;
      }
    } else {
      // Cancel all reminders when disabling
      await cancelAllReminders();
    }

    const updated = { ...settings, enabled: value };
    setSettings(updated);
    await saveReminderSettings(updated);
  };

  const handleFrequencyChange = async (frequency: ReminderFrequency) => {
    if (!settings) return;

    const updated = { ...settings, frequency };
    setSettings(updated);
    await saveReminderSettings(updated);
  };

  const handleQuietHoursChange = async (start: number, end: number) => {
    if (!settings) return;

    const updated = { ...settings, quietHoursStart: start, quietHoursEnd: end };
    setSettings(updated);
    await saveReminderSettings(updated);
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {language === 'es' ? 'Cargando...' : 'Loading...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {language === 'es' ? '🔔 Recordatorios' : '🔔 Reminders'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {language === 'es'
              ? 'Configura notificaciones para pagos pendientes'
              : 'Configure notifications for pending payments'}
          </Text>
        </View>

        {/* Enable Toggle */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {language === 'es' ? 'Activar recordatorios' : 'Enable reminders'}
              </Text>
              <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
                {language === 'es'
                  ? 'Recibe notificaciones sobre pagos pendientes'
                  : 'Receive notifications about pending payments'}
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: theme.colors.border, true: '#6366F1' }}
              thumbColor={settings.enabled ? '#FFFFFF' : '#F4F4F5'}
            />
          </View>
        </View>

        {settings.enabled && (
          <>
            {/* Frequency */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 12 }]}>
                {language === 'es' ? 'Frecuencia' : 'Frequency'}
              </Text>

              {(['daily', 'weekly', 'never'] as ReminderFrequency[]).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.frequencyOption,
                    {
                      backgroundColor:
                        settings.frequency === freq
                          ? theme.isDark
                            ? 'rgba(99, 102, 241, 0.2)'
                            : 'rgba(99, 102, 241, 0.1)'
                          : 'transparent',
                      borderColor:
                        settings.frequency === freq ? '#6366F1' : theme.colors.border,
                    },
                  ]}
                  onPress={() => handleFrequencyChange(freq)}
                >
                  <View style={styles.frequencyLeft}>
                    <Text
                      style={[
                        styles.frequencyLabel,
                        {
                          color:
                            settings.frequency === freq ? '#6366F1' : theme.colors.text,
                        },
                      ]}
                    >
                      {freq === 'daily'
                        ? language === 'es'
                          ? '📅 Diario'
                          : '📅 Daily'
                        : freq === 'weekly'
                        ? language === 'es'
                          ? '📆 Semanal'
                          : '📆 Weekly'
                        : language === 'es'
                        ? '🚫 Nunca'
                        : '🚫 Never'}
                    </Text>
                    <Text
                      style={[
                        styles.frequencyDescription,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {freq === 'daily'
                        ? language === 'es'
                          ? 'Una notificación cada 24 horas'
                          : 'One notification every 24 hours'
                        : freq === 'weekly'
                        ? language === 'es'
                          ? 'Una notificación cada 7 días'
                          : 'One notification every 7 days'
                        : language === 'es'
                        ? 'No enviar recordatorios'
                        : 'Do not send reminders'}
                    </Text>
                  </View>
                  {settings.frequency === freq && (
                    <Text style={{ fontSize: 20 }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Quiet Hours */}
            {settings.frequency !== 'never' && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 8 }]}>
                  {language === 'es' ? '🌙 Horas silenciosas' : '🌙 Quiet hours'}
                </Text>
                <Text
                  style={[
                    styles.cardDescription,
                    { color: theme.colors.textSecondary, marginBottom: 16 },
                  ]}
                >
                  {language === 'es'
                    ? 'No enviar notificaciones durante estas horas'
                    : 'Do not send notifications during these hours'}
                </Text>

                <View style={styles.quietHoursRow}>
                  <View style={styles.quietHoursItem}>
                    <Text
                      style={[
                        styles.quietHoursLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {language === 'es' ? 'Inicio' : 'Start'}
                    </Text>
                    <Text style={[styles.quietHoursValue, { color: theme.colors.text }]}>
                      {settings.quietHoursStart}:00
                    </Text>
                  </View>

                  <Text style={[styles.quietHoursArrow, { color: theme.colors.textSecondary }]}>
                    →
                  </Text>

                  <View style={styles.quietHoursItem}>
                    <Text
                      style={[
                        styles.quietHoursLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {language === 'es' ? 'Fin' : 'End'}
                    </Text>
                    <Text style={[styles.quietHoursValue, { color: theme.colors.text }]}>
                      {settings.quietHoursEnd}:00
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Info Card */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(99, 102, 241, 0.15)'
                    : 'rgba(99, 102, 241, 0.05)',
                  borderColor: '#6366F1',
                },
              ]}
            >
              <Text style={[styles.infoTitle, { color: '#6366F1' }]}>
                {language === 'es' ? '💡 ¿Cómo funcionan?' : '💡 How do they work?'}
              </Text>
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                {language === 'es'
                  ? 'Los recordatorios te notificarán sobre pagos pendientes según la frecuencia configurada. Puedes marcar los pagos como realizados o posponerlos desde la notificación.'
                  : 'Reminders will notify you about pending payments based on configured frequency. You can mark payments as done or postpone them from the notification.'}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  frequencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  frequencyLeft: {
    flex: 1,
  },
  frequencyLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  frequencyDescription: {
    fontSize: 13,
  },
  quietHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quietHoursItem: {
    flex: 1,
    alignItems: 'center',
  },
  quietHoursLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  quietHoursValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  quietHoursArrow: {
    fontSize: 24,
    marginHorizontal: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
