/**
 * QuickExpenseScreen - Pantalla de gasto rápido completa
 * 
 * Se abre desde: Widget, Siri, Spotlight, Share Sheet, deep links, tab.
 * Incluye: participantes, recibo/OCR, notas, tags, moneda, recurrente, categorías custom.
 * 
 * Flujo: Importe → Descripción → Configurar → Guardar
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
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Gradients, Spacing, Radius, Typography } from '../theme/designSystem';
import { formatCurrency } from '../utils/numberUtils';
import { updateWidgetData } from '../services/widgetDataService';
import { analyzeReceipt, ReceiptData } from '../services/ocrService';
import { getCustomCategories, saveCustomCategory } from '../services/customCategoryService';
import { cache } from '../utils/cache';
import { RootStackParamList, ExpenseCategory, Currency, CurrencySymbols, Participant } from '../types';

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
const QUICK_CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP', 'MXN', 'ARS', 'COP', 'BRL', 'CLP', 'JPY', 'CHF', 'CAD', 'AUD'];

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

  // Participants state (for event expenses)
  const [eventParticipants, setEventParticipants] = useState<Participant[]>([]);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [paidBy, setPaidBy] = useState<string>('');
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Receipt / OCR state
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false);
  const [ocrData, setOcrData] = useState<ReceiptData | null>(null);

  // Notes & tags
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Currency
  const [expenseCurrency, setExpenseCurrency] = useState<string>(currentCurrency?.code || 'EUR');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Recurring
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Custom categories
  const [customCategories, setCustomCategories] = useState<Array<{ id: string; emoji: string; name: string }>>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [customCategoryEmoji, setCustomCategoryEmoji] = useState('🏷️');
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Expanded sections toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Refs
  const amountRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);
  const successAnim = useRef(new Animated.Value(0)).current;

  // Load user events on mount
  useEffect(() => {
    if (user?.uid) {
      loadEvents();
      loadUserName();
      loadCustomCategories();
    }
  }, [user?.uid]);

  // Auto-focus amount input
  useEffect(() => {
    if (!prefillAmount) {
      setTimeout(() => amountRef.current?.focus(), 300);
    }
  }, []);

  // Load participants when event changes
  useEffect(() => {
    if (selectedEventId && selectedEventId !== 'individual') {
      loadParticipants(selectedEventId);
    } else {
      setEventParticipants([]);
      setSelectedBeneficiaries([]);
      setPaidBy('');
    }
  }, [selectedEventId]);

  // Update currency when event changes
  useEffect(() => {
    const ev = events.find(e => e.id === selectedEventId);
    if (ev) {
      setExpenseCurrency(ev.currency || currentCurrency?.code || 'EUR');
    }
  }, [selectedEventId, events]);

  const loadUserName = async () => {
    if (!user?.uid) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserName(userDoc.data().name || user.displayName || '');
      } else {
        setUserName(user.displayName || '');
      }
    } catch (err) {
      setUserName(user?.displayName || '');
    }
  };

  const loadCustomCategories = async () => {
    if (!user?.uid) return;
    try {
      const cats = await getCustomCategories(user.uid);
      setCustomCategories(cats);
    } catch (err) {
      // Non-critical
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
                spent: 0,
                currency: data.currency || 'EUR',
              });
            }
          } catch (err) {
            console.warn('Error loading event', eid, err);
          }
        }
      }
      setEvents(activeEvents);

      // If prefilled eventId, auto-select it
      if (prefillEventId && activeEvents.some(e => e.id === prefillEventId)) {
        setSelectedEventId(prefillEventId);
      }
    } catch (err) {
      console.warn('Error loading events:', err);
      Alert.alert(t('common.error'), 'No se pudieron cargar los eventos');
    }
  };

  const loadParticipants = async (eventId: string) => {
    setLoadingParticipants(true);
    try {
      const { getEventParticipants } = await import('../services/firebase');
      const participants = await getEventParticipants(eventId);
      setEventParticipants(participants);

      // Auto-select all beneficiaries
      setSelectedBeneficiaries(participants.map(p => p.id));

      // Auto-set paidBy to current user's participant
      const myParticipant = participants.find(p => p.userId === user?.uid);
      if (myParticipant) {
        setPaidBy(myParticipant.id);
      } else if (participants.length > 0) {
        setPaidBy(participants[0].id);
      }
    } catch (err) {
      console.warn('Error loading participants:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const selectedEvent = useMemo(
    () => events.find(e => e.id === selectedEventId),
    [events, selectedEventId]
  );

  const currencyCode = (expenseCurrency || selectedEvent?.currency || currentCurrency?.code || 'EUR') as Currency;

  // ---- Receipt / OCR ----
  const processReceiptImage = async (imageUri: string) => {
    setAnalyzingReceipt(true);
    try {
      const data = await analyzeReceipt(imageUri);
      setOcrData(data);

      if (data.confidence > 0.6 && (data.total || data.merchantName)) {
        const message = [
          data.merchantName ? `📍 ${data.merchantName}` : '',
          data.total ? `💰 Total: ${data.total.toFixed(2)} ${CurrencySymbols[currencyCode] || currencyCode}` : '',
          data.date ? `📅 ${data.date.toLocaleDateString()}` : '',
          data.category ? `📂 ${data.category}` : '',
        ].filter(Boolean).join('\n');

        Alert.alert(
          '📄 Datos detectados',
          message + '\n\n¿Usar estos datos?',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Usar datos',
              onPress: () => {
                if (data.total) setAmount(data.total.toString());
                if (data.merchantName && !description) setDescription(data.merchantName);
                if (data.category) setCategory(data.category as ExpenseCategory);
              },
            },
          ]
        );
      } else if (data.total) {
        setAmount(data.total.toString());
      }
    } catch (error) {
      // OCR failed silently - photo is still saved
    } finally {
      setAnalyzingReceipt(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Se necesita permiso para acceder a las fotos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setReceiptPhoto(imageUri);
        await processReceiptImage(imageUri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Error al seleccionar imagen');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Se necesita permiso para la cámara');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setReceiptPhoto(imageUri);
        await processReceiptImage(imageUri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Error al tomar foto');
    }
  };

  // ---- Save ----
  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!numAmount || numAmount <= 0) {
      Alert.alert(t('common.error'), t('addExpense.amountRequired'));
      return;
    }
    if (!user?.uid) return;

    // Validate event expenses have a payer
    if (selectedEventId && selectedEventId !== 'individual') {
      if (!paidBy) {
        Alert.alert(t('common.error'), 'Selecciona quién pagó');
        return;
      }
      if (selectedBeneficiaries.length === 0) {
        Alert.alert(t('common.error'), 'Selecciona al menos un participante');
        return;
      }
    }

    setSaving(true);
    try {
      // Upload receipt photo if needed
      let photoURL = receiptPhoto;
      if (receiptPhoto && receiptPhoto.startsWith('file://')) {
        try {
          const { uploadReceiptPhoto } = await import('../services/firebase');
          photoURL = await uploadReceiptPhoto(receiptPhoto, `quick_${Date.now()}`);
        } catch (err) {
          console.warn('Error uploading photo:', err);
          // Continue without the photo
          photoURL = null;
        }
      }

      // Build extra fields
      const extraFields: Record<string, any> = {};
      if (notes.trim()) extraFields.notes = notes.trim();
      if (tags.length > 0) extraFields.tags = tags;
      if (expenseCurrency !== 'EUR') extraFields.originalCurrency = expenseCurrency;
      if (isRecurring) {
        extraFields.isRecurring = true;
        extraFields.recurringFrequency = recurringFrequency;
      }

      if (selectedEventId && selectedEventId !== 'individual') {
        // Save to event using createExpense (supports extraFields)
        const { createExpense } = await import('../services/firebase');

        await createExpense(
          selectedEventId,
          paidBy,
          numAmount,
          description || category,
          category,
          selectedBeneficiaries,
          'equal',
          undefined,
          undefined,
          photoURL || undefined,
          description || undefined,
          currencyCode,
          user.uid,
          'expense',
          extraFields
        );

        // Invalidate cache so EventDetailScreen sees new expense
        cache.invalidatePattern(`expenses_${selectedEventId}`);
        cache.invalidatePattern(`participants_${selectedEventId}`);

      } else {
        // Save as individual expense
        const expenseData: any = {
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
        };
        if (photoURL) expenseData.receiptPhoto = photoURL;
        if (notes.trim()) expenseData.notes = notes.trim();
        if (tags.length > 0) expenseData.tags = tags;
        if (isRecurring) {
          expenseData.isRecurring = true;
          expenseData.recurringFrequency = recurringFrequency;
        }

        await addDoc(collection(db, 'expenses'), expenseData);
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
    } catch (error: any) {
      console.error('Error saving expense:', error);
      Alert.alert(t('common.error'), error?.message || t('addExpense.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAmount = (value: number) => {
    setAmount(String(value));
    descRef.current?.focus();
  };

  const handleAddTag = () => {
    const cleaned = tagInput.trim().replace(/^#/, '');
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setTagInput('');
  };

  const handleSaveCustomCategory = async () => {
    if (!customCategoryName.trim() || !user?.uid) return;
    try {
      const saved = await saveCustomCategory(user.uid, {
        emoji: customCategoryEmoji,
        name: customCategoryName.trim(),
      });
      setCustomCategories(prev => [...prev, saved]);
      setCategory(saved.name as ExpenseCategory);
      setShowNewCategoryInput(false);
      setCustomCategoryEmoji('🏷️');
      setCustomCategoryName('');
    } catch (err) {
      Alert.alert(t('common.error'), 'No se pudo guardar la categoría');
    }
  };

  const toggleBeneficiary = (id: string) => {
    setSelectedBeneficiaries(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // ---- Render ----
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
              {selectedEvent.name}
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
              {CurrencySymbols[currencyCode] || currencyCode} {currencyCode}
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
                    {val}{CurrencySymbols[currencyCode] || '€'}
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
            {/* Custom categories */}
            {customCategories.map(cc => (
              <TouchableOpacity
                key={cc.id}
                style={[
                  styles.categoryPill,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  category === (cc.name as any) && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
                ]}
                onPress={() => setCategory(cc.name as ExpenseCategory)}
              >
                <Text style={styles.categoryEmoji}>{cc.emoji}</Text>
                <Text style={[
                  styles.categoryLabel,
                  { color: theme.colors.textSecondary },
                  category === (cc.name as any) && { color: theme.colors.primary, fontWeight: '700' },
                ]}>
                  {cc.name}
                </Text>
              </TouchableOpacity>
            ))}
            {/* Add custom category */}
            <TouchableOpacity
              style={[styles.categoryPill, { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '80', borderStyle: 'dashed' }]}
              onPress={() => setShowNewCategoryInput(!showNewCategoryInput)}
            >
              <Text style={styles.categoryEmoji}>+</Text>
              <Text style={[styles.categoryLabel, { color: theme.colors.textSecondary }]}>Nueva</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* New custom category input */}
          {showNewCategoryInput && (
            <View style={[styles.customCategoryRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.emojiInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={customCategoryEmoji}
                onChangeText={t => setCustomCategoryEmoji(t.slice(-2))}
                placeholder="🏷️"
                maxLength={2}
              />
              <TextInput
                style={[styles.customCatNameInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={customCategoryName}
                onChangeText={setCustomCategoryName}
                placeholder="Nombre categoría"
                placeholderTextColor={theme.colors.textSecondary}
                returnKeyType="done"
                onSubmitEditing={handleSaveCustomCategory}
              />
              <TouchableOpacity
                style={[styles.customCatSaveBtn, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveCustomCategory}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>✓</Text>
              </TouchableOpacity>
            </View>
          )}

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

            {events.length === 0 && (
              <Text style={[styles.noEventsHint, { color: theme.colors.textSecondary }]}>
                No tienes eventos activos
              </Text>
            )}
          </ScrollView>

          {/* Participants section - only for event expenses */}
          {selectedEventId && eventParticipants.length > 0 && (
            <>
              {/* Who paid */}
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>¿Quién pagó?</Text>
              {loadingParticipants ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginBottom: Spacing.md }} />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.participantScroll}>
                  {eventParticipants.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.participantChip,
                        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                        paidBy === p.id && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
                      ]}
                      onPress={() => setPaidBy(p.id)}
                    >
                      <Text style={[
                        styles.participantChipText,
                        { color: theme.colors.text },
                        paidBy === p.id && { color: theme.colors.primary, fontWeight: '700' },
                      ]}>
                        {p.userId === user?.uid ? `${p.name} (tú)` : p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Beneficiaries */}
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>¿Entre quiénes se divide?</Text>
              <View style={styles.beneficiariesContainer}>
                {eventParticipants.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.beneficiaryChip,
                      { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                      selectedBeneficiaries.includes(p.id) && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary },
                    ]}
                    onPress={() => toggleBeneficiary(p.id)}
                  >
                    <Text style={[styles.checkMark, { color: selectedBeneficiaries.includes(p.id) ? theme.colors.primary : theme.colors.border }]}>
                      {selectedBeneficiaries.includes(p.id) ? '✓' : '○'}
                    </Text>
                    <Text style={[
                      styles.beneficiaryName,
                      { color: theme.colors.text },
                      selectedBeneficiaries.includes(p.id) && { color: theme.colors.primary, fontWeight: '600' },
                    ]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Receipt / OCR section */}
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>📷 Recibo (opcional)</Text>
          {receiptPhoto ? (
            <View style={styles.receiptPreview}>
              <Image source={{ uri: receiptPhoto }} style={styles.receiptImage} />
              {analyzingReceipt && (
                <View style={styles.ocrOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.ocrOverlayText}>Analizando recibo...</Text>
                </View>
              )}
              {ocrData && !analyzingReceipt && (
                <View style={[styles.ocrBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.ocrBadgeText}>✓ OCR</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.removePhotoBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => { setReceiptPhoto(null); setOcrData(null); }}
              >
                <Text style={styles.removePhotoBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.receiptButtons}>
              <TouchableOpacity
                style={[styles.receiptBtn, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}
                onPress={takePhoto}
              >
                <Text style={[styles.receiptBtnText, { color: theme.colors.primary }]}>📷 Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.receiptBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={pickImage}
              >
                <Text style={[styles.receiptBtnText, { color: theme.colors.text }]}>🖼️ Galería</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Advanced options toggle */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Text style={[styles.advancedToggleText, { color: theme.colors.textSecondary }]}>
              {showAdvanced ? '▼' : '▶'} Más opciones
            </Text>
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.advancedSection}>
              {/* Notes */}
              <View style={[styles.field, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.fieldInput, { color: theme.colors.text, minHeight: 50, textAlignVertical: 'top' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="📝 Notas (opcional)"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Tags */}
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>🏷️ Etiquetas</Text>
              <View style={styles.tagsContainer}>
                {tags.map((tag, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setTags(tags.filter((_, i) => i !== idx))}
                    style={[styles.tagChip, { backgroundColor: theme.colors.primary + '15' }]}
                  >
                    <Text style={[styles.tagText, { color: theme.colors.primary }]}>#{tag}</Text>
                    <Text style={[styles.tagRemove, { color: theme.colors.primary }]}>✕</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.tagInputRow}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginRight: 2 }}>#</Text>
                  <TextInput
                    style={[styles.tagTextInput, { color: theme.colors.text }]}
                    placeholder="vacaciones, trabajo..."
                    placeholderTextColor={theme.colors.textSecondary + '80'}
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Currency selector */}
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>💱 Moneda</Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
                style={[styles.currencySelector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text, flex: 1 }}>
                  {CurrencySymbols[currencyCode] || currencyCode} {currencyCode}
                </Text>
                <Text style={{ color: theme.colors.textSecondary }}>{showCurrencyPicker ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              {showCurrencyPicker && (
                <View style={styles.currencyGrid}>
                  {QUICK_CURRENCIES.map(cur => (
                    <TouchableOpacity
                      key={cur}
                      onPress={() => { setExpenseCurrency(cur); setShowCurrencyPicker(false); }}
                      style={[
                        styles.currencyChip,
                        { backgroundColor: expenseCurrency === cur ? theme.colors.primary : theme.colors.card,
                          borderColor: expenseCurrency === cur ? theme.colors.primary : theme.colors.border },
                      ]}
                    >
                      <Text style={{ color: expenseCurrency === cur ? '#fff' : theme.colors.text, fontWeight: '600', fontSize: 13 }}>
                        {CurrencySymbols[cur]} {cur}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Recurring toggle */}
              <View style={styles.recurringRow}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>🔄 Gasto recurrente</Text>
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Se repite automáticamente</Text>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                />
              </View>
              {isRecurring && (
                <View style={styles.frequencyRow}>
                  {([
                    { key: 'daily' as const, label: 'Diario' },
                    { key: 'weekly' as const, label: 'Semanal' },
                    { key: 'monthly' as const, label: 'Mensual' },
                    { key: 'yearly' as const, label: 'Anual' },
                  ]).map(freq => (
                    <TouchableOpacity
                      key={freq.key}
                      onPress={() => setRecurringFrequency(freq.key)}
                      style={[
                        styles.frequencyBtn,
                        { backgroundColor: recurringFrequency === freq.key ? theme.colors.primary : theme.colors.card,
                          borderColor: recurringFrequency === freq.key ? theme.colors.primary : theme.colors.border },
                      ]}
                    >
                      <Text style={{ color: recurringFrequency === freq.key ? '#fff' : theme.colors.text, fontWeight: '600', fontSize: 12 }}>
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

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
  customCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  emojiInput: {
    width: 44,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 20,
  },
  customCatNameInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
  },
  customCatSaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  noEventsHint: {
    ...Typography.caption1,
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    fontStyle: 'italic',
  },
  // Participants
  participantScroll: {
    marginBottom: Spacing.lg,
  },
  participantChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  participantChipText: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  beneficiariesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  beneficiaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
    borderWidth: 1,
    gap: 6,
  },
  checkMark: {
    fontSize: 14,
    fontWeight: '700',
  },
  beneficiaryName: {
    ...Typography.subhead,
  },
  // Receipt
  receiptPreview: {
    position: 'relative',
    marginBottom: Spacing.lg,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
  },
  ocrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  ocrOverlayText: {
    color: '#fff',
    marginTop: 6,
    fontWeight: '600',
    fontSize: 13,
  },
  ocrBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ocrBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  removePhotoBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoBtnText: {
    fontSize: 16,
  },
  receiptButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  receiptBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  receiptBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  // Advanced
  advancedToggle: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  advancedToggleText: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  advancedSection: {
    marginBottom: Spacing.md,
  },
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagRemove: {
    fontSize: 11,
    marginLeft: 4,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  tagTextInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  // Currency
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  // Recurring
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  frequencyBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  // Budget impact
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
