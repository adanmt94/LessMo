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
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
  const styles = getStyles(theme);
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
      Alert.alert(t('common.error'), t('createEvent.errorLoadingEvent'));
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const addParticipantField = () => {
    if (participants.length >= VALIDATION.MAX_PARTICIPANTS) {
      Alert.alert(t('createEvent.maxParticipantsReached'), t('createEvent.maxParticipantsMessage', { max: VALIDATION.MAX_PARTICIPANTS }));
      return;
    }
    
    setParticipants([
      ...participants,
      { id: `temp-${Date.now()}`, name: '', budget: '' },
    ]);
  };

  const removeParticipantField = async (id: string) => {
    if (participants.length === 1) {
      Alert.alert(t('common.error'), t('createEvent.minParticipantError'));
      return;
    }
    
    // Si estamos en modo edición y el ID no es temporal (Date.now()), eliminar de Firebase
    if (isEditMode && !id.startsWith('temp-')) {
      Alert.alert(
        t('common.deleteConfirmTitle'),
        t('createEvent.deleteParticipantConfirm'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel'
          },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                const { deleteParticipant } = await import('../services/firebase');
                await deleteParticipant(id);
                setParticipants(participants.filter((p) => p.id !== id));
                Alert.alert(t('common.success'), t('createEvent.participantDeleted'));
              } catch (error: any) {
                Alert.alert(t('common.error'), error.message);
              }
            }
          }
        ]
      );
    } else {
      // Si es un participante nuevo (aún no guardado), solo quitarlo del estado
      setParticipants(participants.filter((p) => p.id !== id));
    }
  };

  const updateParticipant = (id: string, field: keyof ParticipantInput, value: string) => {
    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleCreateEvent = async () => {
    
    
    // Validaciones
    if (!eventName.trim()) {
      Alert.alert(t('common.error'), t('createEvent.nameRequired'));
      return;
    }

    if (eventName.length > VALIDATION.MAX_EVENT_NAME_LENGTH) {
      Alert.alert(t('common.error'), t('createEvent.nameTooLong', { max: VALIDATION.MAX_EVENT_NAME_LENGTH }));
      return;
    }

    // Filtrar participantes válidos (solo nombre es obligatorio)
    const validParticipants = participants.filter(
      (p) => p.name.trim()
    );

    if (validParticipants.length === 0) {
      Alert.alert(t('common.error'), t('createEvent.noParticipants'));
      return;
    }

    // Validar presupuestos (solo si están definidos)
    for (const p of validParticipants) {
      if (p.budget.trim()) {
        const budget = parseFloat(p.budget);
        if (isNaN(budget) || budget < VALIDATION.MIN_AMOUNT || budget > VALIDATION.MAX_AMOUNT) {
          Alert.alert(
            t('common.error'),
            t('createEvent.budgetRange', { min: VALIDATION.MIN_AMOUNT, max: VALIDATION.MAX_AMOUNT })
          );
          return;
        }
      }
    }

    setLoading(true);

    try {
      
      
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

      

      // Crear evento
      
      const eventId = await createEvent(
        eventName,
        totalBudget,
        currency,
        user!.uid,
        description,
        groupId // Asociar con grupo si viene desde un grupo
      );

      

      // Calcular presupuesto individual por defecto
      const groupBudgetNum = groupBudget.trim() ? parseFloat(groupBudget) : 0;
      const defaultIndividualBudget = groupBudgetNum > 0 
        ? groupBudgetNum / validParticipants.length 
        : 0;
      

      // Agregar participantes
      for (const participant of validParticipants) {
        // Si el participante tiene presupuesto individual, usarlo
        // Si no, usar el presupuesto grupal dividido equitativamente
        const budget = participant.budget.trim() 
          ? parseFloat(participant.budget) 
          : defaultIndividualBudget;
        
        const participantId = await addParticipant(
          eventId,
          participant.name,
          budget,
          participant.email
        );
        
      }

      Alert.alert(t('common.success'), t('createEvent.eventCreated'), [
        {
          text: 'OK',
          onPress: () => {
            // Usar replace para evitar volver a CreateEvent
            navigation.replace('EventDetail', { eventId });
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('createEvent.errorCreating'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text }}>{t('createEvent.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
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
            {isEditMode ? t('createEvent.editTitle') : t('createEvent.title')}
          </Text>

          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('createEvent.eventInfo')}</Text>

            <Input
              label={t('createEvent.eventNameLabel')}
              placeholder={t('createEvent.eventNamePlaceholder')}
              value={eventName}
              onChangeText={setEventName}
              maxLength={VALIDATION.MAX_EVENT_NAME_LENGTH}
              autoCapitalize="words"
              autoCorrect={true}
              editable={!isEditMode}
            />

            <Input
              label={t('createEvent.descriptionLabel')}
              placeholder={t('createEvent.descriptionPlaceholder')}
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
              label={t('createEvent.groupBudgetLabel')}
              placeholder={t('createEvent.groupBudgetPlaceholder')}
              value={groupBudget}
              onChangeText={setGroupBudget}
              keyboardType="decimal-pad"
              editable={!isEditMode}
            />

            <Text style={styles.label}>{t('createEvent.currencyLabel')}</Text>
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
              <Text style={styles.sectionTitle}>{t('createEvent.participantsTitle')}</Text>
              <TouchableOpacity onPress={addParticipantField}>
                <Text style={styles.addButton}>{t('createEvent.addParticipant')}</Text>
              </TouchableOpacity>
            </View>

            {participants.map((participant, index) => (
              <View key={participant.id} style={styles.participantItem}>
                <View style={styles.participantHeader}>
                  <Text style={styles.participantNumber}>
                    {t('event.participantName')} {index + 1}
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
                  label={`${t('event.participantName')} *`}
                  placeholder={t('createEvent.participantNamePlaceholder')}
                  value={participant.name}
                  onChangeText={(text) =>
                    updateParticipant(participant.id, 'name', text)
                  }
                  autoCapitalize="words"
                  autoCorrect={true}
                  textContentType="name"
                />

                <Input
                  label={t('createEvent.participantBudgetPlaceholder')}
                  placeholder={t('createEvent.groupBudgetPlaceholder')}
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
            title={isEditMode ? t('createEvent.updateButton') : t('createEvent.createButton')}
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

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8, // Reduce el espacio superior
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    marginTop: 0, // Sin margen superior
  },
  section: {
    marginBottom: 20,
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
    color: theme.colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  currencySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  currencyText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  currencyArrow: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  currencyPicker: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  currencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inputBackground,
  },
  currencyOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  currencyOptionSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  addButton: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  participantItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    color: theme.colors.textSecondary,
  },
  removeButton: {
    color: theme.colors.error,
    fontSize: 20,
    fontWeight: '600',
  },
  editModeNote: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
