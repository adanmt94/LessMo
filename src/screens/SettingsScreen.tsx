/**
 * SettingsScreen - Pantalla de ajustes y configuración
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RootStackParamList } from '../types';
import { Card } from '../components/lovable';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../hooks/useNotifications';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { useDailyReminder } from '../hooks/useDailyReminder';
import { useSpendingAlerts } from '../hooks/useSpendingAlerts';
import { AVAILABLE_SHORTCUTS } from '../hooks/useSiriShortcuts';
import { useForceUpdate } from '../utils/globalEvents';
import { CommonActions } from '@react-navigation/native';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
  styles: any;
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { currentLanguage, availableLanguages, changeLanguage, t } = useLanguage();
  const { currentCurrency, availableCurrencies, changeCurrency } = useCurrency();
  const { notificationsEnabled, toggleNotifications, isLoading } = useNotifications();
  const { 
    isAvailable: biometricAvailable, 
    isEnrolled: biometricEnrolled,
    isEnabled: biometricEnabled, 
    biometricType,
    enableBiometricAuth,
    disableBiometricAuth,
    isLoading: biometricLoading,
    canEnableBiometric,
  } = useBiometricAuth();
  const {
    isEnabled: dailyReminderEnabled,
    isLoading: dailyReminderLoading,
    toggleReminder,
  } = useDailyReminder();
  const {
    config: alertsConfig,
    isLoading: alertsLoading,
    updateMinAvailableAmount,
    updateMaxSpentAmount,
    toggleMinAvailableAlert,
    toggleMaxSpentAlert,
  } = useSpendingAlerts();
  
  // Estado para configuración de recordatorios de deudas
  const [debtRemindersEnabled, setDebtRemindersEnabled] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState('weekly');
  
  // Estado para la foto de perfil y nombre
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  // Hook para forzar re-render cuando cambien idioma/moneda
  useForceUpdate();
  
  // Cargar foto de perfil, nombre y configuración de recordatorios
  useEffect(() => {
    loadUserProfile();
    loadDebtReminderSettings();
  }, [user]);

  // Cargar configuración de recordatorios
  const loadDebtReminderSettings = async () => {
    try {
      const { getReminderSettings } = await import('../services/debtReminderService');
      const settings = await getReminderSettings();
      setDebtRemindersEnabled(settings.enabled);
      setReminderFrequency(settings.frequency);
    } catch (error) {
      
    }
  };
  
  // Recargar cuando se vuelve a esta pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserProfile();
    });
    return unsubscribe;
  }, [navigation]);
  
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setPhotoURL(userData.photoURL || user.photoURL || null);
        setUserName(userData.name || user.displayName || user.email?.split('@')[0] || 'Usuario');
      } else {
        setUserName(user.displayName || user.email?.split('@')[0] || 'Usuario');
      }
    } catch (error) {
      
      setUserName(user.displayName || user.email?.split('@')[0] || 'Usuario');
    }
  };
  
  const darkModeEnabled = theme.isDark;
  const styles = getStyles(theme);

  const handleLanguageChange = () => {
    Alert.alert(
      t('settings.selectLanguage'),
      t('settings.selectLanguage'),
      [
        ...availableLanguages.map(lang => ({
          text: `${lang.nativeName} (${lang.name})`,
          onPress: async () => {
            try {
              
              await changeLanguage(lang.code);
              
              // El evento global en LanguageContext ya forzó el remount
              Alert.alert(t('common.success'), `${t('settings.language')}: ${lang.nativeName}`);
            } catch (error: any) {
              
              Alert.alert(t('common.error'), t('common.error'));
            }
          },
        })),
        { text: t('common.cancel'), style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const handleCurrencyChange = () => {
    Alert.alert(
      t('expense.selectCurrency'),
      t('expense.selectCurrency'),
      [
        ...availableCurrencies.map(curr => ({
          text: `${curr.name} (${curr.symbol})`,
          onPress: async () => {
            try {
              
              await changeCurrency(curr.code);
              
              // El evento global en CurrencyContext ya forzó el remount
              Alert.alert(t('common.success'), `${curr.name} (${curr.symbol})`);
            } catch (error: any) {
              
              Alert.alert(t('common.error'), t('common.error'));
            }
          },
        })),
        { text: t('common.cancel'), style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const handleThemeChange = () => {
    const themeOptions = [
      { mode: 'light' as const, label: t('settings.themeLight'), description: t('settings.lightTheme') },
      { mode: 'dark' as const, label: t('settings.themeDark'), description: t('settings.darkTheme') },
      { mode: 'auto' as const, label: t('settings.themeAuto'), description: t('settings.autoTheme') },
    ];

    Alert.alert(
      t('settings.selectTheme'),
      t('settings.themeTitle'),
      themeOptions.map(option => ({
        text: option.label,
        onPress: async () => {
          
          await setThemeMode(option.mode);
          
          // El EventEmitter se encarga de forzar el re-render
          Alert.alert(t('settings.themeChanged'), option.description);
        },
      })),
      { cancelable: true }
    );
  };

  const handleMinAvailableAlert = () => {
    Alert.prompt(
      t('settings.lowBalanceAlert'),
      `${t('settings.lowBalanceEnabled')}\n\n${t('settings.defaultCurrency')}: ${alertsConfig.minAvailableAmount} ${currentCurrency.symbol}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.save'),
          onPress: async (value?: string) => {
            const amount = parseFloat(value || '0');
            if (isNaN(amount) || amount < 0) {
              Alert.alert(t('common.error'), t('settings.saveConfig'));
              return;
            }
            try {
              await updateMinAvailableAmount(amount);
              Alert.alert(t('common.success'), `${t('settings.lowBalanceEnabled')} ${amount} ${currentCurrency.symbol}`);
            } catch (error) {
              Alert.alert(t('common.error'), t('settings.saveConfig'));
            }
          },
        },
      ],
      'plain-text',
      alertsConfig.minAvailableAmount.toString()
    );
  };

  const handleMaxSpentAlert = () => {
    Alert.prompt(
      t('settings.maxSpending'),
      `${t('settings.maxSpentEnabled')}\n\n${t('settings.defaultCurrency')}: ${alertsConfig.maxSpentAmount} ${currentCurrency.symbol}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.save'),
          onPress: async (value?: string) => {
            const amount = parseFloat(value || '0');
            if (isNaN(amount) || amount < 0) {
              Alert.alert(t('common.error'), t('settings.saveConfig'));
              return;
            }
            try {
              await updateMaxSpentAmount(amount);
              Alert.alert(t('common.success'), `${t('settings.maxSpentEnabled')} ${amount} ${currentCurrency.symbol}`);
            } catch (error) {
              Alert.alert(t('common.error'), t('settings.saveConfig'));
            }
          },
        },
      ],
      'plain-text',
      alertsConfig.maxSpentAmount.toString()
    );
  };

  // Configuración de recordatorios de deudas
  const handleToggleDebtReminders = async (enabled: boolean) => {
    try {
      const { saveReminderSettings } = await import('../services/debtReminderService');
      await saveReminderSettings({ enabled });
      setDebtRemindersEnabled(enabled);
      Alert.alert(
        'Recordatorios de deudas',
        enabled ? 'Los recordatorios están activados' : 'Los recordatorios están desactivados'
      );
    } catch (error) {
      
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  const handleReminderFrequency = () => {
    const frequencies = [
      { label: 'Nunca', value: 'none' },
      { label: 'Diario', value: 'daily' },
      { label: 'Semanal', value: 'weekly' },
      { label: 'Quincenal', value: 'biweekly' },
    ];

    Alert.alert(
      'Frecuencia de recordatorios',
      'Selecciona cada cuánto quieres recibir recordatorios de deudas pendientes',
      frequencies.map(freq => ({
        text: freq.label,
        onPress: async () => {
          try {
            const { saveReminderSettings } = await import('../services/debtReminderService');
            await saveReminderSettings({ 
              frequency: freq.value as any,
              enabled: freq.value !== 'none',
            });
            setReminderFrequency(freq.value);
            setDebtRemindersEnabled(freq.value !== 'none');
            Alert.alert('Frecuencia actualizada', `Recordatorios: ${freq.label}`);
          } catch (error) {
            
            Alert.alert('Error', 'No se pudo actualizar la frecuencia');
          }
        },
      }))
    );
  };

  const SettingItem: React.FC<SettingItemProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    showArrow = true,
    styles,
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showArrow && onPress && (
          <Text style={styles.arrow}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const handleSignOut = () => {
    Alert.alert(
      t('home.signOut'),
      t('home.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('home.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // La navegación se manejará automáticamente por el AuthContext
            } catch (error) {
              Alert.alert(t('common.error'), t('auth.logoutSuccess'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Perfil */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('auth.name')}</Text>
          
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              {photoURL ? (
                <Image 
                  source={{ uri: photoURL }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {userName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{user?.email || t('settings.anonymousUser')}</Text>
            </View>
          </View>

          <SettingItem styles={styles}
            icon="✏️"
            title={t('settings.editProfile')}
            subtitle={t('settings.editProfileSubtitle')}
            onPress={() => navigation.navigate('EditProfile')}
          />
        </Card>

        {/* Preferencias */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
          
          <SettingItem styles={styles}
            icon="🌍"
            title={t('settings.language')}
            subtitle={currentLanguage.nativeName}
            onPress={handleLanguageChange}
          />
          
          <SettingItem styles={styles}
            icon="💰"
            title={t('settings.defaultCurrency')}
            subtitle={`${currentCurrency.name} (${currentCurrency.symbol})`}
            onPress={handleCurrencyChange}
          />
          
          <SettingItem styles={styles}
            icon="🔔"
            title={t('settings.notifications')}
            subtitle={t('settings.notificationsSubtitle')}
            showArrow={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => { toggleNotifications(value); }}
                disabled={isLoading}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={notificationsEnabled ? '#6366F1' : '#F3F4F6'}
              />
            }
          />
          
          <SettingItem styles={styles}
            icon="⏰"
            title={t('settings.dailyReminder')}
            subtitle={
              dailyReminderEnabled
                ? t('settings.dailyReminderActive')
                : t('settings.dailyReminderInactive')
            }
            showArrow={false}
            rightElement={
              <Switch
                value={dailyReminderEnabled}
                onValueChange={(value) => { 
                  toggleReminder(value)
                    .then(() => {
                      Alert.alert(
                        value ? t('settings.dailyReminderActive') : t('settings.dailyReminderInactive'),
                        value 
                          ? t('settings.dailyReminderActive')
                          : t('settings.dailyReminderInactive')
                      );
                    })
                    .catch(() => {
                      Alert.alert(t('common.error'), t('settings.saveConfig'));
                    });
                }}
                disabled={dailyReminderLoading}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={dailyReminderEnabled ? '#6366F1' : '#F3F4F6'}
              />
            }
          />

          {/* NUEVA SECCIÓN: Alertas de Gastos */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 12, paddingTop: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary, textTransform: 'uppercase' }}>
              {t('settings.spendingAlerts')}
            </Text>
          </View>
          
          <SettingItem styles={styles}
            icon="💰"
            title={t('settings.lowBalanceAlert')}
            subtitle={
              alertsConfig.minAvailableEnabled
                ? `${t('settings.lowBalanceEnabled')} ${alertsConfig.minAvailableAmount} ${currentCurrency.symbol}`
                : t('settings.lowBalanceDisabled')
            }
            onPress={handleMinAvailableAlert}
            rightElement={
              <Switch
                value={alertsConfig.minAvailableEnabled}
                onValueChange={() => {
                  toggleMinAvailableAlert()
                    .then(() => {
                      Alert.alert(
                        alertsConfig.minAvailableEnabled ? t('settings.lowBalanceDisabled') : t('settings.lowBalanceEnabled'),
                        alertsConfig.minAvailableEnabled
                          ? t('settings.lowBalanceDisabled')
                          : `${t('settings.lowBalanceEnabled')} ${alertsConfig.minAvailableAmount} ${currentCurrency.symbol}`
                      );
                    })
                    .catch(() => {
                      Alert.alert(t('common.error'), t('settings.saveConfig'));
                    });
                }}
                disabled={alertsLoading}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={alertsConfig.minAvailableEnabled ? '#6366F1' : '#F3F4F6'}
              />
            }
          />
          
          <SettingItem styles={styles}
            icon="🚨"
            title={t('settings.maxSpentAlert')}
            subtitle={
              alertsConfig.maxSpentEnabled
                ? `${t('settings.maxSpentEnabled')} ${alertsConfig.maxSpentAmount} ${currentCurrency.symbol}`
                : t('settings.maxSpentDisabled')
            }
            onPress={handleMaxSpentAlert}
            rightElement={
              <Switch
                value={alertsConfig.maxSpentEnabled}
                onValueChange={() => {
                  toggleMaxSpentAlert()
                    .then(() => {
                      Alert.alert(
                        alertsConfig.maxSpentEnabled ? t('settings.maxSpentDisabled') : t('settings.maxSpentEnabled'),
                        alertsConfig.maxSpentEnabled
                          ? t('settings.maxSpentDisabled')
                          : `${t('settings.maxSpentEnabled')} ${alertsConfig.maxSpentAmount} ${currentCurrency.symbol}`
                      );
                    })
                    .catch(() => {
                      Alert.alert(t('common.error'), t('settings.saveConfig'));
                    });
                }}
                disabled={alertsLoading}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={alertsConfig.maxSpentEnabled ? '#6366F1' : '#F3F4F6'}
              />
            }
          />

          {/* Recordatorios de Deudas */}
          <SettingItem styles={styles}
            icon="💸"
            title="Recordatorios de Deudas"
            subtitle={
              debtRemindersEnabled
                ? `Activo - ${reminderFrequency === 'daily' ? 'Diario' : reminderFrequency === 'weekly' ? 'Semanal' : 'Quincenal'}`
                : 'Desactivado'
            }
            onPress={handleReminderFrequency}
            rightElement={
              <Switch
                value={debtRemindersEnabled}
                onValueChange={handleToggleDebtReminders}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={debtRemindersEnabled ? '#6366F1' : '#F3F4F6'}
              />
            }
          />
          
          {/* Autenticación Biométrica - Solo para usuarios NO anónimos */}
          {canEnableBiometric && (
            <SettingItem styles={styles}
              icon="🔐"
              title={biometricType}
              subtitle={
                biometricEnabled 
                  ? t('settings.biometricEnabled')
                  : t('settings.biometricDisabled')
              }
              showArrow={false}
              rightElement={
                <Switch
                  value={biometricEnabled}
                  onValueChange={(value) => {
                    if (value) {
                      enableBiometricAuth();
                    } else {
                      disableBiometricAuth();
                    }
                  }}
                  disabled={biometricLoading}
                  trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                  thumbColor={biometricEnabled ? '#6366F1' : '#F3F4F6'}
                />
              }
            />
          )}
          
          <SettingItem styles={styles}
            icon="🎨"
            title={t('settings.themeTitle')}
            subtitle={
              themeMode === 'light' ? t('settings.themeLight') :
              themeMode === 'dark' ? t('settings.themeDark') :
              t('settings.themeAuto')
            }
            onPress={handleThemeChange}
          />
          
          <SettingItem styles={styles}
            icon="🗣️"
            title={t('settings.siriShortcuts')}
            subtitle={t('settings.siriShortcutsSubtitle')}
            onPress={() => {
              const shortcuts = AVAILABLE_SHORTCUTS.map(s => 
                `• "${s.suggestedPhrase}"\n  → ${s.title}`
              ).join('\n\n');
              
              Alert.alert(
                t('settings.siriShortcutsTitle'),
                t('settings.siriShortcutsMessage') + '\n\n' + shortcuts + '\n\n' +
                t('settings.siriInstructions') + '\n' +
                t('settings.siriStep1') + '\n' +
                t('settings.siriStep2') + '\n' +
                t('settings.siriStep3') + '\n' +
                t('settings.siriStep4') + '\n' +
                t('settings.siriStep5') + '\n' +
                t('settings.siriStep6'),
                [{ text: t('settings.understood'), style: 'default' }]
              );
            }}
          />
        </Card>

        {/* Datos y privacidad */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.dataAndPrivacy')}</Text>
          
          <SettingItem styles={styles}
            icon="🔒"
            title={t('settings.privacy')}
            subtitle={t('settings.privacySubtitle')}
            onPress={() => Alert.alert(
              t('settings.privacyConfig'),
              'LessMo respeta tu privacidad:\n\n' +
              '• Tus datos se almacenan de forma segura en Firebase\n' +
              '• Solo tú tienes acceso a tus eventos y gastos\n' +
              '• Los participantes solo ven información del evento compartido\n' +
              t('settings.privacyDetails'),
              [{ text: t('settings.understood'), style: 'default' }]
            )}
          />
          
          <SettingItem styles={styles}
            icon="📥"
            title={t('settings.exportData')}
            subtitle={t('settings.exportDataSubtitle')}
            onPress={async () => {
              Alert.alert(
                t('settings.exportTitle'),
                t('settings.exportMessage'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('settings.exportButton'),
                    onPress: async () => {
                      try {
                        if (!user?.uid) {
                          Alert.alert(t('common.error'), t('settings.exportNoUserId'));
                          return;
                        }

                        // Importar dinámicamente las funciones
                        const { getUserEvents, getEventExpenses, getEventParticipants } = await import('../services/firebase');
                        const { exportAllEventsToExcel } = await import('../utils/exportUtils');

                        // Obtener todos los eventos del usuario
                        const events = await getUserEvents(user.uid);

                        if (events.length === 0) {
                          Alert.alert(t('common.error'), t('home.noEvents'));
                          return;
                        }

                        // Obtener gastos y participantes para cada evento
                        const allExpenses: Record<string, any[]> = {};
                        const allParticipants: Record<string, any[]> = {};

                        for (const event of events) {
                          const expenses = await getEventExpenses(event.id);
                          const participants = await getEventParticipants(event.id);
                          allExpenses[event.id] = expenses;
                          allParticipants[event.id] = participants;
                        }

                        // Exportar a Excel
                        await exportAllEventsToExcel(events, allExpenses, allParticipants);
                        
                        Alert.alert(t('common.success'), t('settings.exportSuccess'));
                      } catch (error: any) {
                        
                        Alert.alert(t('common.error'), error.message || t('settings.exportError'));
                      }
                    }
                  }
                ]
              );
            }}
          />
          
          <SettingItem styles={styles}
            icon="🗑️"
            title={t('settings.deleteAccount')}
            subtitle={t('settings.deleteAccountSubtitle')}
            onPress={async () => {
              Alert.alert(
                t('settings.deleteAccountTitle'),
                t('settings.deleteAccountMessage'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        if (!user) return;
                        
                        // Confirmation step
                        Alert.alert(
                          t('common.deleteConfirmTitle'),
                          t('common.cannotUndo'),
                          [
                            { text: t('common.cancel'), style: 'cancel' },
                            {
                              text: t('common.confirm'),
                              style: 'destructive',
                              onPress: async () => {
                                // Import delete functions
                                const { deleteUser } = await import('firebase/auth');
                                const { deleteDoc, doc } = await import('firebase/firestore');
                                const { auth, db } = await import('../services/firebase');
                                
                                try {
                                  // Delete user document
                                  await deleteDoc(doc(db, 'users', user.uid));
                                  
                                  // Delete Firebase Auth account
                                  if (auth.currentUser) {
                                    await deleteUser(auth.currentUser);
                                  }
                                  
                                  Alert.alert(t('common.success'), t('settings.deleteAccountTitle'));
                                } catch (error: any) {
                                  Alert.alert(t('common.error'), t('settings.deleteAccountError'));
                                }
                              }
                            }
                          ]
                        );
                      } catch (error: any) {
                        Alert.alert('Error', error.message || 'No se pudo eliminar la cuenta');
                      }
                    }
                  }
                ]
              );
            }}
          />
        </Card>

        {/* Acerca de */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          
          <SettingItem styles={styles}
            icon="👋"
            title="Tutorial de bienvenida"
            subtitle="Ver el tutorial inicial de nuevo"
            onPress={async () => {
              Alert.alert(
                'Tutorial',
                '¿Quieres ver el tutorial de bienvenida otra vez?',
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: 'Ver tutorial',
                    onPress: async () => {
                      try {
                        const { resetOnboarding } = await import('./OnboardingScreen');
                        await resetOnboarding();
                        Alert.alert(
                          'Tutorial activado',
                          'Cierra sesión y vuelve a iniciar para ver el tutorial',
                          [{ text: 'OK' }]
                        );
                      } catch (error) {
                        Alert.alert('Error', 'No se pudo resetear el tutorial');
                      }
                    }
                  }
                ]
              );
            }}
          />
          
          <SettingItem styles={styles}
            icon="ℹ️"
            title={t('settings.version')}
            subtitle="1.0.0"
            showArrow={false}
          />
          
          <SettingItem styles={styles}
            icon="📄"
            title={t('settings.termsOfService')}
            onPress={() => Alert.alert(
              t('settings.termsTitle'),
              t('settings.termsContent'),
              [{ text: t('settings.understood'), style: 'default' }]
            )}
          />
          
          <SettingItem styles={styles}
            icon="🛡️"
            title={t('settings.privacyPolicy')}
            onPress={() => Alert.alert(
              t('settings.privacyPolicyTitle'),
              t('settings.privacyPolicyContent'),
              [{ text: t('settings.understood'), style: 'default' }]
            )}
          />
          
          <SettingItem styles={styles}
            icon="💬"
            title={t('settings.help')}
            onPress={() => Alert.alert(
              t('settings.supportTitle'),
              t('settings.supportContent'),
              [{ text: t('settings.close'), style: 'default' }]
            )}
          />
        </Card>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>{t('settings.signOut')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>LessMo v1.0.0</Text>
          <Text style={styles.footerSubtext}>{t('settings.madeWith')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.card,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 24,
    color: theme.colors.textTertiary,
    marginLeft: 8,
  },
  signOutButton: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
});
