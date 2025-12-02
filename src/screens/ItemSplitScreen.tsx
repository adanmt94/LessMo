/**
 * ItemSplitScreen - Pantalla para dividir items individuales entre participantes
 * Usada cuando el OCR detecta items en un ticket
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Participant, ExpenseItem } from '../types';
import { Button } from '../components/lovable';

interface ItemSplitScreenProps {
  visible: boolean;
  items: Array<{ name: string; price: number }>;
  participants: Participant[];
  onClose: () => void;
  onConfirm: (items: ExpenseItem[]) => void;
}

export function ItemSplitScreen({
  visible,
  items: initialItems,
  participants,
  onClose,
  onConfirm,
}: ItemSplitScreenProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [items, setItems] = useState<ExpenseItem[]>([]);

  useEffect(() => {
    // Convertir items iniciales a ExpenseItems con todos asignados por defecto
    if (initialItems && initialItems.length > 0) {
      const converted: ExpenseItem[] = initialItems.map((item, index) => ({
        id: `item_${index}`,
        name: item.name,
        price: item.price,
        assignedTo: participants.map(p => p.id), // Todos por defecto
        sharedEqually: true,
      }));
      setItems(converted);
    }
  }, [initialItems, participants]);

  const toggleParticipant = (itemId: string, participantId: string) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const isAssigned = item.assignedTo.includes(participantId);
          const newAssignedTo = isAssigned
            ? item.assignedTo.filter(id => id !== participantId)
            : [...item.assignedTo, participantId];

          // No permitir que quede vacío
          if (newAssignedTo.length === 0) {
            Alert.alert(
              'Error',
              'Debe haber al menos una persona asignada a cada item'
            );
            return item;
          }

          return {
            ...item,
            assignedTo: newAssignedTo,
          };
        }
        return item;
      })
    );
  };

  const handleConfirm = () => {
    // Validar que todos los items tengan al menos una persona
    const invalid = items.find(item => item.assignedTo.length === 0);
    if (invalid) {
      Alert.alert(
        'Error',
        'Todos los items deben tener al menos una persona asignada'
      );
      return;
    }

    onConfirm(items);
  };

  const getTotalByParticipant = (participantId: string): number => {
    return items.reduce((total, item) => {
      if (item.assignedTo.includes(participantId)) {
        return total + item.price / item.assignedTo.length;
      }
      return total;
    }, 0);
  };

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    scrollContent: {
      padding: 20,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 24,
      lineHeight: 20,
    },
    itemCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    itemPrice: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    participantsLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      fontWeight: '600',
    },
    participantsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    participantChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    participantChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    participantChipText: {
      fontSize: 13,
      color: theme.colors.text,
      fontWeight: '500',
    },
    participantChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    summaryCard: {
      backgroundColor: theme.isDark
        ? 'rgba(99, 102, 241, 0.1)'
        : 'rgba(99, 102, 241, 0.05)',
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(99, 102, 241, 0.3)'
        : 'rgba(99, 102, 241, 0.2)',
    },
    summaryTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    summaryName: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    summaryAmount: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    buttonContainer: {
      padding: 20,
      paddingBottom: 40,
      gap: 12,
    },
  });

  const totalExpense = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>📝 Dividir Items</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.description}>
            Selecciona quién consumió cada item. Puedes asignar un item a varias personas y se
            dividirá automáticamente.
          </Text>

          {items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{item.price.toFixed(2)}€</Text>
              </View>

              <Text style={styles.participantsLabel}>
                {item.assignedTo.length === 1
                  ? '1 persona'
                  : `${item.assignedTo.length} personas`}{' '}
                - {(item.price / item.assignedTo.length).toFixed(2)}€ cada uno
              </Text>

              <View style={styles.participantsList}>
                {participants.map(participant => {
                  const isActive = item.assignedTo.includes(participant.id);
                  return (
                    <TouchableOpacity
                      key={participant.id}
                      style={[
                        styles.participantChip,
                        isActive && styles.participantChipActive,
                      ]}
                      onPress={() => toggleParticipant(item.id, participant.id)}
                    >
                      <Text
                        style={[
                          styles.participantChipText,
                          isActive && styles.participantChipTextActive,
                        ]}
                      >
                        {participant.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>💰 Resumen por persona</Text>
            {participants.map(participant => {
              const total = getTotalByParticipant(participant.id);
              if (total === 0) return null;
              return (
                <View key={participant.id} style={styles.summaryRow}>
                  <Text style={styles.summaryName}>{participant.name}</Text>
                  <Text style={styles.summaryAmount}>{total.toFixed(2)}€</Text>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{totalExpense.toFixed(2)}€</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button title="✅ Confirmar División" onPress={handleConfirm} />
          <Button title="Cancelar" onPress={onClose} variant="outline" />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
