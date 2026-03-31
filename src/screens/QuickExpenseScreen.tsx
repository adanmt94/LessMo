/**
 * QuickExpenseScreen - Pantalla de confirmación rápida de gasto
 * 
 * Diseñada para añadir gastos en ≤3 toques.
 * Se abre desde: Widget, Siri, Spotlight, Share Sheet, deep links.
 * 
 * Flujo: Importe → Descripción → (opcional) Evento → Guardar
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Keyboard,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Gradients, Spacing, Radius, Typography } from '../theme/designSystem';
import { formatCurrency } from '../utils/numberUtils';
import { updateWidgetData } from '../services/widgetDataService';
import { RootStackParamList, ExpenseCategory, Currency } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type QuickExpenseNavProp = StackNavigationProp<RootStackParamList, 'QuickExpense'>;
type QuickExpenseRouteProp = RouteProp<RootStackParamList, 'QuickExpense'>;

interface Props {
  navigation: QuickExpenseNavProp;
  route: QuickExpenseRouteProp;
}

interface EventOption {
  id: string;
  name: string;
  budget: number;
  spent: number;
  currency: string;
}

const QUICK_CATEGORIES: { key: ExpenseCategory; emoji: string; label: string }[] = [
  { key: 'food', emoji: '🍽️', label: 'Comida' },
  { key: 'transport', emoji: '🚗', label: 'Transporte' },
  { key: 'shopping', emoji: '🛒', label: 'Compras' },
  { key: 'entertainment', emoji: '🎬', label: 'Ocio' },
  { key: 'health', emoji: '💊', label: 'Salud' },
  { key: 'accommodation', emoji: '🏨', label: 'Alojamiento' },
  { key: 'other', emoji: '📦', label: 'Otro' },
];

const QUICK_AMOUNTS = [5, 10, 15, 20, 30, 50];

export const QuickExpenseScreen: React.FC<Props> = ({ navigation, route }) => {
  const { amount: prefillAmount, description: prefillDesc, eventId: prefillEventId, category: prefillCategory } = route.params || {};
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { currentCurrency } = useCurrency();
  const styles = getStyles(theme);

  // Form state
  const [amount, setAmount] = useState(prefillAmount ? String(prefillAmount) : '');
  const [description, setDescription] = useState(prefillDesc || '');
  const [category, setCategory] = useState<ExpenseCategory>((prefillCategory as ExpenseCategory) || 'food');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(prefillEventId || null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userName, setUserName] = useState('');

  // Refs
  const amountRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);
  const successAnim = useRef(new Animated.Value(0)).current;

  // Load user events on mount
  useEffect(() => {
    if (user?.uid) {
      loadEvents();
      loadUserName();
    }
  }, [user?.uid]);

  // Auto-focus amount input
  useEffect(() => {
    if (!prefillAmount) {
      setTimeout(() => amountRef.current?.focus(), 300);
    }
  }, []);

  const loadUserName = async () => {
    if (!user?.uid) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserName(userDoc.data().name || user.displayName || '');
      } else {
        setUserName(user.displayName || '');
      }
    } catch {
      setUserName(user.displayName || '');
    }
  };

  const loadEvents = async () => {
    if (!user?.uid) return;
    try {
      const { getUserGroups } = await import('../services/firebase');
      const groups = await getUserGroups(user.uid);
      const activeEvents: EventOption[] = [];

      for (const group of groups) {
        if (!group.isActive) continue;
        const eventIds = group.eventIds || [];
        for (const eid of eventIds) {
          try {
            const eventDoc = await getDoc(doc(db, 'events', eid));
            if (eventDoc.exists()) {
              const data = eventDoc.data();
              activeEvents.push({
                id: eid,
                name: data.name || group.name,
                budget: data.initialBudget || 0,
                spent: 0, // Will compute from expenses if needed
                currency: data.currency || 'EUR',
              });
            }
          } catch {}
        }
      }
      setEvents(activeEvents);
    } catch {}
  };

  const selectedEvent = useMemo(
    () => events.find(e => e.id === selectedEventId),
    [events, selectedEventId]
  );

  const currencyCode = (selectedEvent?.currency || currentCurrency?.code || 'EUR') as Currency;

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!numAmount || numAmount <= 0) {
      Alert.alert(t('common.error'), t('addExpense.amountRequired'));
      return;
    }
    if (!user?.uid) return;

    setSaving(true);
    try {
      if (selectedEventId && selectedEventId !== 'individual') {
        // Save to event
        const { createExpense } = await import('../services/firebase');
        
        // Find the user's participant ID in this event
        const { getEventParticipants } = await import('../services/firebase');
        const participants = await getEventParticipants(selectedEventId);
        const myParticipant = participants.find(p => p.userId === user.uid);
        const paidById = myParticipant?.id || user.uid;
        const allParticipantIds = participants.map(p => p.id);

        await createExpense(
          selectedEventId,
          paidById,
          numAmount,
          description || category,
          category,
          allParticipantIds,
          'equal',
          undefined,
          undefined,
          undefined,
          description || undefined,
          currencyCode,
          user.uid,
          'expense'
        );
      } else {
        // Save as individual expense
        await addDoc(collection(db, 'expenses'), {
          eventId: 'individual',
          userId: user.uid,
          paidBy: user.uid,
          amount: numAmount,
          description: description || category,
          name: description || category,
          category,
          type: 'expense',
          isIndividual: true,
          date: Timestamp.now(),
          createdAt: Timestamp.now(),
          currency: currencyCode,
          participantIds: [user.uid],
          splitType: 'equal',
        });
      }

      // Update widget
      updateWidgetData(user.uid).catch(() => {});

      // Success animation
      setSaved(true);
      Animated.spring(successAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Auto-close after animation
      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch (error) {
      Alert.alert(t('common.error'), t('addExpense.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAmount = (value: number) => {
    setAmount(String(value));
    descRef.current?.focus();
  };

  if (saved) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Animated.View style={{
          transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
          opacity: successAnim,
        }}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={[styles.successText, { color: theme.colors.text }]}>
            ¡Gasto guardado!
          </Text>
          {selectedEvent && (
            <Text style={[styles.successSub, { color: theme.colors.textSecondary }]}>
              {selectedEvent.name} · Restante: {formatCurrency(selectedEvent.budget - parseFloat(amount.replace(',', '.')), currencyCode as any)}
            </Text>
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={[styles.closeBtnText, { color: theme.colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Gasto rápido</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Text style={[styles.currencyLabel, { color: theme.colors.textSecondary }]}>
              {currencyCode}
            </Text>
            <TextInput
              ref={amountRef}
              style={[styles.amountInput, { color: theme.colors.text }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              placeholderTextColor={theme.colors.textSecondary + '60'}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => descRef.current?.focus()}
            />
          </View>

          {/* Quick amounts */}
          {!amount && (
            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.quickAmountBtn, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }]}
                  onPress={() => handleQuickAmount(val)}
                >
                  <Text style={[styles.quickAmountText, { color: theme.colors.primary }]}>
                    {val}€
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Description */}
          <View style={[styles.field, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <TextInput
              ref={descRef}
              style={[styles.fieldInput, { color: theme.colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="¿En qué gastaste?"
              placeholderTextColor={theme.colors.textSecondary}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          {/* Category pills */}
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {QUICK_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryPill,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  category === cat.key && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
                ]}
                onPress={() => setCategory(cat.key)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[
                  styles.categoryLabel,
                  { color: theme.colors.textSecondary },
                  category === cat.key && { color: theme.colors.primary, fontWeight: '700' },
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Event selection */}
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
            Asignar a evento (opcional)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
            {/* Individual option */}
            <TouchableOpacity
              style={[
                styles.eventChip,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                !selectedEventId && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
              ]}
              onPress={() => setSelectedEventId(null)}
            >
              <Text style={styles.eventChipIcon}>👤</Text>
              <Text style={[
                styles.eventChipName,
                { color: theme.colors.text },
                !selectedEventId && { color: theme.colors.primary, fontWeight: '700' },
              ]}>
                Personal
              </Text>
            </TouchableOpacity>

            {events.map(ev => (
              <TouchableOpacity
                key={ev.id}
                style={[
                  styles.eventChip,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  selectedEventId === ev.id && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
                ]}
                onPress={() => setSelectedEventId(ev.id)}
              >
                <Text style={styles.eventChipIcon}>📋</Text>
                <View>
                  <Text style={[
                    styles.eventChipName,
                    { color: theme.colors.text },
                    selectedEventId === ev.id && { color: theme.colors.primary, fontWeight: '700' },
                  ]}>
                    {ev.name}
                  </Text>
                  {ev.budget > 0 && (
                    <Text style={[styles.eventChipBudget, { color: theme.colors.textSecondary }]}>
                      {formatCurrency(ev.budget, ev.currency as any)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Budget impact preview */}
          {selectedEvent && selectedEvent.budget > 0 && amount && (
            <View style={[styles.budgetImpact, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
              <Text style={[styles.budgetImpactTitle, { color: theme.colors.primary }]}>
                💰 Impacto en presupuesto
              </Text>
              <View style={styles.budgetImpactRow}>
                <Text style={[styles.budgetImpactLabel, { color: theme.colors.textSecondary }]}>
                  Presupuesto
                </Text>
                <Text style={[styles.budgetImpactValue, { color: theme.colors.text }]}>
                  {formatCurrency(selectedEvent.budget, currencyCode as any)}
                </Text>
              </View>
              <View style={styles.budgetImpactRow}>
                <Text style={[styles.budgetImpactLabel, { color: theme.colors.textSecondary }]}>
                  Este gasto
                </Text>
                <Text style={[styles.budgetImpactValue, { color: '#EF4444' }]}>
                  -{formatCurrency(parseFloat(amount.replace(',', '.')) || 0, currencyCode as any)}
                </Text>
              </View>
              <View style={[styles.budgetImpactDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.budgetImpactRow}>
                <Text style={[styles.budgetImpactLabel, { color: theme.colors.text, fontWeight: '700' }]}>
                  Restante
                </Text>
                <Text style={[styles.budgetImpactValue, { 
                  color: (selectedEvent.budget - (parseFloat(amount.replace(',', '.')) || 0)) >= 0 ? '#10B981' : '#EF4444',
                  fontWeight: '700',
                }]}>
                  {formatCurrency(selectedEvent.budget - (parseFloat(amount.replace(',', '.')) || 0), currencyCode as any)}
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Save button - fixed at bottom */}
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.saveButton, { opacity: !amount || saving ? 0.5 : 1 }]}
            onPress={handleSave}
            disabled={!amount || saving}
          >
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>
                {saving ? '⏳ Guardando...' : `Guardar ${amount ? formatCurrency(parseFloat(amount.replace(',', '.')) || 0, currencyCode as any) : 'gasto'}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    ...Typography.headline,
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  currencyLabel: {
    ...Typography.subhead,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -2,
    minWidth: 120,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickAmountBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  quickAmountText: {
    ...Typography.subhead,
    fontWeight: '700',
  },
  field: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  fieldInput: {
    ...Typography.body,
    paddingVertical: Spacing.md,
  },
  sectionLabel: {
    ...Typography.caption1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    marginBottom: Spacing.lg,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
    borderWidth: 1,
    marginRight: Spacing.sm,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    ...Typography.caption1,
    fontWeight: '600',
  },
  eventScroll: {
    marginBottom: Spacing.lg,
  },
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginRight: Spacing.sm,
    gap: Spacing.sm,
  },
  eventChipIcon: {
    fontSize: 18,
  },
  eventChipName: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  eventChipBudget: {
    ...Typography.caption2,
    marginTop: 1,
  },
  budgetImpact: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  budgetImpactTitle: {
    ...Typography.caption1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  budgetImpactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  budgetImpactLabel: {
    ...Typography.subhead,
  },
  budgetImpactValue: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  budgetImpactDivider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  successIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successText: {
    ...Typography.title2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  successSub: {
    ...Typography.subhead,
    textAlign: 'center',
  },
});

export default QuickExpenseScreen;
