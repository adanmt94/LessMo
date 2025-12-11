/**
 * ChatScreen - Pantalla de chat para eventos y eventos
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../types';
import { 
  sendEventMessage, 
  subscribeToEventMessages,
  sendGroupMessage,
  subscribeToGroupMessages,
  uploadChatImage 
} from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { detectPayment, highlightPaymentInMessage, PaymentInfo } from '../utils/paymentDetector';
import { analyzeReceipt } from '../services/ocrService';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Props {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  imageUrl?: string;
  receiptData?: {
    amount: number;
    description: string;
    category: string;
  };
  createdAt: any;
}

export const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { eventId, groupId, title } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ title: title || 'Chat' });
  }, [title]);

  useEffect(() => {
    if (!eventId && !groupId) return;

    // Suscribirse a mensajes en tiempo real
    const unsubscribe = eventId
      ? subscribeToEventMessages(eventId, (msgs) => {
          setMessages(msgs);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        })
      : subscribeToGroupMessages(groupId!, (msgs) => {
          setMessages(msgs);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

    return () => unsubscribe();
  }, [eventId, groupId]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para enviar fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar fotos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const handleImageOptions = () => {
    Alert.alert(
      'Enviar imagen',
      '¿De dónde quieres obtener la imagen?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: '📷 Tomar foto',
          onPress: handleTakePhoto,
        },
        {
          text: '🖼️ Desde galería',
          onPress: handlePickImage,
        },
      ]
    );
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedImage) return;
    if (!user?.uid) {
      Alert.alert('Error', 'Debes iniciar sesión para enviar mensajes');
      return;
    }

    const messageText = newMessage.trim();
    const imageUri = selectedImage;
    setNewMessage('');
    setSelectedImage(null);
    setSending(true);

    try {
      const userName = user.displayName || user.email || 'Anónimo';
      let imageUrl: string | undefined;
      let receiptData: any;

      // Si hay imagen, subirla y analizarla
      if (imageUri) {
        setAnalyzingReceipt(true);
        
        // Subir imagen a Firebase Storage
        const chatId = eventId || groupId!;
        imageUrl = await uploadChatImage(chatId, imageUri);
        
          // Analizar recibo con OCR
          try {
            const analysis = await analyzeReceipt(imageUri);
            if (analysis && analysis.total && analysis.total > 0) {
              receiptData = {
                amount: analysis.total,
                description: analysis.merchantName || 'Gasto detectado',
                category: analysis.category || 'other',
              };
              
              // Mostrar alerta con opción de crear gasto
              Alert.alert(
                '🧾 Recibo detectado',
                `Se detectó un gasto de ${analysis.total}€\n${analysis.merchantName || 'Comercio'}\n\n¿Quieres crear el gasto automáticamente?`,
                [
                  {
                    text: 'Solo enviar imagen',
                    style: 'cancel',
                  },
                  {
                    text: 'Crear gasto',
                    onPress: () => {
                      navigation.navigate('AddExpense', {
                        eventId: (eventId || groupId) as string,
                        prefilledData: {
                          amount: analysis.total,
                          description: analysis.merchantName || 'Gasto detectado',
                          category: analysis.category || 'other',
                        },
                      });
                    },
                  },
                ]
              );
            }
          } catch (ocrError) {
            
            // Continuar enviando la imagen sin análisis
          }        setAnalyzingReceipt(false);
      }
      
      // Enviar mensaje con imagen y datos del recibo (si existen)
      const finalMessage = messageText || (imageUrl ? '📷 Imagen' : '');
      
      if (eventId) {
        await sendEventMessage(eventId, user.uid, userName, finalMessage, imageUrl, receiptData);
      } else if (groupId) {
        await sendGroupMessage(groupId, user.uid, userName, finalMessage, imageUrl, receiptData);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar el mensaje');
      setNewMessage(messageText);
      setSelectedImage(imageUri);
    } finally {
      setSending(false);
      setAnalyzingReceipt(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Si es hoy, mostrar solo hora
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es esta semana, mostrar día y hora
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    
    // Más antiguo, mostrar fecha completa
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handlePaymentClick = (paymentInfo: PaymentInfo, message: Message) => {
    if (!eventId && !groupId) return;
    
    const messageText = t('chat.createExpenseMessage', {
      amount: paymentInfo.amount.toString(),
      description: paymentInfo.description,
    });
    
    Alert.alert(
      t('chat.createExpenseTitle'),
      messageText,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('chat.createExpense'),
          onPress: () => {
            // Navegar a la pantalla de añadir gasto con los datos prellenados
            navigation.navigate('AddExpense', {
              eventId: eventId || undefined,
              groupId: groupId || undefined,
              prefilledData: {
                amount: paymentInfo.amount,
                description: paymentInfo.description,
                category: paymentInfo.category || 'other',
                paidBy: message.userId,
              },
            });
          },
        },
      ]
    );
  };

  const handleReceiptClick = (item: Message) => {
    if (!item.receiptData) return;
    
    Alert.alert(
      '🧾 Crear gasto desde recibo',
      `Importe: ${item.receiptData.amount}€\n${item.receiptData.description}`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Crear gasto',
          onPress: () => {
            navigation.navigate('AddExpense', {
              eventId: (eventId || groupId) as string,
              prefilledData: {
                amount: item.receiptData!.amount,
                description: item.receiptData!.description,
                category: item.receiptData!.category,
              },
            });
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.userId === user?.uid;
    const paymentInfo = detectPayment(item.message);
    const messageParts = highlightPaymentInMessage(item.message);
    const hasReceipt = !!item.receiptData;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <Text style={styles.messageSender}>{item.userName}</Text>
        )}
        <TouchableOpacity
          activeOpacity={(paymentInfo || hasReceipt) ? 0.7 : 1}
          onPress={() => {
            if (hasReceipt) {
              handleReceiptClick(item);
            } else if (paymentInfo) {
              handlePaymentClick(paymentInfo, item);
            }
          }}
          disabled={!paymentInfo && !hasReceipt}
        >
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            (paymentInfo || hasReceipt) && styles.paymentMessageBubble,
          ]}>
            {/* Imagen si existe */}
            {item.imageUrl && (
              <Image 
                source={{ uri: item.imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            )}
            
            {/* Badge de recibo si fue analizado */}
            {hasReceipt && (
              <View style={styles.receiptBadge}>
                <Text style={styles.receiptBadgeText}>🧾 Recibo detectado</Text>
                <Text style={styles.receiptAmount}>{item.receiptData!.amount}€</Text>
              </View>
            )}
            
            {/* Mensaje de texto */}
            {item.message && (
              <Text style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                item.imageUrl && styles.messageTextWithImage,
              ]}>
                {messageParts.map((part, index) => (
                  <Text
                    key={index}
                    style={[
                      part.isPayment && styles.paymentHighlight,
                    ]}
                  >
                    {part.text}
                  </Text>
                ))}
              </Text>
            )}
            
            {/* Hints para acciones */}
            {paymentInfo && !hasReceipt && (
              <Text style={[
                styles.paymentHint,
                isOwnMessage && styles.paymentHintOwn
              ]}>
                {t('chat.tapToCreateExpense')}
              </Text>
            )}
            {hasReceipt && (
              <Text style={[
                styles.paymentHint,
                isOwnMessage && styles.paymentHintOwn
              ]}>
                💡 Toca para crear gasto
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={100}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No hay mensajes aún</Text>
            <Text style={styles.emptyHint}>¡Sé el primero en escribir!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Preview de imagen seleccionada */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
            {analyzingReceipt && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator color="#FFFFFF" size="large" />
                <Text style={styles.analyzingText}>🔍 Analizando recibo...</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={handleImageOptions}
            disabled={sending}
          >
            <Text style={styles.imageButtonText}>📷</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={theme.colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={handleSend}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, ((!newMessage.trim() && !selectedImage) || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={(!newMessage.trim() && !selectedImage) || sending}
          >
            <Text style={styles.sendButtonText}>
              {sending ? '⏳' : '📤'}
            </Text>
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
  keyboardView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '75%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 16,
  },
  ownMessageBubble: {
    backgroundColor: theme.colors.primary,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.surface,
  },
  messageText: {
    fontSize: 15,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  messageTime: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginHorizontal: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    color: theme.colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  sendButtonText: {
    fontSize: 20,
  },
  imageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imageButtonText: {
    fontSize: 24,
  },
  imagePreviewContainer: {
    margin: 12,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  analyzingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageTextWithImage: {
    marginTop: 4,
  },
  receiptBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  paymentMessageBubble: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  paymentHighlight: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  paymentHint: {
    fontSize: 11,
    color: theme.colors.primary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  paymentHintOwn: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
