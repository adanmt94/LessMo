/**
 * CreateEventScreen - Pantalla para crear nuevo evento
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Currency, VALIDATION } from '../types';
import { Button, Input, Card } from '../components/lovable';
import { createEvent, addParticipant } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';

type CreateEventScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateEvent'>;

interface Props {
  navigation: CreateEventScreenNavigationProp;
}

interface ParticipantInput {
  id: string;
  name: string;
  budget: string;
  email?: string;
}

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'EUR', label: '€ Euro' },
  { value: 'USD', label: '$ Dólar' },
  { value: 'GBP', label: '£ Libra' },
  { value: 'MXN', label: '$ Peso Mexicano' },
  { value: 'ARS', label: '$ Peso Argentino' },
  { value: 'COP', label: '$ Peso Colombiano' },
  { value: 'CLP', label: '$ Peso Chileno' },
  { value: 'BRL', label: 'R$ Real' },
];

export const CreateEventScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { id: '1', name: '', budget: '' },
  ]);
  const [loading, setLoading] = useState(false);

  const addParticipantField = () => {
    if (participants.length >= VALIDATION.MAX_PARTICIPANTS) {
      Alert.alert('Límite alcanzado', `Máximo ${VALIDATION.MAX_PARTICIPANTS} participantes`);
      return;
    }
    
    setParticipants([
      ...participants,
      { id: Date.now().toString(), name: '', budget: '' },
    ]);
  };

  const removeParticipantField = (id: string) => {
    if (participants.length === 1) {
      Alert.alert('Error', 'Debe haber al menos un participante');
      return;
    }
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const updateParticipant = (id: string, field: keyof ParticipantInput, value: string) => {
    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleCreateEvent = async () => {
    // Validaciones
    if (!eventName.trim()) {
      Alert.alert('Error', 'El nombre del evento es obligatorio');
      return;
    }

    if (eventName.length > VALIDATION.MAX_EVENT_NAME_LENGTH) {
      Alert.alert('Error', `El nombre debe tener máximo ${VALIDATION.MAX_EVENT_NAME_LENGTH} caracteres`);
      return;
    }

    const validParticipants = participants.filter(
      (p) => p.name.trim() && p.budget.trim()
    );

    if (validParticipants.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos un participante con presupuesto');
      return;
    }

    // Validar presupuestos
    for (const p of validParticipants) {
      const budget = parseFloat(p.budget);
      if (isNaN(budget) || budget < VALIDATION.MIN_AMOUNT || budget > VALIDATION.MAX_AMOUNT) {
        Alert.alert(
          'Error',
          `El presupuesto debe estar entre ${VALIDATION.MIN_AMOUNT} y ${VALIDATION.MAX_AMOUNT}`
        );
        return;
      }
    }

    setLoading(true);

    try {
      // Calcular presupuesto total
      const totalBudget = validParticipants.reduce(
        (sum, p) => sum + parseFloat(p.budget),
        0
      );

      // Crear evento
      const eventId = await createEvent(
        eventName,
        totalBudget,
        currency,
        user!.uid,
        description
      );

      // Agregar participantes
      for (const participant of validParticipants) {
        await addParticipant(
          eventId,
          participant.name,
          parseFloat(participant.budget),
          participant.email
        );
      }

      Alert.alert('¡Evento creado!', 'El evento se ha creado correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('EventDetail', { eventId }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el evento');
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Crear nuevo evento</Text>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Información del evento</Text>

            <Input
              label="Nombre del evento *"
              placeholder="Ej: Viaje a Barcelona"
              value={eventName}
              onChangeText={setEventName}
              maxLength={VALIDATION.MAX_EVENT_NAME_LENGTH}
              autoCapitalize="words"
              autoCorrect={true}
            />

            <Input
              label="Descripción (opcional)"
              placeholder="Describe el evento..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={VALIDATION.MAX_DESCRIPTION_LENGTH}
              autoCapitalize="sentences"
              autoCorrect={true}
            />

            <Text style={styles.label}>Moneda *</Text>
            <TouchableOpacity
              style={styles.currencySelector}
              onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
            >
              <Text style={styles.currencyText}>
                {CURRENCIES.find((c) => c.value === currency)?.label}
              </Text>
              <Text style={styles.currencyArrow}>▼</Text>
            </TouchableOpacity>

            {showCurrencyPicker && (
              <View style={styles.currencyPicker}>
                {CURRENCIES.map((curr) => (
                  <TouchableOpacity
                    key={curr.value}
                    style={styles.currencyOption}
                    onPress={() => {
                      setCurrency(curr.value);
                      setShowCurrencyPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.currencyOptionText,
                        currency === curr.value && styles.currencyOptionSelected,
                      ]}
                    >
                      {curr.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>

          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Participantes</Text>
              <TouchableOpacity onPress={addParticipantField}>
                <Text style={styles.addButton}>+ Agregar</Text>
              </TouchableOpacity>
            </View>

            {participants.map((participant, index) => (
              <View key={participant.id} style={styles.participantItem}>
                <View style={styles.participantHeader}>
                  <Text style={styles.participantNumber}>
                    Participante {index + 1}
                  </Text>
                  {participants.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeParticipantField(participant.id)}
                    >
                      <Text style={styles.removeButton}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Input
                  label="Nombre *"
                  placeholder="Nombre del participante"
                  value={participant.name}
                  onChangeText={(text) =>
                    updateParticipant(participant.id, 'name', text)
                  }
                  autoCapitalize="words"
                  autoCorrect={true}
                  textContentType="name"
                />

                <Input
                  label="Presupuesto individual *"
                  placeholder="0.00"
                  value={participant.budget}
                  onChangeText={(text) =>
                    updateParticipant(participant.id, 'budget', text)
                  }
                  keyboardType="decimal-pad"
                  autoCorrect={false}
                />

                <Input
                  label="Email (opcional)"
                  placeholder="email@ejemplo.com"
                  value={participant.email}
                  onChangeText={(text) =>
                    updateParticipant(participant.id, 'email', text)
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />
              </View>
            ))}
          </Card>

          <Button
            title="Crear evento"
            onPress={handleCreateEvent}
            loading={loading}
            fullWidth
            size="large"
          />
        </ScrollView>
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
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  currencySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  currencyText: {
    fontSize: 16,
    color: '#111827',
  },
  currencyArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  currencyPicker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  currencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  currencyOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  currencyOptionSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  addButton: {
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 16,
  },
  participantItem: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  removeButton: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '600',
  },
});
