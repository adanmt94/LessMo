/**
 * JoinEventScreen - Pantalla para unirse a un evento mediante código de invitación
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Button, Input, Card } from '../components/lovable';
import { getEventByInviteCode, addParticipant } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type JoinEventScreenNavigationProp = StackNavigationProp<RootStackParamList, 'JoinEvent'>;
type JoinEventScreenRouteProp = RouteProp<RootStackParamList, 'JoinEvent'>;

interface Props {
  navigation: JoinEventScreenNavigationProp;
  route: JoinEventScreenRouteProp;
}
export const JoinEventScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const { inviteCode: routeInviteCode } = route.params || {};
  
  const [inviteCode, setInviteCode] = useState(routeInviteCode || '');
  const [participantName, setParticipantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventFound, setEventFound] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [existingParticipants, setExistingParticipants] = useState<any[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);

  useEffect(() => {
    if (routeInviteCode) {
      searchEvent(routeInviteCode);
    }
  }, [routeInviteCode]);

  const searchEvent = async (code: string) => {
    if (!code.trim() || code.length < 6) return;

    try {
      setSearching(true);
      const event = await getEventByInviteCode(code);
      
      if (event) {
        setEventFound(event);
        
        // Cargar participantes existentes del evento
        const { getEventParticipants } = await import('../services/firebase');
        const participants = await getEventParticipants(event.id);
        setExistingParticipants(participants);
      } else {
        Alert.alert(t('common.error'), t('joinEvent.notFoundMessage'));
        setEventFound(null);
        setExistingParticipants([]);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), t('joinEvent.errorJoining'));
      setEventFound(null);
      setExistingParticipants([]);
    } finally {
      setSearching(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!eventFound) {
      Alert.alert(t('common.error'), t('joinEvent.codeRequired'));
      return;
    }

    // Si seleccionó un participante existente
    if (selectedParticipantId && !showCreateNew) {
      const selectedParticipant = existingParticipants.find(p => p.id === selectedParticipantId);
      if (!selectedParticipant) return;

      setLoading(true);
      try {
        // Vincular el userId actual al participante seleccionado
        const { updateDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        
        await updateDoc(doc(db, 'events', eventFound.id, 'participants', selectedParticipantId), {
          userId: user?.uid,
          email: user?.email || null
        });

        Alert.alert(
          t('common.success'),
          `Te has unido como "${selectedParticipant.name}"`,
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('EventDetail', { eventId: eventFound.id }),
            },
          ]
        );
      } catch (error: any) {
        
        Alert.alert(t('common.error'), t('joinEvent.errorJoining'));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Si va a crear un nuevo participante
    if (!participantName.trim()) {
      Alert.alert(t('common.error'), 'Por favor ingresa tu nombre');
      return;
    }

    if (participantName.length > 50) {
      Alert.alert(t('common.error'), t('createGroup.nameTooLong'));
      return;
    }

    setLoading(true);

    try {
      // VERIFICAR SI YA ES PARTICIPANTE (evitar duplicados)
      if (user?.uid) {
        const alreadyParticipant = existingParticipants.find(p => p.userId === user.uid);
        
        if (alreadyParticipant) {
          Alert.alert(
            t('joinEvent.alreadyJoined'),
            `Ya estás unido a "${eventFound.name}" como "${alreadyParticipant.name}"`,
            [
              {
                text: t('common.confirm'),
                onPress: () => navigation.replace('EventDetail', { eventId: eventFound.id }),
              },
            ]
          );
          setLoading(false);
          return;
        }
      }

      // Agregar nuevo participante al evento
      const participantId = await addParticipant(
        eventFound.id,
        participantName,
        0, // Sin presupuesto individual por defecto
        user?.email || undefined,
        user?.uid
      );

      Alert.alert(
        t('common.success'),
        t('joinEvent.joined'),
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('EventDetail', { eventId: eventFound.id }),
          },
        ]
      );
    } catch (error: any) {
      
      Alert.alert(
        'Error', 
        error.message || 'No se pudo unir al grupo. Verifica que tengas permisos.'
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
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎟️</Text>
          </View>

          <Text style={styles.instructions}>
            Ingresa el código de invitación de 6 dígitos para unirte a un grupo
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
                  searchEvent(upperText);
                }
              }}
              placeholder="Ej: ABC123"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            {searching && (
              <View style={styles.searchingContainer}>
                <ActivityIndicator color="#6366F1" />
                <Text style={styles.searchingText}>{t('joinEvent.searching')}</Text>
              </View>
            )}
          </Card>

          {/* Evento encontrado */}
          {eventFound && !searching && (
            <Card style={styles.eventFoundCard}>
              <View style={styles.eventFoundHeader}>
                <Text style={styles.eventFoundIcon}>✓</Text>
                <Text style={styles.eventFoundTitle}>{t('joinEvent.found')}</Text>
              </View>
              
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{eventFound.name}</Text>
                {eventFound.description && (
                  <Text style={styles.eventDescription}>{eventFound.description}</Text>
                )}
                <View style={styles.eventStats}>
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatLabel}>{t('joinEvent.budget')}</Text>
                    <Text style={styles.eventStatValue}>
                      {eventFound.currency === 'EUR' ? '€' : '$'}{eventFound.initialBudget}
                    </Text>
                  </View>
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatLabel}>{t('joinEvent.participants')}</Text>
                    <Text style={styles.eventStatValue}>{eventFound.participantIds?.length || 0}</Text>
                  </View>
                </View>
              </View>

              {/* Selección de participante existente */}
              {existingParticipants.length > 0 && !showCreateNew && (
                <View style={styles.participantSelection}>
                  <Text style={styles.selectionTitle}>{t('joinEvent.selectParticipant')}</Text>
                  {existingParticipants.map((participant) => (
                    <TouchableOpacity
                      key={participant.id}
                      style={[
                        styles.participantOption,
                        selectedParticipantId === participant.id && styles.participantOptionSelected,
                        participant.userId && styles.participantOptionDisabled
                      ]}
                      onPress={() => !participant.userId && setSelectedParticipantId(participant.id)}
                      disabled={!!participant.userId}
                    >
                      <View style={styles.participantOptionContent}>
                        <Text style={[
                          styles.participantOptionName,
                          selectedParticipantId === participant.id && styles.participantOptionNameSelected,
                          participant.userId && styles.participantOptionNameDisabled
                        ]}>
                          {participant.name}
                        </Text>
                        {participant.userId && (
                          <Text style={styles.participantLinked}>{t('joinEvent.alreadyLinked')}</Text>
                        )}
                      </View>
                      {selectedParticipantId === participant.id && !participant.userId && (
                        <Text style={styles.participantCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.createNewButton}
                    onPress={() => {
                      setShowCreateNew(true);
                      setSelectedParticipantId(null);
                    }}
                  >
                    <Text style={styles.createNewButtonText}>{t('joinEvent.createNew')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Formulario para crear nuevo participante */}
              {(showCreateNew || existingParticipants.length === 0) && (
                <View style={styles.newParticipantForm}>
                  {showCreateNew && (
                    <TouchableOpacity
                      style={styles.backToListButton}
                      onPress={() => {
                        setShowCreateNew(false);
                        setParticipantName('');
                      }}
                    >
                      <Text style={styles.backToListButtonText}>{t('joinEvent.backToList')}</Text>
                    </TouchableOpacity>
                  )}
                  <Input
                    label="Tu Nombre"
                    value={participantName}
                    onChangeText={setParticipantName}
                    placeholder="¿Cómo te llamas?"
                    maxLength={50}
                  />
                </View>
              )}

              <Button
                title={selectedParticipantId && !showCreateNew ? t('joinEvent.confirmIdentity') : t('joinEvent.joinButton')}
                onPress={handleJoinEvent}
                loading={loading}
                disabled={loading || (!selectedParticipantId && !participantName.trim())}
              />
            </Card>
          )}

          {/* No se encontró evento */}
          {inviteCode.length === 6 && !eventFound && !searching && (
            <Card style={styles.notFoundCard}>
              <Text style={styles.notFoundIcon}>❌</Text>
              <Text style={styles.notFoundTitle}>{t('joinEvent.notFound')}</Text>
              <Text style={styles.notFoundText}>
                {t('joinEvent.notFoundMessage')}
              </Text>
            </Card>
          )}
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: theme.colors.primary,
    fontWeight: '300',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  icon: {
    fontSize: 64,
  },
  instructions: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  section: {
    marginBottom: 16,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  searchingText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  eventFoundCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  eventFoundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventFoundIcon: {
    fontSize: 24,
    marginRight: 8,
    color: theme.colors.success,
  },
  eventFoundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success,
  },
  eventInfo: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: theme.isDark ? theme.colors.surface : '#F0FDF4',
    borderRadius: 8,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  eventStats: {
    flexDirection: 'row',
    gap: 16,
  },
  eventStat: {
    flex: 1,
  },
  eventStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  eventStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  notFoundCard: {
    marginBottom: 16,
    alignItems: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  notFoundIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: 8,
  },
  notFoundText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  participantSelection: {
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  participantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.isDark ? theme.colors.surface : '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  participantOptionSelected: {
    backgroundColor: theme.isDark ? theme.colors.primary + '20' : theme.colors.primary + '10',
    borderColor: theme.colors.primary,
  },
  participantOptionDisabled: {
    opacity: 0.5,
    backgroundColor: theme.isDark ? theme.colors.surface : '#E5E7EB',
  },
  participantOptionContent: {
    flex: 1,
  },
  participantOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  participantOptionNameSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  participantOptionNameDisabled: {
    color: theme.colors.textSecondary,
  },
  participantLinked: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  participantCheckmark: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  createNewButton: {
    padding: 16,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    marginTop: 8,
    alignItems: 'center',
  },
  createNewButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  newParticipantForm: {
    marginBottom: 16,
  },
  backToListButton: {
    marginBottom: 12,
  },
  backToListButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});
