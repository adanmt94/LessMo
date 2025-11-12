/**
 * Configuración y funciones de Firebase para LessMo
 */

import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  writeBatch
} from 'firebase/firestore';

import { 
  User, 
  Event, 
  Participant, 
  Expense, 
  Currency 
} from '../types';

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Providers para autenticación social
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

// ==================== AUTENTICACIÓN ====================

/**
 * Registrar nuevo usuario con email y password
 */
export const registerWithEmail = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user: User = {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName,
      createdAt: new Date(),
    };
    
    // Guardar usuario en Firestore
    await setDoc(doc(db, 'users', user.uid), user);
    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Iniciar sesión con email y password
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    } else {
      throw new Error('Usuario no encontrado');
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Cerrar sesión
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Observar cambios en el estado de autenticación
 */
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Iniciar sesión con Google usando Firebase Authentication
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    // Firebase Auth maneja automáticamente Google Sign-In en Expo
    // Solo necesitas configurar el Google Provider en Firebase Console
    const provider = new GoogleAuthProvider();
    
    // Para Expo/React Native, usamos el flujo de redirect/popup no está disponible
    // Necesitamos usar expo-auth-session con el token de Google
    throw new Error('Usa signInWithGoogleToken con el token de Google OAuth');
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Iniciar sesión con token de Google (obtenido via expo-auth-session)
 */
export const signInWithGoogleToken = async (idToken: string): Promise<User> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    
    // Verificar si el usuario ya existe en Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    } else {
      // Crear nuevo usuario en Firestore
      const newUser: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName || userCredential.user.email!.split('@')[0],
        createdAt: new Date(),
      };
      await setDoc(doc(db, 'users', newUser.uid), newUser);
      return newUser;
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ==================== EVENTOS ====================

/**
 * Crear nuevo evento
 */
export const createEvent = async (
  name: string,
  initialBudget: number,
  currency: Currency,
  userId: string,
  description?: string
): Promise<string> => {
  try {
    const eventData: Omit<Event, 'id'> = {
      name,
      description,
      createdBy: userId,
      createdAt: new Date(),
      initialBudget,
      currency,
      participantIds: [],
      isActive: true,
    };
    
    const docRef = await addDoc(collection(db, 'events'), eventData);
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Obtener evento por ID
 */
export const getEvent = async (eventId: string): Promise<Event | null> => {
  try {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    
    if (eventDoc.exists()) {
      return { id: eventDoc.id, ...eventDoc.data() } as Event;
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Obtener eventos del usuario
 */
export const getUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    const q = query(
      collection(db, 'events'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Event));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Actualizar evento
 */
export const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'events', eventId), updates as any);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Eliminar evento
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    // Eliminar evento
    await deleteDoc(doc(db, 'events', eventId));
    
    // Eliminar participantes asociados
    const participantsQuery = query(
      collection(db, 'participants'),
      where('eventId', '==', eventId)
    );
    const participantsSnapshot = await getDocs(participantsQuery);
    
    const batch = writeBatch(db);
    participantsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Eliminar gastos asociados
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('eventId', '==', eventId)
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    expensesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ==================== PARTICIPANTES ====================

/**
 * Agregar participante a un evento
 */
export const addParticipant = async (
  eventId: string,
  name: string,
  individualBudget: number,
  email?: string,
  userId?: string
): Promise<string> => {
  try {
    const participantData: Omit<Participant, 'id'> = {
      eventId,
      userId,
      name,
      email,
      individualBudget,
      currentBalance: individualBudget,
      joinedAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, 'participants'), participantData);
    
    // Actualizar el evento con el nuevo participante
    const event = await getEvent(eventId);
    if (event) {
      const updatedParticipantIds = [...event.participantIds, docRef.id];
      await updateEvent(eventId, { participantIds: updatedParticipantIds });
    }
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Obtener participantes de un evento
 */
export const getEventParticipants = async (eventId: string): Promise<Participant[]> => {
  try {
    const q = query(
      collection(db, 'participants'),
      where('eventId', '==', eventId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Participant));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Actualizar balance de participante
 */
export const updateParticipantBalance = async (
  participantId: string,
  newBalance: number
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'participants', participantId), {
      currentBalance: newBalance
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ==================== GASTOS ====================

/**
 * Crear nuevo gasto
 */
export const createExpense = async (
  eventId: string,
  paidBy: string,
  amount: number,
  description: string,
  category: string,
  beneficiaries: string[],
  splitType: 'equal' | 'custom' = 'equal',
  customSplits?: { [participantId: string]: number }
): Promise<string> => {
  try {
    const expenseData: Omit<Expense, 'id'> = {
      eventId,
      paidBy,
      amount,
      description,
      category: category as any,
      date: new Date(),
      beneficiaries,
      splitType,
      customSplits,
      createdAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, 'expenses'), expenseData);
    
    // Actualizar balances de participantes
    await updateBalancesAfterExpense(paidBy, amount, beneficiaries, splitType, customSplits);
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Actualizar balances después de crear gasto
 */
const updateBalancesAfterExpense = async (
  paidBy: string,
  amount: number,
  beneficiaries: string[],
  splitType: 'equal' | 'custom',
  customSplits?: { [participantId: string]: number }
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    if (splitType === 'equal') {
      const splitAmount = amount / beneficiaries.length;
      
      for (const beneficiaryId of beneficiaries) {
        const participantDoc = await getDoc(doc(db, 'participants', beneficiaryId));
        
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance - splitAmount;
          batch.update(doc(db, 'participants', beneficiaryId), {
            currentBalance: newBalance
          });
        }
      }
    } else if (splitType === 'custom' && customSplits) {
      for (const [beneficiaryId, splitAmount] of Object.entries(customSplits)) {
        const participantDoc = await getDoc(doc(db, 'participants', beneficiaryId));
        
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance - splitAmount;
          batch.update(doc(db, 'participants', beneficiaryId), {
            currentBalance: newBalance
          });
        }
      }
    }
    
    await batch.commit();
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Obtener gastos de un evento
 */
export const getEventExpenses = async (eventId: string): Promise<Expense[]> => {
  try {
    const q = query(
      collection(db, 'expenses'),
      where('eventId', '==', eventId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Expense));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Actualizar gasto
 */
export const updateExpense = async (expenseId: string, updates: Partial<Expense>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'expenses', expenseId), {
      ...updates,
      updatedAt: new Date()
    } as any);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Eliminar gasto
 */
export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    // TODO: Revertir los cambios en los balances de participantes
    await deleteDoc(doc(db, 'expenses', expenseId));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export default {
  auth,
  db,
  registerWithEmail,
  signInWithEmail,
  signOut,
  onAuthChange,
  createEvent,
  getEvent,
  getUserEvents,
  updateEvent,
  deleteEvent,
  addParticipant,
  getEventParticipants,
  updateParticipantBalance,
  createExpense,
  getEventExpenses,
  updateExpense,
  deleteExpense,
};
