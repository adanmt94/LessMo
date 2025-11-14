/**
 * CreateEventScreen - Pantalla para crear nuevo evento
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Currency, VALIDATION } from '../types';
import { Button, Input, Card } from '../components/lovable';
import { createEvent, addParticipant, getEvent, getEventParticipants } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

type CreateEventScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateEvent'>;
type CreateEventScreenRouteProp = RouteProp<RootStackParamList, 'CreateEvent'>;

interface Props {
  navigation: CreateEventScreenNavigationProp;
  route: CreateEventScreenRouteProp;
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

export const CreateEventScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { eventId, mode, groupId } = route.params || {};
  const isEditMode = mode === 'edit' && eventId;
  
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [groupBudget, setGroupBudget] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { id: '1', name: '', budget: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!isEditMode);

  // Cargar datos del evento si estamos en modo edición
  useEffect(() => {
    if (isEditMode) {
      loadEventData();
    }
  }, [eventId, mode]);

  const loadEventData = async () => {
    try {
      setInitialLoading(true);
      const [eventData, participantsData] = await Promise.all([
        getEvent(eventId!),
        getEventParticipants(eventId!)
      ]);

      if (eventData) {
        setEventName(eventData.name);
        setDescription(eventData.description || '');
        setGroupBudget(eventData.initialBudget.toString());
        setCurrency(eventData.currency);
        
        // Cargar participantes existentes
        if (participantsData.length > 0) {
          setParticipants(
            participantsData.map(p => ({
              id: p.id,
              name: p.name,
              budget: p.individualBudget.toString(),
              email: p.email
            }))
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los datos del evento');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

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

    // Filtrar participantes válidos (solo nombre es obligatorio)
    const validParticipants = participants.filter(
      (p) => p.name.trim()
    );

    if (validParticipants.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos un participante');
      return;
    }

    // Validar presupuestos (solo si están definidos)
    for (const p of validParticipants) {
      if (p.budget.trim()) {
        const budget = parseFloat(p.budget);
        if (isNaN(budget) || budget < VALIDATION.MIN_AMOUNT || budget > VALIDATION.MAX_AMOUNT) {
          Alert.alert(
            'Error',
            `El presupuesto debe estar entre ${VALIDATION.MIN_AMOUNT} y ${VALIDATION.MAX_AMOUNT}`
          );
          return;
        }
      }
    }

    setLoading(true);

    try {
      console.log('🎯 Creando evento con participantes:', validParticipants);
      
      // Calcular presupuesto total (usar presupuesto grupal o suma de individuales)
      let totalBudget = 0;
      if (groupBudget.trim()) {
        totalBudget = parseFloat(groupBudget);
      } else {
        totalBudget = validParticipants.reduce(
          (sum, p) => sum + (p.budget.trim() ? parseFloat(p.budget) : 0),
          0
        );
      }

      console.log('💰 Presupuesto total:', totalBudget);

      // Crear evento
      const eventId = await createEvent(
        eventName,
        totalBudget,
        currency,
        user!.uid,
        description,
        groupId // Asociar con grupo si viene desde un grupo
      );

      console.log('✅ Evento creado con ID:', eventId);

      // Calcular presupuesto individual por defecto
      const groupBudgetNum = groupBudget.trim() ? parseFloat(groupBudget) : 0;
      const defaultIndividualBudget = groupBudgetNum > 0 
        ? groupBudgetNum / validParticipants.length 
        : 0;
      console.log('💰 Presupuesto individual por defecto:', defaultIndividualBudget);

      // Agregar participantes
      for (const participant of validParticipants) {
        // Si el participante tiene presupuesto individual, usarlo
        // Si no, usar el presupuesto grupal dividido equitativamente
        const budget = participant.budget.trim() 
          ? parseFloat(participant.budget) 
          : defaultIndividualBudget;
        console.log('👤 Agregando participante:', participant.name, 'con presupuesto:', budget);
        const participantId = await addParticipant(
          eventId,
          participant.name,
          budget,
          participant.email
        );
        console.log('✅ Participante agregado con ID:', participantId);
      }

      Alert.alert('¡Evento creado!', 'El evento se ha creado correctamente', [
        {
          text: 'OK',
          onPress: () => {
            // Usar replace para evitar volver a CreateEvent
            navigation.replace('EventDetail', { eventId });
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el evento');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text }}>Cargando datos del evento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.headerBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Atrás</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {isEditMode ? 'Editar participantes' : 'Crear nuevo evento'}
          </Text>

          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Información del evento</Text>

            <Input
              label="Nombre del evento *"
              placeholder="Ej: Viaje a Barcelona"
              value={eventName}
              onChangeText={setEventName}
              maxLength={VALIDATION.MAX_EVENT_NAME_LENGTH}
              autoCapitalize="words"
              autoCorrect={true}
              editable={!isEditMode}
            />

            <Input
              label="Descripción (opcional)"
              placeholder="Describe el evento..."
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!isEditMode}
              numberOfLines={3}
              maxLength={VALIDATION.MAX_DESCRIPTION_LENGTH}
              autoCapitalize="sentences"
              autoCorrect={true}
            />

            <Input
              label="Presupuesto grupal total (opcional)"
              placeholder="0.00"
              value={groupBudget}
              onChangeText={setGroupBudget}
              keyboardType="decimal-pad"
              editable={!isEditMode}
            />

            <Text style={styles.label}>Moneda *</Text>
            <TouchableOpacity
              style={styles.currencySelector}
              onPress={() => !isEditMode && setShowCurrencyPicker(!showCurrencyPicker)}
              disabled={!!isEditMode}
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
                  label="Presupuesto individual (opcional)"
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
            title={isEditMode ? "Guardar cambios" : "Crear evento"}
            onPress={handleCreateEvent}
            loading={loading}
            fullWidth
            size="large"
          />
          
          {isEditMode && (
            <Text style={styles.editModeNote}>
              💡 En modo edición solo puedes agregar/quitar participantes. Para cambiar el nombre o presupuesto del evento, ve a la pantalla principal.
            </Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
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
  editModeNote: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
