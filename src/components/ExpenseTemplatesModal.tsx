/**
 * ExpenseTemplatesModal - Modal para seleccionar plantillas de gastos
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ExpenseTemplate } from '../services/expenseTemplateService';
import { Button } from './lovable';

interface Props {
  visible: boolean;
  templates: ExpenseTemplate[];
  onClose: () => void;
  onSelectTemplate: (template: ExpenseTemplate) => void;
  onSaveAsTemplate: () => void;
}

export const ExpenseTemplatesModal: React.FC<Props> = ({
  visible,
  templates,
  onClose,
  onSelectTemplate,
  onSaveAsTemplate,
}) => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Agrupar plantillas por categoría
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as { [key: string]: ExpenseTemplate[] });

  // Ordenar por uso
  const sortedTemplates = (category: string) => {
    const list = category === 'all' ? templates : groupedTemplates[category] || [];
    return list.sort((a, b) => b.usageCount - a.usageCount);
  };

  const categories = [
    { id: 'all', name: 'Todas', icon: '📋' },
    { id: 'food', name: 'Comida', icon: '🍽️' },
    { id: 'transport', name: 'Transporte', icon: '🚗' },
    { id: 'entertainment', name: 'Ocio', icon: '🎬' },
    { id: 'shopping', name: 'Compras', icon: '🛍️' },
    { id: 'housing', name: 'Vivienda', icon: '🏠' },
    { id: 'health', name: 'Salud', icon: '💊' },
    { id: 'other', name: 'Otros', icon: '📌' },
  ];

  const getRecurringBadge = (template: ExpenseTemplate) => {
    if (!template.isRecurring) return null;
    const frequency = {
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
      yearly: 'Anual',
    }[template.recurringFrequency || 'monthly'];
    return `🔄 ${frequency}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              📝 Plantillas de Gastos
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Botón para guardar gasto actual como plantilla */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={onSaveAsTemplate}
          >
            <Text style={styles.saveButtonText}>💾 Guardar este gasto como plantilla</Text>
          </TouchableOpacity>

          {/* Filtro por categoría */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat.id && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color:
                        selectedCategory === cat.id
                          ? '#FFFFFF'
                          : theme.colors.text,
                    },
                  ]}
                >
                  {cat.icon} {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Lista de plantillas */}
          <ScrollView style={styles.templatesList}>
            {sortedTemplates(selectedCategory).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  No hay plantillas en esta categoría
                </Text>
                <Text style={[styles.emptyStateHint, { color: theme.colors.textSecondary }]}>
                  Crea una guardando un gasto como plantilla
                </Text>
              </View>
            ) : (
              sortedTemplates(selectedCategory).map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[styles.templateCard, { backgroundColor: theme.colors.background }]}
                  onPress={() => onSelectTemplate(template)}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateHeader}>
                    <Text style={[styles.templateName, { color: theme.colors.text }]}>
                      {template.icon} {template.name}
                    </Text>
                    {template.usageCount > 0 && (
                      <Text style={[styles.usageCount, { color: theme.colors.textSecondary }]}>
                        {template.usageCount}x
                      </Text>
                    )}
                  </View>

                  {template.description && (
                    <Text
                      style={[styles.templateDescription, { color: theme.colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {template.description}
                    </Text>
                  )}

                  <View style={styles.templateFooter}>
                    {template.amount > 0 && (
                      <Text style={[styles.templateAmount, { color: theme.colors.primary }]}>
                        €{template.amount.toFixed(2)}
                      </Text>
                    )}
                    {template.isRecurring && (
                      <Text style={[styles.recurringBadge, { color: theme.colors.textSecondary }]}>
                        {getRecurringBadge(template)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  categoriesScroll: {
    marginBottom: 16,
    maxHeight: 44,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  templatesList: {
    flex: 1,
  },
  templateCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  usageCount: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  templateDescription: {
    fontSize: 13,
    marginBottom: 8,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  recurringBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyStateHint: {
    fontSize: 14,
    textAlign: 'center',
  },
});
