/**
 * biometricAuthService - Servicio para autenticación biométrica con Firebase
 * Maneja el inicio de sesión automático usando el UID guardado
 */

import * as SecureStore from 'expo-secure-store';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const BIOMETRIC_USER_UID_KEY = 'biometric_user_uid';
const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

/**
 * Intenta iniciar sesión con el usuario guardado en biometría
 * @param uid - UID del usuario obtenido de la autenticación biométrica
 * @returns true si el inicio de sesión fue exitoso
 */
export const signInWithBiometricUID = async (uid: string): Promise<boolean> => {
  try {
    

    // Verificar que el usuario existe en Firestore
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      console.error('❌ [BIOMETRIC] Usuario no existe en Firestore');
      // Limpiar datos de biometría si el usuario ya no existe
      await clearBiometricData();
      return false;
    }

    // Verificar si el usuario actual de Firebase coincide con el UID guardado
    const currentUser = auth.currentUser;
    
    if (currentUser && currentUser.uid === uid) {
      // Ya está autenticado con el usuario correcto
      
      return true;
    }

    // Si hay otro usuario autenticado, cerrar sesión primero
    if (currentUser && currentUser.uid !== uid) {
      
      await auth.signOut();
    }

    // IMPORTANTE: Firebase no permite signIn directo con UID desde el cliente
    // La única forma segura es que el usuario ya esté autenticado
    // Si no lo está, debemos pedirle que vuelva a iniciar sesión
    
    
    
    
    // Mantener los datos de biometría para intentar más tarde
    return false;
  } catch (error) {
    console.error('❌ [BIOMETRIC] Error restaurando sesión:', error);
    return false;
  }
};

/**
 * Verifica si hay un usuario guardado para biometría
 */
export const hasBiometricUserSaved = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    const uid = await SecureStore.getItemAsync(BIOMETRIC_USER_UID_KEY);
    return enabled === 'true' && !!uid;
  } catch (error) {
    console.error('❌ [BIOMETRIC] Error verificando usuario guardado:', error);
    return false;
  }
};

/**
 * Obtiene el UID del usuario guardado
 */
export const getSavedBiometricUID = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(BIOMETRIC_USER_UID_KEY);
  } catch (error) {
    console.error('❌ [BIOMETRIC] Error obteniendo UID guardado:', error);
    return null;
  }
};

/**
 * Limpia todos los datos de biometría guardados
 */
export const clearBiometricData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_USER_UID_KEY);
    
  } catch (error) {
    console.error('❌ [BIOMETRIC] Error limpiando datos:', error);
  }
};

/**
 * Verifica si el UID guardado coincide con el usuario actual
 */
export const isBiometricUserCurrent = async (): Promise<boolean> => {
  try {
    const savedUID = await getSavedBiometricUID();
    const currentUser = auth.currentUser;
    
    if (!savedUID || !currentUser) {
      return false;
    }
    
    return savedUID === currentUser.uid;
  } catch (error) {
    console.error('❌ [BIOMETRIC] Error verificando usuario actual:', error);
    return false;
  }
};
