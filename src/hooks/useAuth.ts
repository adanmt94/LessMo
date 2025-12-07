/**
 * Hook personalizado para manejar autenticación
 */

import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  auth, 
  registerWithEmail, 
  signInWithEmail, 
  signOut as firebaseSignOut,
  onAuthChange 
} from '../services/firebase';
import { User } from '../types';
import { ErrorHandler } from '../utils/errorHandler';
import { logger, LogCategory } from '../utils/logger';
import { analytics } from '../utils/analytics';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Suscribirse a cambios de autenticación
      const unsubscribe = onAuthChange((firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        
        // Configurar analytics con el usuario
        if (firebaseUser) {
          analytics.setUserId(firebaseUser.uid);
          logger.info(LogCategory.AUTH, 'Usuario autenticado', { uid: firebaseUser.uid });
        } else {
          analytics.setUserId(undefined);
          logger.info(LogCategory.AUTH, 'Usuario cerró sesión');
        }
      });

      // Cleanup subscription
      return () => {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Error al limpiar auth listener:', err);
        }
      };
    } catch (err) {
      console.error('Error configurando auth listener:', err);
      setLoading(false);
      setError('Error inicializando autenticación');
      return () => {};
    }
  }, []);

  /**
   * Registrar nuevo usuario
   */
  const register = async (email: string, password: string, displayName: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      logger.info(LogCategory.AUTH, 'Registrando usuario', { email });
      await registerWithEmail(email, password, displayName);
      logger.info(LogCategory.AUTH, 'Usuario registrado exitosamente');
      return true;
    } catch (err: any) {
      const appError = ErrorHandler.handle(err, LogCategory.AUTH, false);
      setError(appError.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Iniciar sesión
   */
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      logger.info(LogCategory.AUTH, 'Iniciando sesión', { email });
      await signInWithEmail(email, password);
      logger.info(LogCategory.AUTH, 'Sesión iniciada exitosamente');
      return true;
    } catch (err: any) {
      const appError = ErrorHandler.handle(err, LogCategory.AUTH, false);
      setError(appError.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar sesión
   */
  const signOut = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      logger.info(LogCategory.AUTH, 'Cerrando sesión');
      await firebaseSignOut();
      logger.info(LogCategory.AUTH, 'Sesión cerrada exitosamente');
      return true;
    } catch (err: any) {
      const appError = ErrorHandler.handle(err, LogCategory.AUTH, false);
      setError(appError.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    register,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
};
