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

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Suscribirse a cambios de autenticación
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  /**
   * Registrar nuevo usuario
   */
  const register = async (email: string, password: string, displayName: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await registerWithEmail(email, password, displayName);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
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
      await signInWithEmail(email, password);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
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
      await firebaseSignOut();
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al cerrar sesión');
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
