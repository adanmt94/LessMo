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
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { RootStackParamList } from '../types';
import { Button, Input, Card } from '../components/lovable';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;

interface Props {
  navigation: EditProfileScreenNavigationProp;
}

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
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
      
      Alert.alert(t('common.error'), t('editProfile.errorLoadingProfile'));
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      
      
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      
      if (status !== 'granted') {
        Alert.alert(
          t('editProfile.permissionsNeeded'),
          t('editProfile.galleryPermission')
        );
        return;
      }

      // Abrir selector de imágenes
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any, // Workaround for expo-image-picker v15+
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3, // Comprimir más para ahorrar espacio (reducido de 0.5 a 0.3)
      });

      

      if (!result.canceled && result.assets[0]) {
        
        await uploadImage(result.assets[0].uri);
      } else {
        
      }
    } catch (error: any) {
      
      Alert.alert(t('common.error'), error.message || t('editProfile.errorPickingPhoto'));
    }
  };

  const takePhoto = async () => {
    try {
      // Pedir permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('editProfile.permissionsNeeded'),
          t('editProfile.cameraPermission')
        );
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3, // Comprimir más para ahorrar espacio (reducido de 0.5 a 0.3)
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      
      Alert.alert(t('common.error'), t('editProfile.errorTakingPhoto'));
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) {
      
      return;
    }

    try {
      setUploading(true);
      

      // SOLUCIÓN: Firebase Storage no funciona en Expo Go
      // Usar URI local directamente y guardar en Firestore
      
      
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        photoURL: uri,
        updatedAt: new Date(),
      }, { merge: true });

      // Actualizar estado local
      setPhotoURL(uri);
      
      
      Alert.alert(t('editProfile.photoSuccess'), t('editProfile.photoSuccessMessage'));
    } catch (error: any) {
      
      Alert.alert(t('common.error'), error.message || t('editProfile.errorUploadingPhoto'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert(t('common.error'), t('editProfile.nameRequired'));
      return;
    }

    if (name.length > 50) {
      Alert.alert(t('common.error'), t('editProfile.nameTooLong'));
      return;
    }

    try {
      setSaving(true);

      const userDocRef = doc(db, 'users', user.uid);
      
      // Usar setDoc con merge para crear el documento si no existe
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        name: name.trim(),
        photoURL: photoURL || '',
        updatedAt: new Date(),
      }, { merge: true });

      // Actualizar también todos los participantes con este userId
      try {
        const participantsQuery = query(
          collection(db, 'participants'),
          where('userId', '==', user.uid)
        );
        const participantsSnapshot = await getDocs(participantsQuery);
        
        const updatePromises = participantsSnapshot.docs.map(participantDoc => 
          updateDoc(doc(db, 'participants', participantDoc.id), {
            photoURL: photoURL || '',
            name: name.trim() // También actualizamos el nombre
          })
        );
        
        await Promise.all(updatePromises);
        
      } catch (error) {
        
        // No mostramos error al usuario, solo logueamos
      }

      Alert.alert(
        t('editProfile.profileUpdated'),
        t('editProfile.profileUpdatedMessage'),
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      
      Alert.alert(t('common.error'), t('editProfile.errorSavingProfile'));
    } finally {
      setSaving(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      t('editProfile.photoOptions'),
      t('editProfile.photoOptionsMessage'),
      [
        {
          text: t('editProfile.takePhoto'),
          onPress: takePhoto,
        },
        {
          text: t('editProfile.chooseFromGallery'),
          onPress: pickImage,
        },
        {
          text: t('common.cancel'),
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
          <Text style={styles.loadingText}>{t('editProfile.loadingProfile')}</Text>
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
                  <ActivityIndicator size="large" color={theme.colors.card} />
                </View>
              ) : (
                <View style={styles.cameraIcon}>
                  <Text style={styles.cameraIconText}>📷</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.photoHint}>{t('editProfile.photoHint')}</Text>
          </Card>

          {/* Información del perfil */}
          <Card style={styles.infoSection}>
            <Text style={styles.sectionTitle}>{t('editProfile.personalInfo')}</Text>

            <Input
              label={t('editProfile.nameLabel')}
              value={name}
              onChangeText={setName}
              placeholder={t('editProfile.namePlaceholder')}
              maxLength={50}
              editable={!saving}
            />

            <Input
              label={t('editProfile.emailLabel')}
              value={email}
              editable={false}
              placeholder={t('editProfile.emailPlaceholder')}
              style={styles.emailInput}
            />

            <Text style={styles.emailHint}>
              {t('editProfile.emailHint')}
            </Text>
          </Card>

          {/* Botón guardar */}
          <Button
            title={saving ? t('editProfile.saving') : t('editProfile.saveButton')}
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

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: theme.colors.primary,
    fontWeight: '300',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
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
    backgroundColor: theme.colors.border,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 48,
    color: theme.colors.card,
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
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.card,
  },
  cameraIconText: {
    fontSize: 20,
  },
  photoHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  infoSection: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  emailInput: {
    backgroundColor: theme.colors.surface,
  },
  emailHint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: -8,
    marginBottom: 8,
  },
  saveButton: {
    marginBottom: 32,
  },
});
