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
      where('createdBy', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Event));
    
    // Ordenar en memoria en lugar de en Firestore (evita necesitar índice)
    return events.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error: any) {
    console.error('Error loading events:', error);
    throw new Error(error.message || 'No se pudieron cargar los eventos');
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
    console.log('📝 addParticipant called:', { eventId, name, individualBudget, email, userId });
    
    const participantData: any = {
      eventId,
      name,
      individualBudget,
      currentBalance: individualBudget,
      joinedAt: new Date(),
    };
    
    // Solo agregar userId y email si están definidos
    if (userId) {
      participantData.userId = userId;
    }
    if (email) {
      participantData.email = email;
    }
    
    console.log('📤 Guardando participante en Firestore:', participantData);
    const docRef = await addDoc(collection(db, 'participants'), participantData);
    console.log('✅ Participante guardado con ID:', docRef.id);
    
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
    console.log('🔍 getEventParticipants - Buscando participantes para evento:', eventId);
    const q = query(
      collection(db, 'participants'),
      where('eventId', '==', eventId)
    );
    
    const querySnapshot = await getDocs(q);
    const participants = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Participant));
    
    console.log('📊 Participantes encontrados:', participants.length, participants);
    return participants;
  } catch (error: any) {
    console.error('❌ Error al obtener participantes:', error);
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
    console.log('💾 createExpense - Iniciando creación de gasto:', {
      eventId,
      paidBy,
      amount,
      description,
      category,
      beneficiaries,
      splitType
    });

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
    
    // Filtrar campos undefined antes de guardar
    const cleanExpenseData: any = {
      eventId: expenseData.eventId,
      paidBy: expenseData.paidBy,
      amount: expenseData.amount,
      description: expenseData.description,
      category: expenseData.category,
      date: expenseData.date,
      beneficiaries: expenseData.beneficiaries,
      splitType: expenseData.splitType,
      createdAt: expenseData.createdAt,
    };
    
    // Solo agregar customSplits si existe
    if (customSplits && splitType === 'custom') {
      cleanExpenseData.customSplits = customSplits;
    }
    
    console.log('📝 createExpense - Guardando en Firestore (limpio):', cleanExpenseData);
    const docRef = await addDoc(collection(db, 'expenses'), cleanExpenseData);
    console.log('✅ createExpense - Gasto guardado con ID:', docRef.id);
    
    // Actualizar balances de participantes
    console.log('💰 createExpense - Actualizando balances de participantes...');
    await updateBalancesAfterExpense(paidBy, amount, beneficiaries, splitType, customSplits);
    console.log('✅ createExpense - Balances actualizados correctamente');
    
    return docRef.id;
  } catch (error: any) {
    console.error('❌ createExpense - Error:', error);
    console.error('❌ createExpense - Error message:', error.message);
    console.error('❌ createExpense - Error stack:', error.stack);
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
    console.log('🔄 updateBalancesAfterExpense - Iniciando:', {
      paidBy,
      amount,
      beneficiaries,
      splitType
    });

    const batch = writeBatch(db);
    
    // PASO 1: Quien pagó SUMA el monto total (adelantó el dinero)
    console.log('💳 Actualizando balance de quien pagó:', paidBy);
    const payerDoc = await getDoc(doc(db, 'participants', paidBy));
    if (payerDoc.exists()) {
      const payer = payerDoc.data() as Participant;
      const newPayerBalance = payer.currentBalance + amount;
      console.log(`💰 Pagador - Balance anterior: ${payer.currentBalance}, nuevo: ${newPayerBalance} (+${amount})`);
      batch.update(doc(db, 'participants', paidBy), {
        currentBalance: newPayerBalance
      });
    }
    
    // PASO 2: Cada beneficiario RESTA su parte (debe ese dinero)
    if (splitType === 'equal') {
      const splitAmount = amount / beneficiaries.length;
      console.log('⚖️ División equitativa - Monto por persona:', splitAmount);
      
      for (const beneficiaryId of beneficiaries) {
        console.log('📊 Actualizando balance de beneficiario:', beneficiaryId);
        const participantDoc = await getDoc(doc(db, 'participants', beneficiaryId));
        
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance - splitAmount;
          console.log(`💰 Beneficiario - Balance anterior: ${participant.currentBalance}, nuevo: ${newBalance} (-${splitAmount})`);
          batch.update(doc(db, 'participants', beneficiaryId), {
            currentBalance: newBalance
          });
        } else {
          console.warn('⚠️ Participante no encontrado:', beneficiaryId);
        }
      }
    } else if (splitType === 'custom' && customSplits) {
      console.log('🎯 División personalizada:', customSplits);
      for (const [beneficiaryId, splitAmount] of Object.entries(customSplits)) {
        console.log('📊 Actualizando balance de beneficiario:', beneficiaryId, 'monto:', splitAmount);
        const participantDoc = await getDoc(doc(db, 'participants', beneficiaryId));
        
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance - splitAmount;
          console.log(`💰 Beneficiario - Balance anterior: ${participant.currentBalance}, nuevo: ${newBalance} (-${splitAmount})`);
          batch.update(doc(db, 'participants', beneficiaryId), {
            currentBalance: newBalance
          });
        } else {
          console.warn('⚠️ Participante no encontrado:', beneficiaryId);
        }
      }
    }
    
    console.log('📦 Ejecutando batch commit...');
    await batch.commit();
    console.log('✅ updateBalancesAfterExpense - Completado');
  } catch (error: any) {
    console.error('❌ updateBalancesAfterExpense - Error:', error);
    console.error('❌ updateBalancesAfterExpense - Stack:', error.stack);
    throw new Error(error.message);
  }
};

/**
 * Obtener gastos de un evento
 */
export const getEventExpenses = async (eventId: string): Promise<Expense[]> => {
  try {
    console.log('🔍 getEventExpenses - Buscando gastos para evento:', eventId);
    const q = query(
      collection(db, 'expenses'),
      where('eventId', '==', eventId)
    );
    
    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Expense));
    
    // Ordenar en memoria para evitar índice compuesto
    expenses.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log('📊 Gastos encontrados:', expenses.length);
    return expenses;
  } catch (error: any) {
    console.error('❌ Error al obtener gastos:', error);
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
