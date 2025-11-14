/**
 * EditProfileScreen - Pantalla para editar nombre y foto de perfil
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { RootStackParamList } from '../types';
import { Button, Input, Card } from '../components/lovable';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;

interface Props {
  navigation: EditProfileScreenNavigationProp;
}

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setName(userData.name || user.displayName || '');
        setEmail(user.email || '');
        setPhotoURL(userData.photoURL || user.photoURL || null);
      } else {
        // Si no existe el documento, crear uno con datos básicos
        setName(user.displayName || '');
        setEmail(user.email || '');
        setPhotoURL(user.photoURL || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      console.log('📸 Iniciando selección de imagen...');
      
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🔑 Permisos de galería:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Necesitamos permisos para acceder a tus fotos'
        );
        return;
      }

      // Abrir selector de imágenes
      console.log('🖼️ Abriendo selector de imágenes...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any, // Workaround for expo-image-picker v15+
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Comprimir para ahorrar espacio
      });

      console.log('📋 Resultado del picker:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('✅ Imagen seleccionada:', result.assets[0].uri);
        await uploadImage(result.assets[0].uri);
      } else {
        console.log('❌ Selección cancelada');
      }
    } catch (error: any) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', error.message || 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      // Pedir permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Necesitamos permisos para usar la cámara'
        );
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) {
      console.log('❌ No user');
      return;
    }

    try {
      setUploading(true);
      console.log('📤 Iniciando upload de imagen desde:', uri);

      // Validar URI
      if (!uri || uri.trim() === '') {
        throw new Error('URI de imagen inválida');
      }

      // Verificar que storage esté inicializado
      if (!storage) {
        console.error('❌ Firebase Storage no está inicializado');
        throw new Error('Firebase Storage no disponible. Por favor reinicia la app.');
      }
      console.log('✅ Firebase Storage OK');

      // Obtener la imagen como blob
      console.log('📥 Fetching image...');
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Error al obtener imagen: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('✅ Blob creado, tamaño:', blob.size, 'tipo:', blob.type);

      if (blob.size === 0) {
        throw new Error('La imagen está vacía');
      }

      // Crear referencia en Storage
      const filename = `profile_${user.uid}_${Date.now()}.jpg`;
      console.log('📁 Creando referencia para:', filename);
      const storageRef = ref(storage, `profiles/${filename}`);
      console.log('✅ Referencia creada correctamente');

      // Subir imagen
      const uploadResult = await uploadBytes(storageRef, blob);
      console.log('✅ Imagen subida:', uploadResult.metadata.fullPath);

      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);
      console.log('✅ URL obtenida:', downloadURL);

      setPhotoURL(downloadURL);
      Alert.alert('¡Éxito!', 'Foto actualizada correctamente');
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      Alert.alert('Error', error.message || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    if (name.length > 50) {
      Alert.alert('Error', 'El nombre no puede tener más de 50 caracteres');
      return;
    }

    try {
      setSaving(true);

      const userDocRef = doc(db, 'users', user.uid);
      
      // Actualizar documento de usuario en Firestore
      await updateDoc(userDocRef, {
        name: name.trim(),
        photoURL: photoURL || '',
        updatedAt: new Date(),
      });

      Alert.alert(
        '¡Perfil actualizado!',
        'Los cambios se han guardado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving profile:', error);
      
      // Si el documento no existe, crearlo
      if (error.code === 'not-found') {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            name: name.trim(),
            photoURL: photoURL || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          Alert.alert(
            '¡Perfil creado!',
            'Tu perfil se ha creado correctamente',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } catch (createError) {
          Alert.alert('Error', 'No se pudo guardar el perfil');
        }
      } else {
        Alert.alert('Error', 'No se pudo guardar el perfil');
      }
    } finally {
      setSaving(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Foto de perfil',
      'Selecciona una opción',
      [
        {
          text: 'Tomar foto',
          onPress: takePhoto,
        },
        {
          text: 'Elegir de galería',
          onPress: pickImage,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Foto de perfil */}
          <Card style={styles.photoSection}>
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={showPhotoOptions}
              disabled={uploading}
            >
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>
                    {name.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              
              {uploading ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              ) : (
                <View style={styles.cameraIcon}>
                  <Text style={styles.cameraIconText}>📷</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.photoHint}>Toca para cambiar foto</Text>
          </Card>

          {/* Información del perfil */}
          <Card style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Información Personal</Text>

            <Input
              label="Nombre *"
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre completo"
              maxLength={50}
              editable={!saving}
            />

            <Input
              label="Email"
              value={email}
              editable={false}
              placeholder="tu@email.com"
              style={styles.emailInput}
            />

            <Text style={styles.emailHint}>
              El email no se puede cambiar
            </Text>
          </Card>

          {/* Botón guardar */}
          <Button
            title={saving ? 'Guardando...' : 'Guardar cambios'}
            onPress={handleSave}
            disabled={saving || uploading}
            fullWidth
            style={styles.saveButton}
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
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: '#6366F1',
    fontWeight: '300',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  photoSection: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraIconText: {
    fontSize: 20,
  },
  photoHint: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoSection: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emailInput: {
    backgroundColor: '#F3F4F6',
  },
  emailHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: -8,
    marginBottom: 8,
  },
  saveButton: {
    marginBottom: 32,
  },
});
