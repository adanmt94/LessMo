/**
 * JoinEventScreen - Pantalla para unirse a un evento mediante código de invitación
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
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

type JoinEventScreenNavigationProp = StackNavigationProp<RootStackParamList, 'JoinEvent'>;
type JoinEventScreenRouteProp = RouteProp<RootStackParamList, 'JoinEvent'>;

interface Props {
  navigation: JoinEventScreenNavigationProp;
  route: JoinEventScreenRouteProp;
}

export const JoinEventScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { inviteCode: routeInviteCode } = route.params || {};
  
  const [inviteCode, setInviteCode] = useState(routeInviteCode || '');
  const [participantName, setParticipantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventFound, setEventFound] = useState<any>(null);
  const [searching, setSearching] = useState(false);

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
      } else {
        Alert.alert('Error', 'No se encontró ningún evento con este código');
        setEventFound(null);
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo buscar el evento');
      setEventFound(null);
    } finally {
      setSearching(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!eventFound) {
      Alert.alert('Error', 'Primero busca un evento válido');
      return;
    }

    if (!participantName.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre para unirte');
      return;
    }

    if (participantName.length > 50) {
      Alert.alert('Error', 'El nombre debe tener máximo 50 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Agregar participante al evento
      const participantId = await addParticipant(
        eventFound.id,
        participantName,
        0, // Sin presupuesto individual por defecto
        user?.email || undefined,
        user?.uid
      );

      Alert.alert(
        '¡Te has unido!',
        `Ahora eres parte del evento "${eventFound.name}"`,
        [
          {
            text: 'Ver Evento',
            onPress: () => navigation.replace('EventDetail', { eventId: eventFound.id }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo unir al evento');
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
            <Text style={styles.icon}>🎟️</Text>
          </View>

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
                <Text style={styles.searchingText}>Buscando evento...</Text>
              </View>
            )}
          </Card>

          {/* Evento encontrado */}
          {eventFound && !searching && (
            <Card style={styles.eventFoundCard}>
              <View style={styles.eventFoundHeader}>
                <Text style={styles.eventFoundIcon}>✓</Text>
                <Text style={styles.eventFoundTitle}>Evento Encontrado</Text>
              </View>
              
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{eventFound.name}</Text>
                {eventFound.description && (
                  <Text style={styles.eventDescription}>{eventFound.description}</Text>
                )}
                <View style={styles.eventStats}>
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatLabel}>Presupuesto</Text>
                    <Text style={styles.eventStatValue}>
                      {eventFound.currency === 'EUR' ? '€' : '$'}{eventFound.initialBudget}
                    </Text>
                  </View>
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatLabel}>Participantes</Text>
                    <Text style={styles.eventStatValue}>{eventFound.participantIds?.length || 0}</Text>
                  </View>
                </View>
              </View>

              {/* Nombre del participante */}
              <Input
                label="Tu Nombre"
                value={participantName}
                onChangeText={setParticipantName}
                placeholder="¿Cómo te llamas?"
                maxLength={50}
              />

              <Button
                title="Unirse al Evento"
                onPress={handleJoinEvent}
                loading={loading}
                disabled={loading || !participantName.trim()}
              />
            </Card>
          )}

          {/* No se encontró evento */}
          {inviteCode.length === 6 && !eventFound && !searching && (
            <Card style={styles.notFoundCard}>
              <Text style={styles.notFoundIcon}>❌</Text>
              <Text style={styles.notFoundTitle}>Evento no encontrado</Text>
              <Text style={styles.notFoundText}>
                Verifica que el código sea correcto
              </Text>
            </Card>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: '#6366F1',
    fontWeight: '300',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
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
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
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
    color: '#6B7280',
  },
  eventFoundCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  eventFoundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventFoundIcon: {
    fontSize: 24,
    marginRight: 8,
    color: '#10B981',
  },
  eventFoundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  eventInfo: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#6B7280',
    marginBottom: 4,
  },
  eventStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  notFoundCard: {
    marginBottom: 16,
    alignItems: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  notFoundIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  notFoundText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
