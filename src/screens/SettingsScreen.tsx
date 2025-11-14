/**
 * SettingsScreen - Pantalla de ajustes y configuración
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Card } from '../components/lovable';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../hooks/useLanguage';
import { useCurrency } from '../hooks/useCurrency';
import { useNotifications } from '../hooks/useNotifications';

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
  const { currentLanguage, availableLanguages, changeLanguage } = useLanguage();
  const { currentCurrency, availableCurrencies, changeCurrency } = useCurrency();
  const { notificationsEnabled, toggleNotifications, isLoading } = useNotifications();
  const darkModeEnabled = theme.isDark;
  const styles = getStyles(theme);

  const handleLanguageChange = () => {
    Alert.alert(
      'Seleccionar idioma',
      'Elige el idioma de la aplicación',
      availableLanguages.map(lang => ({
        text: `${lang.nativeName} (${lang.name})`,
        onPress: async () => {
          await changeLanguage(lang.code);
          Alert.alert('Idioma cambiado', `El idioma se ha cambiado a ${lang.nativeName}`);
        },
      })),
      { cancelable: true }
    );
  };

  const handleCurrencyChange = () => {
    Alert.alert(
      'Seleccionar moneda',
      'Elige la moneda predeterminada para nuevos eventos',
      availableCurrencies.map(curr => ({
        text: `${curr.name} (${curr.symbol})`,
        onPress: async () => {
          await changeCurrency(curr.code);
          Alert.alert('Moneda cambiada', `La moneda predeterminada ahora es ${curr.name}`);
        },
      })),
      { cancelable: true }
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
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // La navegación se manejará automáticamente por el AuthContext
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ajustes</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Perfil */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{user?.displayName || 'Usuario'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'Usuario anónimo'}</Text>
            </View>
          </View>

          <SettingItem styles={styles}
            icon="✏️"
            title="Editar perfil"
            subtitle="Cambiar nombre y foto"
            onPress={() => navigation.navigate('EditProfile')}
          />
        </Card>

        {/* Preferencias */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          
          <SettingItem styles={styles}
            icon="🌍"
            title="Idioma"
            subtitle={currentLanguage.nativeName}
            onPress={handleLanguageChange}
          />
          
          <SettingItem styles={styles}
            icon="💰"
            title="Moneda predeterminada"
            subtitle={`${currentCurrency.name} (${currentCurrency.symbol})`}
            onPress={handleCurrencyChange}
          />
          
          <SettingItem styles={styles}
            icon="🔔"
            title="Notificaciones"
            subtitle="Alertas de gastos y liquidaciones"
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
            icon="🌙"
            title="Modo oscuro"
            subtitle="Tema oscuro de la app"
            showArrow={false}
            rightElement={
              <Switch
                value={darkModeEnabled}
                onValueChange={async (value) => {
                  await setThemeMode(value ? 'dark' : 'light');
                }}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={darkModeEnabled ? '#6366F1' : '#F3F4F6'}
              />
            }
          />
        </Card>

        {/* Datos y privacidad */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Datos y privacidad</Text>
          
          <SettingItem styles={styles}
            icon="🔒"
            title="Privacidad"
            subtitle="Gestionar datos y privacidad"
            onPress={() => Alert.alert('Próximamente', 'Configuración de privacidad')}
          />
          
          <SettingItem styles={styles}
            icon="📥"
            title="Exportar datos"
            subtitle="Descargar todos tus eventos a Excel"
            onPress={async () => {
              Alert.alert(
                'Exportar datos',
                'Se exportarán todos tus eventos con sus gastos y participantes a un archivo Excel.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Exportar',
                    onPress: async () => {
                      try {
                        if (!user?.uid) {
                          Alert.alert('Error', 'No se pudo obtener el ID del usuario');
                          return;
                        }

                        // Importar dinámicamente las funciones
                        const { getUserEvents, getEventExpenses, getEventParticipants } = await import('../services/firebase');
                        const { exportAllEventsToExcel } = await import('../utils/exportUtils');

                        // Obtener todos los eventos del usuario
                        const events = await getUserEvents(user.uid);

                        if (events.length === 0) {
                          Alert.alert('Info', 'No tienes eventos para exportar');
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
                        
                        Alert.alert('Éxito', `Se exportaron ${events.length} evento(s) correctamente`);
                      } catch (error: any) {
                        console.error('Error al exportar:', error);
                        Alert.alert('Error', error.message || 'No se pudo exportar');
                      }
                    }
                  }
                ]
              );
            }}
          />
          
          <SettingItem styles={styles}
            icon="🗑️"
            title="Eliminar cuenta"
            subtitle="Borrar permanentemente tu cuenta"
            onPress={() => Alert.alert(
              'Eliminar cuenta',
              'Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive' },
              ]
            )}
          />
        </Card>

        {/* Acerca de */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          
          <SettingItem styles={styles}
            icon="ℹ️"
            title="Versión de la app"
            subtitle="1.0.0"
            showArrow={false}
          />
          
          <SettingItem styles={styles}
            icon="📄"
            title="Términos y condiciones"
            onPress={() => Alert.alert('Próximamente', 'Términos y condiciones')}
          />
          
          <SettingItem styles={styles}
            icon="🛡️"
            title="Política de privacidad"
            onPress={() => Alert.alert('Próximamente', 'Política de privacidad')}
          />
          
          <SettingItem styles={styles}
            icon="💬"
            title="Soporte y ayuda"
            onPress={() => Alert.alert('Próximamente', 'Centro de ayuda')}
          />
        </Card>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>LessMo v1.0.0</Text>
          <Text style={styles.footerSubtext}>Hecho con ❤️</Text>
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
    paddingBottom: 100, // Espacio para la barra de tabs
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
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginTop: 32,
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
