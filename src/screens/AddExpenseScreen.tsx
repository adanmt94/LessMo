/**
 * AddExpenseScreen - Pantalla para agregar gastos
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList, ExpenseCategory, CategoryLabels, VALIDATION } from '../types';
import { Button, Input, Card } from '../components/lovable';
import { useExpenses } from '../hooks/useExpenses';
import { useNotifications } from '../hooks/useNotifications';
import { useSpendingAlerts } from '../hooks/useSpendingAlerts';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { analyzeReceipt, ReceiptData } from '../services/ocrService';
import { ItemSplitScreen } from './ItemSplitScreen';
import { ExpenseItem } from '../types';
import { 
  getAllTemplates, 
  incrementTemplateUsage, 
  createTemplateFromExpense,
  ExpenseTemplate 
} from '../services/expenseTemplateService';
import { ExpenseTemplatesModal } from '../components/ExpenseTemplatesModal';

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
  const { eventId, expenseId, mode, prefilledData } = route.params;
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const styles = getStyles(theme);
  const isEditMode = mode === 'edit' && expenseId;
  const isIndividualExpense = eventId === 'individual';
  
  // Para gastos individuales, no necesitamos el hook useExpenses
  const expenseHookResult = !isIndividualExpense ? useExpenses(eventId!) : { 
    participants: [], 
    addExpense: null, 
    editExpense: null, 
    expenses: [], 
    getRemainingBalance: () => 0, 
    getTotalExpenses: () => 0 
  };
  const { participants, addExpense, editExpense, expenses, getRemainingBalance, getTotalExpenses } = expenseHookResult;
  
  const { notifyNewExpense } = useNotifications();
  const { checkAvailableAmount, checkTotalSpent } = useSpendingAlerts();
  const [eventData, setEventData] = useState<any>(null);

  const [description, setDescription] = useState(prefilledData?.description || '');
  const [amount, setAmount] = useState(prefilledData?.amount ? prefilledData.amount.toString() : '');
  const [paidBy, setPaidBy] = useState(prefilledData?.paidBy || '');
  const [category, setCategory] = useState<ExpenseCategory>((prefilledData?.category as ExpenseCategory) || 'food');
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'custom' | 'amount' | 'items'>('equal');
  const [customSplits, setCustomSplits] = useState<{ [participantId: string]: string }>({});
  const [percentageSplits, setPercentageSplits] = useState<{ [participantId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false);
  const [ocrData, setOcrData] = useState<ReceiptData | null>(null);
  const [showItemSplit, setShowItemSplit] = useState(false);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Helper function to translate category names
  const translateCategory = (category: ExpenseCategory, language: 'es' | 'en'): string => {
    const translations: Record<ExpenseCategory, { es: string; en: string }> = {
      food: { es: 'Comida', en: 'Food' },
      transport: { es: 'Transporte', en: 'Transport' },
      accommodation: { es: 'Alojamiento', en: 'Accommodation' },
      entertainment: { es: 'Entretenimiento', en: 'Entertainment' },
      shopping: { es: 'Compras', en: 'Shopping' },
      health: { es: 'Salud', en: 'Health' },
      other: { es: 'Otros', en: 'Other' },
    };
    
    const lang = typeof language === 'string' ? language : 'es';
    return translations[category]?.[lang] || translations[category]?.es || category;
  };

  // Cargar datos del evento y plantillas
  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId || isIndividualExpense) {
        // Para gastos individuales, cargar solo plantillas
        try {
          const { auth } = await import('../services/firebase');
          if (auth.currentUser) {
            const userTemplates = await getAllTemplates(auth.currentUser.uid);
            setTemplates(userTemplates);
          }
        } catch (error) {
          console.error('Error cargando plantillas:', error);
        }
        return;
      }
      
      try {
        const { getEvent, auth } = await import('../services/firebase');
        const event = await getEvent(eventId);
        setEventData(event);
        
        // Cargar plantillas del usuario
        if (auth.currentUser) {
          const userTemplates = await getAllTemplates(auth.currentUser.uid);
          setTemplates(userTemplates);
        }
      } catch (error) {
        console.error('Error cargando datos del evento:', error);
      }
    };
    loadEventData();
  }, [eventId, isIndividualExpense]);

  // Cargar datos del gasto en modo edición
  useEffect(() => {
    if (isEditMode && expenses.length > 0) {
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        setDescription(expense.description || '');
        setAmount(expense.amount.toString());
        setPaidBy(expense.paidBy);
        setCategory(expense.category);
        setSelectedBeneficiaries(expense.beneficiaries || expense.participantIds || []);
        setSplitType(expense.splitType || 'equal');
        setReceiptPhoto(expense.receiptPhoto || null);
        
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
    
    if (participants.length > 0 && !isEditMode) {
      // Si hay datos prellenados de paidBy, usarlos; si no, el primer participante
      if (!paidBy || !prefilledData?.paidBy) {
        setPaidBy(participants[0].id);
      }
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

  // Manejar selección de plantilla
  const handleSelectTemplate = async (template: ExpenseTemplate) => {
    try {
      // Aplicar datos de la plantilla
      setDescription(template.name);
      if (template.amount > 0) {
        setAmount(template.amount.toString());
      }
      setCategory(template.category as ExpenseCategory);
      setSplitType(template.splitType);
      
      if (template.customSplits && template.splitType === 'custom') {
        setCustomSplits(
          Object.entries(template.customSplits).reduce((acc, [id, val]) => {
            acc[id] = val.toString();
            return acc;
          }, {} as { [key: string]: string })
        );
      }
      
      // Incrementar contador de uso
      await incrementTemplateUsage(template.id);
      
      setShowTemplates(false);
      Alert.alert('✅ Plantilla aplicada', `Datos de "${template.name}" cargados correctamente`);
    } catch (error) {
      console.error('Error al aplicar plantilla:', error);
      Alert.alert('Error', 'No se pudo aplicar la plantilla');
    }
  };

  // Guardar gasto actual como plantilla
  const handleSaveAsTemplate = async () => {
    try {
      if (!description.trim()) {
        Alert.alert('Error', 'Debes agregar una descripción primero');
        return;
      }

      const amountNum = parseFloat(amount) || 0;
      const { auth } = await import('../services/firebase');
      
      if (!auth.currentUser) {
        Alert.alert('Error', 'Debes iniciar sesión');
        return;
      }

      // Preguntar detalles de la plantilla
      Alert.prompt(
        'Guardar como plantilla',
        '¿Nombre para la plantilla?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Guardar',
            onPress: async (templateName?: string) => {
              if (!templateName) return;
              if (!templateName?.trim()) return;
              
              try {
                const customSplitsNum = splitType === 'custom' ? 
                  Object.entries(customSplits).reduce((acc, [id, val]) => {
                    acc[id] = parseFloat(val) || 0;
                    return acc;
                  }, {} as { [key: string]: number }) : undefined;

                await createTemplateFromExpense(
                  auth.currentUser!.uid,
                  templateName,
                  description,
                  amountNum,
                  category as any,
                  splitType,
                  customSplitsNum,
                  undefined,
                  false,
                  undefined
                );

                // Recargar plantillas
                const updatedTemplates = await getAllTemplates(auth.currentUser!.uid);
                setTemplates(updatedTemplates);
                
                setShowTemplates(false);
                Alert.alert('✅ Plantilla guardada', `"${templateName}" guardada correctamente`);
              } catch (error) {
                console.error('Error al guardar plantilla:', error);
                Alert.alert('Error', 'No se pudo guardar la plantilla');
              }
            },
          },
        ],
        'plain-text',
        description
      );
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
      Alert.alert('Error', 'No se pudo guardar la plantilla');
    }
  };

  // Función para analizar la imagen con OCR
  const processReceiptImage = async (imageUri: string) => {
    setAnalyzingReceipt(true);
    
    try {
      
      const data = await analyzeReceipt(imageUri);
      
      setOcrData(data);

      // Si encontró datos con buena confianza, mostrar diálogo de confirmación
      if (data.confidence > 0.6 && (data.total || data.merchantName)) {
        const message = [
          data.merchantName ? `📍 Lugar: ${data.merchantName}` : '',
          data.total ? `💰 Total: ${data.total.toFixed(2)}€` : '',
          data.date ? `📅 Fecha: ${data.date.toLocaleDateString()}` : '',
          data.category ? `🏷️ Categoría sugerida: ${translateCategory(data.category as ExpenseCategory, currentLanguage.code as 'es' | 'en')}` : '',
          data.items && data.items.length > 0 ? `\n📝 ${data.items.length} items detectados` : '',
        ].filter(Boolean).join('\n');

        // Si hay items detectados, preguntar si quiere dividirlos
        if (data.items && data.items.length > 1) {
          Alert.alert(
            '🤖 Datos del recibo detectados',
            message + '\n\n¿Quieres dividir los items entre participantes?',
            [
              {
                text: 'No, usar total',
                onPress: () => {
                  // Aplicar solo datos generales
                  if (data.total) setAmount(data.total.toString());
                  if (data.merchantName && !description) setDescription(data.merchantName);
                  if (data.category) setCategory(data.category as ExpenseCategory);
                },
              },
              {
                text: 'Sí, dividir items',
                onPress: () => {
                  // Aplicar datos y abrir división de items
                  if (data.merchantName && !description) setDescription(data.merchantName);
                  if (data.category) setCategory(data.category as ExpenseCategory);
                  setShowItemSplit(true);
                },
              },
            ]
          );
        } else {
          // Sin items, mostrar diálogo normal
          Alert.alert(
            '🤖 Datos del recibo detectados',
            message + '\n\n¿Quieres usar estos datos?',
            [
              {
                text: 'No, gracias',
                style: 'cancel',
              },
              {
                text: 'Sí, usar datos',
                onPress: () => {
                  // Aplicar datos detectados
                  if (data.total) {
                    setAmount(data.total.toString());
                  }
                  if (data.merchantName && !description) {
                    setDescription(data.merchantName);
                  }
                  if (data.category) {
                    setCategory(data.category as ExpenseCategory);
                  }
                },
              },
            ]
          );
        }
      } else if (data.total) {
        // Si solo encontró el total, aplicarlo directamente
        setAmount(data.total.toString());
        Alert.alert(
          '✅ Total detectado',
          `Se detectó un total de ${data.total.toFixed(2)}€`
        );
      }
    } catch (error) {
      console.error('Error procesando OCR:', error);
      // No mostrar error al usuario, simplemente no usa OCR
    } finally {
      setAnalyzingReceipt(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('common.error'),
          'Necesitamos acceso a tus fotos para adjuntar recibos'
        );
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
        
        // Analizar automáticamente con OCR
        await processReceiptImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), 'Error al seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('common.error'),
          'Necesitamos acceso a tu cámara para tomar fotos de recibos'
        );
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
        
        // Analizar automáticamente con OCR
        await processReceiptImage(imageUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('common.error'), 'Error al tomar la foto');
    }
  };

  const removePhoto = () => {
    setReceiptPhoto(null);
  };

  const handleDeleteExpense = async () => {
    if (!expenseId) return;

    Alert.alert(
      t('addExpense.deleteTitle'),
      t('addExpense.deleteConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { deleteExpense } = await import('../services/firebase');
              await deleteExpense(expenseId);
              
              Alert.alert(t('common.success'), t('addExpense.expenseDeleted'), [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              console.error('❌ Error eliminando gasto:', error);
              Alert.alert(t('common.error'), error.message || t('addExpense.errorDeleting'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAddExpense = async () => {
    // Validaciones
    if (!description.trim()) {
      Alert.alert(t('common.error'), t('addExpense.descriptionRequired'));
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < VALIDATION.MIN_AMOUNT || amountNum > VALIDATION.MAX_AMOUNT) {
      
      Alert.alert(
        t('common.error'),
        t('addExpense.amountInvalid', { min: VALIDATION.MIN_AMOUNT, max: VALIDATION.MAX_AMOUNT })
      );
      return;
    }

    if (!paidBy) {
      Alert.alert(t('common.error'), t('addExpense.selectWhoPaid'));
      return;
    }

    if (selectedBeneficiaries.length === 0) {
      Alert.alert(t('common.error'), t('addExpense.selectBeneficiaries'));
      return;
    }

    // Validaciones adicionales para división personalizada
    let customSplitsData: { [key: string]: number } | undefined;
    let percentageSplitsData: { [key: string]: number } | undefined;
    
    if (splitType === 'percentage') {
      percentageSplitsData = {};
      let totalPercentage = 0;

      for (const beneficiaryId of selectedBeneficiaries) {
        const percentage = parseFloat(percentageSplits[beneficiaryId] || '0');
        const participant = participants.find(p => p.id === beneficiaryId);
        if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
          Alert.alert(t('common.error'), `El porcentaje de ${participant?.name || 'participante'} debe estar entre 0 y 100`);
          return;
        }
        percentageSplitsData[beneficiaryId] = percentage;
        totalPercentage += percentage;
      }

      // Verificar que la suma sea 100%
      if (Math.abs(totalPercentage - 100) > 0.1) {
        Alert.alert(
          t('common.error'),
          `La suma de porcentajes debe ser 100%. Actualmente es ${totalPercentage.toFixed(1)}%`
        );
        return;
      }
    } else if (splitType === 'custom' || splitType === 'amount') {
      customSplitsData = {};
      let totalCustom = 0;

      for (const beneficiaryId of selectedBeneficiaries) {
        const splitAmount = parseFloat(customSplits[beneficiaryId] || '0');
        const participant = participants.find(p => p.id === beneficiaryId);
        if (isNaN(splitAmount) || splitAmount <= 0) {
          Alert.alert(t('common.error'), t('addExpense.customSplitInvalid', { name: participant?.name || 'participante' }));
          return;
        }
        customSplitsData[beneficiaryId] = splitAmount;
        totalCustom += splitAmount;
      }

      // Verificar que la suma sea igual al total (con margen de error de 0.01 por decimales)
      if (Math.abs(totalCustom - amountNum) > 0.01) {
        Alert.alert(
          t('common.error'),
          t('addExpense.customSplitTotal', { total: totalCustom.toFixed(2), amount: amountNum.toFixed(2) })
        );
        return;
      }
    }
    setLoading(true);

    try {
      let photoURL: string | undefined = undefined;

      // Subir foto si existe
      if (receiptPhoto && receiptPhoto.startsWith('file://')) {
        
        setUploadingPhoto(true);
        try {
          const { uploadReceiptPhoto } = await import('../services/firebase');
          const tempId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          photoURL = await uploadReceiptPhoto(receiptPhoto, tempId);
          
        } catch (photoError) {
          console.error('❌ Error subiendo foto:', photoError);
          Alert.alert(
            'Advertencia',
            'No se pudo subir la foto del recibo, pero se guardará el gasto sin ella. ¿Deseas continuar?',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => { setLoading(false); setUploadingPhoto(false); return; } },
              { text: 'Continuar', onPress: () => { photoURL = undefined; } }
            ]
          );
          return;
        } finally {
          setUploadingPhoto(false);
        }
      } else if (receiptPhoto && receiptPhoto.startsWith('http')) {
        // Ya es una URL (modo edición)
        photoURL = receiptPhoto;
      }

      let success: boolean;
      
      if (isIndividualExpense) {
        // Crear gasto individual sin evento
        
        try {
          const { addDoc, collection, auth } = await import('../services/firebase');
          const { db } = await import('../services/firebase');
          
          await addDoc(collection(db, 'expenses'), {
            paidBy: auth.currentUser?.uid || '',
            amount: amountNum,
            description,
            category,
            currency: 'EUR', // Default para gastos individuales
            createdAt: new Date(),
            splitType: 'equal',
            receiptPhoto: photoURL
          });
          success = true;
        } catch (error) {
          console.error('Error creando gasto individual:', error);
          success = false;
        }
      } else if (isEditMode) {
        
        success = await editExpense(
          expenseId!,
          paidBy,
          amountNum,
          description,
          category,
          selectedBeneficiaries,
          splitType,
          customSplitsData,
          percentageSplitsData,
          photoURL
        );
      } else {
        success = await addExpense(
          paidBy,
          amountNum,
          description,
          category,
          selectedBeneficiaries,
          splitType,
          customSplitsData,
          percentageSplitsData,
          photoURL
        );
      }

      

      if (success) {
        
        // Enviar notificación solo para gastos nuevos
        if (!isEditMode && eventData) {
          await notifyNewExpense(eventData.name, amountNum, eventData.currency);
        }
        
        // Verificar alertas de gastos
        if (eventData) {
          const currentBalance = getRemainingBalance();
          const totalSpent = getTotalExpenses();
          
          // Verificar alerta de dinero disponible bajo
          await checkAvailableAmount(
            currentBalance,
            eventData.currency,
            eventData.name
          );
          
          // Verificar alerta de gasto máximo superado
          await checkTotalSpent(
            totalSpent + amountNum, // Incluir el nuevo gasto
            eventData.currency,
            eventData.name
          );
        }
        
        Alert.alert(
          t('common.success'),
          isEditMode ? t('addExpense.expenseUpdated') : t('addExpense.expenseAdded'),
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(t('common.error'), isEditMode ? t('addExpense.errorUpdating') : t('addExpense.errorAdding'));
      }
    } catch (error: any) {
      console.error(`❌ Error al ${isEditMode ? 'actualizar' : 'agregar'} gasto:`, error);
      Alert.alert(t('common.error'), error.message || (isEditMode ? t('addExpense.errorUpdating') : t('addExpense.errorAdding')));
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
          {/* Botón para abrir plantillas */}
          {!isEditMode && (
            <TouchableOpacity
              style={[styles.templatesButton, { backgroundColor: theme.colors.primary + '15' }]}
              onPress={() => setShowTemplates(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.templatesButtonText, { color: theme.colors.primary }]}>
                📝 Usar plantilla {templates.length > 0 && `(${templates.length})`}
              </Text>
            </TouchableOpacity>
          )}

          <Card>
            <Input
              label={t('addExpense.descriptionLabel')}
              placeholder={t('addExpense.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              maxLength={VALIDATION.MAX_DESCRIPTION_LENGTH}
              autoCapitalize="sentences"
              autoCorrect={true}
            />

            <Input
              label={t('addExpense.amountLabel')}
              placeholder={t('addExpense.amountPlaceholder')}
              value={amount}
              onChangeText={setAmount}
              autoCorrect={false}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>{t('addExpense.categoryLabel')}</Text>
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

            {analyzingReceipt && (
              <View style={styles.ocrAnalyzing}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.ocrAnalyzingText}>
                  🔍 Analizando recibo con IA...
                </Text>
              </View>
            )}
            
            {ocrData && ocrData.confidence > 0.6 && (
              <View style={styles.ocrSuccess}>
                <Text style={styles.ocrSuccessText}>
                  ✨ Datos detectados automáticamente
                </Text>
                {ocrData.items && ocrData.items.length > 0 && (
                  <Text style={styles.ocrItemsText}>
                    📝 {ocrData.items.length} items encontrados
                  </Text>
                )}
              </View>
            )}
            
            {receiptPhoto ? (
              <View style={styles.receiptPreview}>
                <View style={styles.receiptImageContainer}>
                  <Image 
                    source={{ uri: receiptPhoto }} 
                    style={styles.receiptImage}
                    resizeMode="cover"
                  />
                  {analyzingReceipt && (
                    <View style={styles.analyzingOverlay}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                      <Text style={styles.analyzingText}>🔍 Analizando recibo...</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={removePhoto}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removePhotoIcon}>🗑️</Text>
                  <Text style={styles.removePhotoText}>Quitar foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Card style={styles.receiptCard}>
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptIconContainer}>
                    <Text style={styles.receiptIcon}>📸</Text>
                  </View>
                  <View style={styles.receiptTitleContainer}>
                    <Text style={styles.receiptTitle}>Foto del Recibo</Text>
                    <Text style={styles.receiptSubtitle}>Escanea automáticamente con OCR</Text>
                  </View>
                </View>
                <View style={styles.receiptButtons}>
                  <TouchableOpacity 
                    style={[styles.photoButton, styles.photoButtonPrimary]}
                    onPress={takePhoto}
                    disabled={analyzingReceipt}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.photoButtonIcon}>📷</Text>
                    <Text style={styles.photoButtonTextPrimary}>Tomar Foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.photoButton, styles.photoButtonSecondary]}
                    onPress={pickImage}
                    disabled={analyzingReceipt}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.photoButtonIcon}>🖼️</Text>
                    <Text style={styles.photoButtonTextSecondary}>Desde Galería</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {!isIndividualExpense && (
              <>
                <Text style={styles.label}>{t('addExpense.whoPaidLabel')}</Text>
                {participants.length === 0 ? (
                  <Text style={styles.emptyText}>{t('addExpense.noParticipants')}</Text>
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
              </>
            )}

            {!isIndividualExpense && (
              <>
                <Text style={styles.label}>¿Cómo quieres dividir el gasto? *</Text>
                <View style={styles.splitTypeContainer}>
                  <View style={styles.splitTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.splitTypeButton,
                    splitType === 'equal' && styles.splitTypeButtonActive,
                  ]}
                  onPress={() => setSplitType('equal')}
                >
                  <Text style={styles.splitTypeIcon}>⚖️</Text>
                  <Text
                    style={[
                      styles.splitTypeText,
                      splitType === 'equal' && styles.splitTypeTextActive,
                    ]}
                  >
                    Partes iguales
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.splitTypeButton,
                    splitType === 'percentage' && styles.splitTypeButtonActive,
                  ]}
                  onPress={() => setSplitType('percentage')}
                >
                  <Text style={styles.splitTypeIcon}>📊</Text>
                  <Text
                    style={[
                      styles.splitTypeText,
                      splitType === 'percentage' && styles.splitTypeTextActive,
                    ]}
                  >
                    Porcentaje
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.splitTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.splitTypeButton,
                    splitType === 'amount' && styles.splitTypeButtonActive,
                  ]}
                  onPress={() => setSplitType('amount')}
                >
                  <Text style={styles.splitTypeIcon}>💰</Text>
                  <Text
                    style={[
                      styles.splitTypeText,
                      splitType === 'amount' && styles.splitTypeTextActive,
                    ]}
                  >
                    Cantidad fija
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.splitTypeButton,
                    splitType === 'custom' && styles.splitTypeButtonActive,
                  ]}
                  onPress={() => setSplitType('custom')}
                >
                  <Text style={styles.splitTypeIcon}>🎯</Text>
                  <Text
                    style={[
                      styles.splitTypeText,
                      splitType === 'custom' && styles.splitTypeTextActive,
                    ]}
                  >
                    Personalizado
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.splitTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.splitTypeButton,
                    splitType === 'items' && styles.splitTypeButtonActive,
                  ]}
                  onPress={() => setSplitType('items')}
                >
                  <Text style={styles.splitTypeIcon}>🧾</Text>
                  <Text
                    style={[
                      styles.splitTypeText,
                      splitType === 'items' && styles.splitTypeTextActive,
                    ]}
                  >
                    Por items
                  </Text>
                </TouchableOpacity>
                <View style={styles.splitTypeButtonPlaceholder} />
              </View>
                </View>

                <Text style={styles.label}>
                  {t('addExpense.beneficiariesTitle')} * 
                  {splitType === 'equal' && ' (A partes iguales)'}
                  {splitType === 'percentage' && ' (Por porcentaje)'}
                  {splitType === 'amount' && ' (Cantidad fija por persona)'}
                  {splitType === 'custom' && ' (Personalizado)'}
                  {splitType === 'items' && ' (Por items)'}
                </Text>
                
                {splitType === 'percentage' && amount && (
                  <View style={styles.customSummary}>
                    <Text style={styles.customSummaryText}>
                      💡 La suma de porcentajes debe ser 100%
                    </Text>
                    <Text style={styles.customSummaryText}>
                      Suma actual: {
                        selectedBeneficiaries.reduce((sum, id) => {
                          return sum + parseFloat(percentageSplits[id] || '0');
                        }, 0).toFixed(1)
                      }%
                    </Text>
                  </View>
                )}
                
                {(splitType === 'custom' || splitType === 'amount') && amount && (
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
                  <Text style={styles.emptyText}>{t('addExpense.noParticipantsAvailable')}</Text>
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
                    ) : splitType === 'percentage' ? (
                      // Modo porcentaje: inputs de porcentaje
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', width: 90 }}>
                              <Input
                                placeholder="0"
                                value={percentageSplits[participant.id] || ''}
                                onChangeText={(text) => {
                                  setPercentageSplits({
                                    ...percentageSplits,
                                    [participant.id]: text
                                  });
                                }}
                                keyboardType="decimal-pad"
                                style={[styles.customAmountInput, { width: 70 }]}
                              />
                              <Text style={{ marginLeft: 4, color: theme.colors.text }}>%</Text>
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      // Modo personalizado/amount: inputs de monto
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
              </>
            )}
          </Card>

          <Button
            title={isEditMode ? t('addExpense.updateButton') : t('addExpense.addButton')}
            onPress={handleAddExpense}
            loading={loading}
            fullWidth
            size="large"
          />

          {isEditMode && expenseId && (
            <Button
              title={t('addExpense.deleteButton')}
              onPress={handleDeleteExpense}
              variant="danger"
              fullWidth
              size="large"
              style={{ marginTop: 12 }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de división de items */}
      {ocrData && ocrData.items && (
        <ItemSplitScreen
          visible={showItemSplit}
          items={ocrData.items}
          participants={participants}
          onClose={() => setShowItemSplit(false)}
          onConfirm={(items) => {
            setExpenseItems(items);
            setSplitType('custom'); // Cambiar a modo custom ya que los items definen la división
            setShowItemSplit(false);
            
            // Calcular el total de todos los items
            const total = items.reduce((sum, item) => sum + item.price, 0);
            setAmount(total.toString());
            
            // Calcular splits personalizados basados en los items
            const splits: { [participantId: string]: number } = {};
            items.forEach(item => {
              const pricePerPerson = item.price / item.assignedTo.length;
              item.assignedTo.forEach(participantId => {
                splits[participantId] = (splits[participantId] || 0) + pricePerPerson;
              });
            });
            
            // Convertir a strings para los inputs
            const customSplitsStr: { [key: string]: string } = {};
            Object.keys(splits).forEach(id => {
              customSplitsStr[id] = splits[id].toFixed(2);
            });
            setCustomSplits(customSplitsStr);
            
            // Seleccionar beneficiarios que tienen algún item asignado
            setSelectedBeneficiaries(Object.keys(splits));
            
            Alert.alert(
              '✅ División completada',
              `Items divididos entre ${Object.keys(splits).length} personas`
            );
          }}
        />
      )}

      {/* Modal de plantillas */}
      <ExpenseTemplatesModal
        visible={showTemplates}
        templates={templates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
        onSaveAsTemplate={handleSaveAsTemplate}
      />
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
  templatesButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  templatesButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
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
    marginBottom: 20,
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
  receiptCard: {
    marginBottom: 20,
    backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)',
    borderWidth: 2,
    borderColor: theme.isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
    borderStyle: 'dashed',
  },
  receiptHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  receiptIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptIcon: {
    fontSize: 20,
  },
  receiptTitleContainer: {
    flex: 1,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  receiptSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  receiptButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  photoButtonPrimary: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
  },
  photoButtonSecondary: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  photoButtonIcon: {
    fontSize: 24,
  },
  photoButtonTextPrimary: {
    fontSize: 13,
    color: theme.colors.card,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  photoButtonTextSecondary: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  receiptPreview: {
    marginBottom: 20,
  },
  receiptImageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  receiptImage: {
    width: '100%',
    height: 240,
    backgroundColor: theme.colors.inputBackground,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.card,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  removePhotoIcon: {
    fontSize: 20,
  },
  removePhotoText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.card,
    letterSpacing: 0.3,
  },
  receiptSection: {
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  ocrAnalyzing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  ocrAnalyzingText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  ocrSuccess: {
    backgroundColor: theme.isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.2)',
  },
  ocrSuccessText: {
    fontSize: 14,
    color: theme.isDark ? '#34D399' : '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  ocrItemsText: {
    fontSize: 12,
    color: theme.isDark ? '#6EE7B7' : '#10B981',
    fontWeight: '500',
  },
  splitTypeContainer: {
    gap: 12,
    marginBottom: 16,
  },
  splitTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitTypeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  splitTypeButtonPlaceholder: {
    flex: 1,
    opacity: 0,
  },
  splitTypeButtonActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  splitTypeIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  splitTypeText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  splitTypeTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
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
