/**
 * AddExpenseScreen - Pantalla para agregar gastos
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
import { RootStackParamList, ExpenseCategory, CategoryLabels, VALIDATION } from '../types';
import { Button, Input, Card } from '../components/lovable';
import { useExpenses } from '../hooks/useExpenses';
import { useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../context/ThemeContext';

type AddExpenseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddExpense'>;
type AddExpenseScreenRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;

interface Props {
  navigation: AddExpenseScreenNavigationProp;
  route: AddExpenseScreenRouteProp;
}

const CATEGORIES: ExpenseCategory[] = [
  'food',
  'transport',
  'accommodation',
  'entertainment',
  'shopping',
  'health',
  'other',
];

export const AddExpenseScreen: React.FC<Props> = ({ navigation, route }) => {
  const { eventId, expenseId, mode } = route.params;
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const isEditMode = mode === 'edit' && expenseId;
  const { participants, addExpense, editExpense, expenses } = useExpenses(eventId);
  const { notifyNewExpense } = useNotifications();
  const [eventData, setEventData] = useState<any>(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<{ [participantId: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Cargar datos del evento
  useEffect(() => {
    const loadEventData = async () => {
      try {
        const { getEvent } = await import('../services/firebase');
        const event = await getEvent(eventId);
        setEventData(event);
      } catch (error) {
        console.error('Error cargando datos del evento:', error);
      }
    };
    loadEventData();
  }, [eventId]);

  // Cargar datos del gasto en modo edición
  useEffect(() => {
    if (isEditMode && expenses.length > 0) {
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        console.log('📝 Cargando datos del gasto para editar:', expense);
        setDescription(expense.description);
        setAmount(expense.amount.toString());
        setPaidBy(expense.paidBy);
        setCategory(expense.category);
        setSelectedBeneficiaries(expense.beneficiaries);
        setSplitType(expense.splitType || 'equal');
        
        if (expense.splitType === 'custom' && expense.customSplits) {
          const splitsString: { [key: string]: string } = {};
          Object.entries(expense.customSplits).forEach(([id, amount]) => {
            splitsString[id] = amount.toString();
          });
          setCustomSplits(splitsString);
        }
      }
    }
  }, [isEditMode, expenseId, expenses]);

  useEffect(() => {
    console.log('🔍 AddExpenseScreen - Participants:', participants.length, participants);
    if (participants.length > 0 && !isEditMode) {
      setPaidBy(participants[0].id);
      setSelectedBeneficiaries(participants.map((p) => p.id));
      
      // Inicializar custom splits con división equitativa
      const initialSplits: { [key: string]: string } = {};
      participants.forEach(p => {
        initialSplits[p.id] = '';
      });
      setCustomSplits(initialSplits);
    }
  }, [participants, isEditMode]);

  const toggleBeneficiary = (participantId: string) => {
    if (selectedBeneficiaries.includes(participantId)) {
      setSelectedBeneficiaries(selectedBeneficiaries.filter((id) => id !== participantId));
    } else {
      setSelectedBeneficiaries([...selectedBeneficiaries, participantId]);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseId) return;

    Alert.alert(
      'Eliminar gasto',
      '¿Estás seguro de que deseas eliminar este gasto?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { deleteExpense } = await import('../services/firebase');
              await deleteExpense(expenseId);
              
              Alert.alert('Éxito', 'Gasto eliminado correctamente', [
                {
                  text: 'Aceptar',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              console.error('❌ Error eliminando gasto:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar el gasto');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAddExpense = async () => {
    console.log('💰 handleAddExpense - Iniciando registro de gasto');
    console.log('📝 Datos del gasto:', {
      description: description.trim(),
      amount,
      paidBy,
      category,
      selectedBeneficiaries: selectedBeneficiaries.length,
      participantsAvailable: participants.length
    });

    // Validaciones
    if (!description.trim()) {
      console.log('❌ Error: Descripción vacía');
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < VALIDATION.MIN_AMOUNT || amountNum > VALIDATION.MAX_AMOUNT) {
      console.log('❌ Error: Monto inválido', amountNum);
      Alert.alert(
        'Error',
        `El monto debe estar entre ${VALIDATION.MIN_AMOUNT} y ${VALIDATION.MAX_AMOUNT}`
      );
      return;
    }

    if (!paidBy) {
      console.log('❌ Error: No hay pagador seleccionado');
      Alert.alert('Error', 'Selecciona quién pagó');
      return;
    }

    if (selectedBeneficiaries.length === 0) {
      console.log('❌ Error: No hay beneficiarios seleccionados');
      Alert.alert('Error', 'Selecciona al menos un beneficiario');
      return;
    }

    // Validaciones adicionales para división personalizada
    let customSplitsData: { [key: string]: number } | undefined;
    if (splitType === 'custom') {
      customSplitsData = {};
      let totalCustom = 0;

      for (const beneficiaryId of selectedBeneficiaries) {
        const splitAmount = parseFloat(customSplits[beneficiaryId] || '0');
        if (isNaN(splitAmount) || splitAmount <= 0) {
          Alert.alert('Error', 'Todos los beneficiarios deben tener un monto válido en división personalizada');
          return;
        }
        customSplitsData[beneficiaryId] = splitAmount;
        totalCustom += splitAmount;
      }

      // Verificar que la suma sea igual al total (con margen de error de 0.01 por decimales)
      if (Math.abs(totalCustom - amountNum) > 0.01) {
        Alert.alert(
          'Error de división',
          `La suma de los montos personalizados (€${totalCustom.toFixed(2)}) debe ser igual al monto total (€${amountNum.toFixed(2)})`
        );
        return;
      }
    }

    console.log('✅ Validaciones pasadas, guardando gasto...');
    console.log('📊 Tipo de división:', splitType, customSplitsData);
    setLoading(true);

    try {
      let success: boolean;
      
      if (isEditMode) {
        console.log('📝 Modo edición - Actualizando gasto:', expenseId);
        success = await editExpense(
          expenseId!,
          paidBy,
          amountNum,
          description,
          category,
          selectedBeneficiaries,
          splitType,
          customSplitsData
        );
      } else {
        console.log('➕ Modo creación - Creando gasto nuevo');
        success = await addExpense(
          paidBy,
          amountNum,
          description,
          category,
          selectedBeneficiaries,
          splitType,
          customSplitsData
        );
      }

      console.log(`📊 Resultado ${isEditMode ? 'editExpense' : 'addExpense'}:`, success);

      if (success) {
        console.log(`✅ Gasto ${isEditMode ? 'actualizado' : 'registrado'} exitosamente`);
        
        // Enviar notificación solo para gastos nuevos
        if (!isEditMode && eventData) {
          await notifyNewExpense(eventData.name, amountNum, eventData.currency);
        }
        
        Alert.alert(
          isEditMode ? '¡Gasto actualizado!' : '¡Gasto agregado!',
          isEditMode ? 'Los cambios se han guardado correctamente' : 'El gasto se ha registrado correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        console.log(`❌ ${isEditMode ? 'editExpense' : 'addExpense'} retornó false`);
        Alert.alert('Error', `No se pudo ${isEditMode ? 'actualizar' : 'registrar'} el gasto`);
      }
    } catch (error: any) {
      console.error(`❌ Error al ${isEditMode ? 'actualizar' : 'agregar'} gasto:`, error);
      Alert.alert('Error', error.message || `No se pudo ${isEditMode ? 'actualizar' : 'agregar'} el gasto`);
    } finally {
      setLoading(false);
    }
  };

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
          <Card>
            <Input
              label="Descripción *"
              placeholder="Ej: Cena en restaurante"
              value={description}
              onChangeText={setDescription}
              maxLength={VALIDATION.MAX_DESCRIPTION_LENGTH}
              autoCapitalize="sentences"
              autoCorrect={true}
            />

            <Input
              label="Monto *"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              autoCorrect={false}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Categoría *</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {CategoryLabels[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>¿Quién pagó? *</Text>
            {participants.length === 0 ? (
              <Text style={styles.emptyText}>No hay participantes. Agrega participantes al evento primero.</Text>
            ) : (
              <View style={styles.participantsList}>
                {participants.map((participant) => (
                  <TouchableOpacity
                    key={participant.id}
                    style={[
                      styles.participantButton,
                      paidBy === participant.id && styles.participantButtonActive,
                    ]}
                    onPress={() => setPaidBy(participant.id)}
                  >
                    <Text
                      style={[
                        styles.participantText,
                        paidBy === participant.id && styles.participantTextActive,
                      ]}
                    >
                      {participant.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Tipo de división *</Text>
            <View style={styles.splitTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.splitTypeButton,
                  splitType === 'equal' && styles.splitTypeButtonActive,
                ]}
                onPress={() => setSplitType('equal')}
              >
                <Text
                  style={[
                    styles.splitTypeText,
                    splitType === 'equal' && styles.splitTypeTextActive,
                  ]}
                >
                  ⚖️ Equitativa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.splitTypeButton,
                  splitType === 'custom' && styles.splitTypeButtonActive,
                ]}
                onPress={() => setSplitType('custom')}
              >
                <Text
                  style={[
                    styles.splitTypeText,
                    splitType === 'custom' && styles.splitTypeTextActive,
                  ]}
                >
                  🎯 Personalizada
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>
              Beneficiarios * {splitType === 'equal' ? '(división equitativa)' : '(especifica el monto para cada uno)'}
            </Text>
            
            {splitType === 'custom' && amount && (
              <View style={styles.customSummary}>
                <Text style={styles.customSummaryText}>
                  Total a dividir: €{parseFloat(amount || '0').toFixed(2)}
                </Text>
                <Text style={styles.customSummaryText}>
                  Suma actual: €{
                    selectedBeneficiaries.reduce((sum, id) => {
                      return sum + parseFloat(customSplits[id] || '0');
                    }, 0).toFixed(2)
                  }
                </Text>
              </View>
            )}
            
            {participants.length === 0 ? (
              <Text style={styles.emptyText}>No hay participantes disponibles</Text>
            ) : (
              <View style={styles.beneficiariesList}>
                {splitType === 'equal' ? (
                  // Modo equitativo: checkboxes simples
                  participants.map((participant) => (
                    <TouchableOpacity
                      key={participant.id}
                      style={[
                        styles.beneficiaryButton,
                        selectedBeneficiaries.includes(participant.id) &&
                          styles.beneficiaryButtonActive,
                      ]}
                      onPress={() => toggleBeneficiary(participant.id)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selectedBeneficiaries.includes(participant.id) &&
                            styles.checkboxActive,
                        ]}
                      >
                        {selectedBeneficiaries.includes(participant.id) && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                      <Text style={styles.beneficiaryText}>{participant.name}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  // Modo personalizado: inputs de monto
                  participants.map((participant) => (
                    <View key={participant.id} style={styles.customBeneficiaryRow}>
                      <TouchableOpacity
                        style={[
                          styles.customBeneficiaryButton,
                          selectedBeneficiaries.includes(participant.id) &&
                            styles.customBeneficiaryButtonActive,
                        ]}
                        onPress={() => toggleBeneficiary(participant.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            selectedBeneficiaries.includes(participant.id) &&
                              styles.checkboxActive,
                          ]}
                        >
                          {selectedBeneficiaries.includes(participant.id) && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                        <Text style={styles.customBeneficiaryName}>{participant.name}</Text>
                      </TouchableOpacity>
                      
                      {selectedBeneficiaries.includes(participant.id) && (
                        <Input
                          placeholder="0.00"
                          value={customSplits[participant.id] || ''}
                          onChangeText={(text) => {
                            setCustomSplits({
                              ...customSplits,
                              [participant.id]: text
                            });
                          }}
                          keyboardType="decimal-pad"
                          style={styles.customAmountInput}
                        />
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
          </Card>

          <Button
            title={isEditMode ? "Guardar cambios" : "Registrar gasto"}
            onPress={handleAddExpense}
            loading={loading}
            fullWidth
            size="large"
          />

          {isEditMode && expenseId && (
            <Button
              title="Eliminar gasto"
              onPress={handleDeleteExpense}
              variant="danger"
              fullWidth
              size="large"
              style={{ marginTop: 12 }}
            />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
    marginTop: 0,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  participantsList: {
    marginBottom: 16,
  },
  participantButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  participantButtonActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  participantText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  participantTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  beneficiariesList: {
    marginBottom: 24,
  },
  beneficiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inputBackground,
  },
  beneficiaryButtonActive: {},
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.card,
    fontSize: 14,
    fontWeight: '700',
  },
  beneficiaryText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  splitTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  splitTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  splitTypeButtonActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  splitTypeText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  splitTypeTextActive: {
    color: theme.colors.primary,
  },
  customBeneficiaryRow: {
    marginBottom: 12,
  },
  customBeneficiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  customBeneficiaryButtonActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  customBeneficiaryName: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  customAmountInput: {
    marginTop: 0,
  },
  customSummary: {
    backgroundColor: theme.colors.warning || '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  customSummaryText: {
    fontSize: 14,
    color: theme.colors.warningText || '#92400E',
    fontWeight: '600',
    marginBottom: 4,
  },
});
