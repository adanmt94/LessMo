/**
 * AddExpenseScreen - Pantalla para agregar gastos
 */

import React, { useState, useEffect } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, ExpenseCategory, CategoryLabels, VALIDATION } from '../types';
import { Button, Input, Card } from '../components/lovable';
import { useExpenses } from '../hooks/useExpenses';

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
  const { eventId } = route.params;
  const { participants, addExpense } = useExpenses(eventId);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [paidBy, setPaidBy] = useState('');
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (participants.length > 0) {
      setPaidBy(participants[0].id);
      setSelectedBeneficiaries(participants.map((p) => p.id));
    }
  }, [participants]);

  const toggleBeneficiary = (participantId: string) => {
    if (selectedBeneficiaries.includes(participantId)) {
      setSelectedBeneficiaries(selectedBeneficiaries.filter((id) => id !== participantId));
    } else {
      setSelectedBeneficiaries([...selectedBeneficiaries, participantId]);
    }
  };

  const handleAddExpense = async () => {
    // Validaciones
    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < VALIDATION.MIN_AMOUNT || amountNum > VALIDATION.MAX_AMOUNT) {
      Alert.alert(
        'Error',
        `El monto debe estar entre ${VALIDATION.MIN_AMOUNT} y ${VALIDATION.MAX_AMOUNT}`
      );
      return;
    }

    if (!paidBy) {
      Alert.alert('Error', 'Selecciona quién pagó');
      return;
    }

    if (selectedBeneficiaries.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un beneficiario');
      return;
    }

    setLoading(true);

    try {
      const success = await addExpense(
        paidBy,
        amountNum,
        description,
        category,
        selectedBeneficiaries
      );

      if (success) {
        Alert.alert('¡Gasto agregado!', 'El gasto se ha registrado correctamente', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo agregar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Agregar gasto</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          bounces={false}
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

            <Text style={styles.label}>Beneficiarios * (división equitativa)</Text>
            <View style={styles.beneficiariesList}>
              {participants.map((participant) => (
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
              ))}
            </View>
          </Card>

          <Button
            title="Registrar gasto"
            onPress={handleAddExpense}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  participantsList: {
    marginBottom: 16,
  },
  participantButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  participantButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  participantText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  participantTextActive: {
    color: '#6366F1',
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
    borderBottomColor: '#F3F4F6',
  },
  beneficiaryButtonActive: {},
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  beneficiaryText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});
