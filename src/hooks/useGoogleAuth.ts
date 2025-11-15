/**
 * Hook para autenticación con Google usando expo-auth-session
 */

import { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogleToken } from '../services/firebase';
import Constants from 'expo-constants';

// Necesario para que el flujo de autenticación funcione correctamente
WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configurar Google Auth con tus credenciales de Firebase
  // IMPORTANTE: Debes obtener estos valores de Firebase Console
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId,
    iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
    webClientId: Constants.expoConfig?.extra?.googleWebClientId,
    language: 'es-ES', // Forzar español de España en Google Sign-In
    // Para Expo Go, usar el redirect URI de desarrollo
    // Para standalone builds, usar el scheme de la app
    selectAccount: true, // Permitir elegir cuenta
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleSignIn(authentication.idToken);
      }
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogleToken(idToken);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await promptAsync();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    loading,
    error,
    request,
  };
};
