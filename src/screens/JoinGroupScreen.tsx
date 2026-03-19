/**
 * JoinGroupScreen - Pantalla para unirse a un evento mediante código de invitación
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Button, Input, Card } from '../components/lovable';
import { getGroupByInviteCode, addGroupMember } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type JoinGroupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'JoinGroup'>;
type JoinGroupScreenRouteProp = RouteProp<RootStackParamList, 'JoinGroup'>;

interface Props {
  navigation: JoinGroupScreenNavigationProp;
  route: JoinGroupScreenRouteProp;
}

export const JoinGroupScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const { inviteCode: routeInviteCode } = route.params || {};
  
  const [inviteCode, setInviteCode] = useState(routeInviteCode || '');
  const [loading, setLoading] = useState(false);
  const [groupFound, setGroupFound] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (routeInviteCode) {
      searchGroup(routeInviteCode);
    }
  }, [routeInviteCode]);

  const searchGroup = async (code: string) => {
    if (!code.trim() || code.length < 6) return;

    try {
      setSearching(true);
      const group = await getGroupByInviteCode(code);
      
      if (group) {
        setGroupFound(group);
      } else {
        Alert.alert(t('common.error'), 'Código de evento inválido');
        setGroupFound(null);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Error al buscar el evento');
      setGroupFound(null);
    } finally {
      setSearching(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupFound) {
      Alert.alert(t('common.error'), 'Debes ingresar un código válido');
      return;
    }

    if (!user?.uid) {
      Alert.alert(t('common.error'), 'Debes iniciar sesión para unirte');
      return;
    }

    setLoading(true);

    try {
      // Verificar si ya es miembro
      const currentMembers = groupFound.memberIds || [];
      if (currentMembers.includes(user.uid)) {
        Alert.alert(
          'Ya eres miembro',
          `Ya perteneces al evento "${groupFound.name}"`,
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('GroupEvents', { 
                groupId: groupFound.id,
                groupName: groupFound.name,
                groupIcon: groupFound.icon,
                groupColor: groupFound.color
              }),
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Agregar usuario al evento
      await addGroupMember(groupFound.id, user.uid);

      Alert.alert(
        t('common.success'),
        `Te has unido al evento "${groupFound.name}"`,
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('GroupEvents', { 
              groupId: groupFound.id,
              groupName: groupFound.name,
              groupIcon: groupFound.icon,
              groupColor: groupFound.color
            }),
          },
        ]
      );
    } catch (error: any) {
      
      Alert.alert(
        'Error', 
        error.message || 'No se pudo unir al evento. Verifica que tengas permisos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>👥</Text>
          </View>

          <Text style={styles.title}>Unirse a Evento</Text>
          <Text style={styles.instructions}>
            Ingresa el código de invitación de 6 dígitos para unirte a un evento
          </Text>

          {/* Código de invitación */}
          <Card style={styles.section}>
            <Input
              label="Código de Invitación"
              value={inviteCode}
              onChangeText={(text) => {
                const upperText = text.toUpperCase();
                setInviteCode(upperText);
                if (upperText.length === 6) {
                  searchGroup(upperText);
                }
              }}
              placeholder="Ej: ABC123"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            {searching && (
              <View style={styles.searchingContainer}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={styles.searchingText}>Buscando evento...</Text>
              </View>
            )}
          </Card>

          {/* Evento encontrado */}
          {groupFound && !searching && (
            <Card style={styles.groupFoundCard}>
              <View style={styles.groupFoundHeader}>
                <Text style={styles.groupFoundIcon}>✓</Text>
                <Text style={styles.groupFoundTitle}>¡Evento encontrado!</Text>
              </View>
              
              <View style={styles.groupInfo}>
                <Text style={styles.groupIcon}>{groupFound.icon || '👥'}</Text>
                <Text style={styles.groupName}>{groupFound.name}</Text>
                {groupFound.description && (
                  <Text style={styles.groupDescription}>{groupFound.description}</Text>
                )}
                <View style={styles.groupStats}>
                  <View style={styles.groupStat}>
                    <Text style={styles.groupStatLabel}>Miembros</Text>
                    <Text style={styles.groupStatValue}>
                      {(groupFound.memberIds || []).length}
                    </Text>
                  </View>
                  <View style={styles.groupStat}>
                    <Text style={styles.groupStatLabel}>Eventos</Text>
                    <Text style={styles.groupStatValue}>
                      {(groupFound.eventIds || []).length}
                    </Text>
                  </View>
                </View>
              </View>

              <Button
                title="Unirse al Evento"
                onPress={handleJoinGroup}
                loading={loading}
              />
            </Card>
          )}

          {/* Si no se ha encontrado y no está buscando */}
          {!groupFound && !searching && inviteCode.length === 6 && (
            <Card style={styles.notFoundCard}>
              <Text style={styles.notFoundIcon}>❌</Text>
              <Text style={styles.notFoundText}>
                No se encontró ningún evento con ese código
              </Text>
              <Text style={styles.notFoundHint}>
                Verifica que el código sea correcto
              </Text>
            </Card>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 72,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  searchingText: {
    marginLeft: 12,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  groupFoundCard: {
    borderColor: theme.colors.success,
    borderWidth: 2,
  },
  groupFoundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupFoundIcon: {
    fontSize: 24,
    color: theme.colors.success,
    marginRight: 8,
  },
  groupFoundTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.success,
  },
  groupInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  groupIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 32,
  },
  groupStat: {
    alignItems: 'center',
  },
  groupStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  groupStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  notFoundCard: {
    alignItems: 'center',
    padding: 24,
  },
  notFoundIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
