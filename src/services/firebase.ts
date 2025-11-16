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
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getStorage 
} from 'firebase/storage';

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
export const storage = getStorage(app);

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
 * Generar código de invitación único
 */
export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Crear nuevo evento
 */
export const createEvent = async (
  name: string,
  initialBudget: number,
  currency: Currency,
  userId: string,
  description?: string,
  groupId?: string
): Promise<string> => {
  try {
    console.log('📥 firebase.createEvent - Recibido groupId:', groupId);
    
    // Generar código de invitación único
    const inviteCode = generateInviteCode();
    
    // Construir el objeto del evento sin campos undefined
    const eventData: any = {
      name,
      createdBy: userId,
      createdAt: new Date(),
      initialBudget,
      currency,
      participantIds: [],
      isActive: true,
      status: 'active',
      inviteCode,
    };
    
    // Solo agregar campos opcionales si tienen valor
    if (description) {
      eventData.description = description;
    }
    if (groupId) {
      eventData.groupId = groupId;
      console.log('✅ GroupId agregado al eventData:', groupId);
    } else {
      console.log('⚠️ No se recibió groupId');
    }
    
    console.log('💾 Guardando evento con data:', eventData);
    const docRef = await addDoc(collection(db, 'events'), eventData);
    console.log('✅ Evento guardado en Firestore con ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error creating event:', error);
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
 * Eliminar un evento
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Eliminar el evento
    batch.delete(doc(db, 'events', eventId));

    // Eliminar todos los gastos del evento
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('eventId', '==', eventId)
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    expensesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Eliminar todos los participantes del evento
    const participantsQuery = query(
      collection(db, 'participants'),
      where('eventId', '==', eventId)
    );
    const participantsSnapshot = await getDocs(participantsQuery);
    participantsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('✅ Evento eliminado:', eventId);
  } catch (error: any) {
    console.error('❌ Error deleting event:', error);
    throw new Error(error.message || 'No se pudo eliminar el evento');
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
    
    // Lógica: Solo RESTAR de cada beneficiario su parte del gasto
    // El balance representa el saldo disponible de su presupuesto individual
    
    if (splitType === 'equal') {
      const splitAmount = amount / beneficiaries.length;
      console.log('⚖️ División equitativa - Monto por persona:', splitAmount);
      
      for (const beneficiaryId of beneficiaries) {
        console.log('📊 Actualizando balance de:', beneficiaryId);
        const participantDoc = await getDoc(doc(db, 'participants', beneficiaryId));
        
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance - splitAmount;
          console.log(`💰 Balance anterior: ${participant.currentBalance}, nuevo: ${newBalance} (-${splitAmount})`);
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
        console.log('📊 Actualizando balance de:', beneficiaryId, 'monto:', splitAmount);
        const participantDoc = await getDoc(doc(db, 'participants', beneficiaryId));
        
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance - splitAmount;
          console.log(`💰 Balance anterior: ${participant.currentBalance}, nuevo: ${newBalance} (-${splitAmount})`);
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
 * Actualizar gasto existente con recálculo de balances
 */
export const updateExpense = async (
  expenseId: string,
  eventId: string,
  paidBy: string,
  amount: number,
  description: string,
  category: string,
  beneficiaries: string[],
  splitType: 'equal' | 'custom' = 'equal',
  customSplits?: { [participantId: string]: number }
): Promise<void> => {
  try {
    console.log('📝 updateExpense - Iniciando actualización de gasto:', expenseId);
    
    // 1. Obtener el gasto original
    const expenseDoc = await getDoc(doc(db, 'expenses', expenseId));
    if (!expenseDoc.exists()) {
      throw new Error('Gasto no encontrado');
    }
    const originalExpense = expenseDoc.data() as Expense;
    console.log('📋 Gasto original:', originalExpense);

    // 2. Revertir los cambios de balance del gasto original
    console.log('🔄 Revirtiendo balances del gasto original...');
    await revertBalanceChanges(
      originalExpense.paidBy,
      originalExpense.amount,
      originalExpense.beneficiaries,
      originalExpense.splitType,
      originalExpense.customSplits
    );

    // 3. Actualizar el gasto en Firestore
    const cleanExpenseData: any = {
      eventId,
      paidBy,
      amount,
      description,
      category,
      beneficiaries,
      splitType,
    };
    
    if (customSplits && splitType === 'custom') {
      cleanExpenseData.customSplits = customSplits;
    }
    
    console.log('💾 Actualizando gasto en Firestore:', cleanExpenseData);
    await updateDoc(doc(db, 'expenses', expenseId), cleanExpenseData);

    // 4. Aplicar los nuevos cambios de balance
    console.log('💰 Aplicando nuevos balances...');
    await updateBalancesAfterExpense(paidBy, amount, beneficiaries, splitType, customSplits);
    
    console.log('✅ updateExpense - Gasto actualizado exitosamente');
  } catch (error: any) {
    console.error('❌ updateExpense - Error:', error);
    throw new Error(error.message);
  }
};

/**
 * Revertir cambios de balance (para edición/eliminación de gastos)
 */
const revertBalanceChanges = async (
  paidBy: string,
  amount: number,
  beneficiaries: string[],
  splitType: 'equal' | 'custom',
  customSplits?: { [participantId: string]: number }
): Promise<void> => {
  try {
    console.log('🔙 revertBalanceChanges - Revirtiendo balances');
    const batch = writeBatch(db);
    
    if (splitType === 'equal') {
      const splitAmount = amount / beneficiaries.length;
      
      for (const beneficiaryId of beneficiaries) {
        const participantDoc = await getDoc(doc(db, 'participants', beneficiaryId));
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance + splitAmount; // SUMAR para revertir
          console.log(`💰 Revirtiendo ${beneficiaryId}: ${participant.currentBalance} + ${splitAmount} = ${newBalance}`);
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
          const newBalance = participant.currentBalance + splitAmount; // SUMAR para revertir
          console.log(`💰 Revirtiendo ${beneficiaryId}: ${participant.currentBalance} + ${splitAmount} = ${newBalance}`);
          batch.update(doc(db, 'participants', beneficiaryId), {
            currentBalance: newBalance
          });
        }
      }
    }
    
    await batch.commit();
    console.log('✅ revertBalanceChanges - Completado');
  } catch (error: any) {
    console.error('❌ revertBalanceChanges - Error:', error);
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
 * Actualizar gasto (versión simple - sin revertir balances)
 * DEPRECATED: Usar updateExpenseWithBalances para ediciones completas
 */
export const updateExpenseSimple = async (expenseId: string, updates: Partial<Expense>): Promise<void> => {
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

// ==================== GRUPOS ====================

/**
 * Crear nuevo grupo
 */
export const createGroup = async (
  name: string,
  createdBy: string,
  description?: string,
  color?: string,
  icon?: string
): Promise<string> => {
  try {
    const groupData: any = {
      name,
      createdBy,
      createdAt: new Date(),
      memberIds: [createdBy],
      eventIds: [],
    };
    
    // Solo agregar campos opcionales si tienen valor
    if (description) {
      groupData.description = description;
    }
    if (color) {
      groupData.color = color;
    }
    if (icon) {
      groupData.icon = icon;
    }
    
    const docRef = await addDoc(collection(db, 'groups'), groupData);
    console.log('✅ Grupo creado:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error creating group:', error);
    throw new Error(error.message);
  }
};

/**
 * Obtener grupos del usuario
 */
export const getUserGroups = async (userId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const groups = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    // Ordenar por fecha de creación
    return groups.sort((a: any, b: any) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error: any) {
    console.error('❌ Error loading groups:', error);
    // Si es error de permisos, retornar array vacío en lugar de lanzar error
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      console.log('⚠️ Sin permisos para leer grupos, retornando lista vacía');
      return [];
    }
    throw new Error(error.message || 'No se pudieron cargar los grupos');
  }
};

/**
 * Obtener un grupo por ID
 */
export const getGroup = async (groupId: string): Promise<any> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      throw new Error('Grupo no encontrado');
    }
    return {
      id: groupDoc.id,
      ...groupDoc.data()
    };
  } catch (error: any) {
    console.error('❌ Error loading group:', error);
    throw new Error(error.message || 'No se pudo cargar el grupo');
  }
};

/**
 * Actualizar un grupo
 */
export const updateGroup = async (
  groupId: string,
  name: string,
  description?: string,
  color?: string,
  icon?: string
): Promise<void> => {
  try {
    const groupData: any = {
      name,
      updatedAt: serverTimestamp(),
    };

    if (description) {
      groupData.description = description;
    }
    if (color) {
      groupData.color = color;
    }
    if (icon) {
      groupData.icon = icon;
    }

    await updateDoc(doc(db, 'groups', groupId), groupData);
    console.log('✅ Grupo actualizado:', groupId);
  } catch (error: any) {
    console.error('❌ Error updating group:', error);
    throw new Error(error.message || 'No se pudo actualizar el grupo');
  }
};

/**
 * Eliminar un grupo
 */
export const deleteGroup = async (groupId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'groups', groupId));
    console.log('✅ Grupo eliminado:', groupId);
  } catch (error: any) {
    console.error('❌ Error deleting group:', error);
    throw new Error(error.message || 'No se pudo eliminar el grupo');
  }
};

/**
 * Obtener eventos de un usuario con filtro de estado
 */
export const getUserEventsByStatus = async (
  userId: string,
  status?: 'active' | 'completed' | 'archived'
): Promise<Event[]> => {
  try {
    let q;
    
    if (status) {
      q = query(
        collection(db, 'events'),
        where('createdBy', '==', userId),
        where('status', '==', status)
      );
    } else {
      q = query(
        collection(db, 'events'),
        where('createdBy', '==', userId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Event));
    
    // Ordenar por fecha de creación
    return events.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error: any) {
    console.error('Error loading events by status:', error);
    throw new Error(error.message || 'No se pudieron cargar los eventos');
  }
};

/**
 * Obtener evento por código de invitación
 */
export const getEventByInviteCode = async (inviteCode: string): Promise<Event | null> => {
  try {
    const q = query(
      collection(db, 'events'),
      where('inviteCode', '==', inviteCode.toUpperCase())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const eventDoc = querySnapshot.docs[0];
    return { id: eventDoc.id, ...eventDoc.data() } as Event;
  } catch (error: any) {
    console.error('Error finding event by invite code:', error);
    throw new Error(error.message || 'No se pudo buscar el evento');
  }
};

/**
 * Autenticación anónima
 */
export const signInAnonymously = async (): Promise<User> => {
  try {
    const { signInAnonymously: firebaseSignInAnonymously } = await import('firebase/auth');
    const userCredential = await firebaseSignInAnonymously(auth);
    
    // Crear usuario anónimo en Firestore
    const anonymousUser: User = {
      uid: userCredential.user.uid,
      email: `anonymous_${userCredential.user.uid}@lessmo.app`,
      displayName: 'Usuario anónimo',
      createdAt: new Date(),
    };
    
    await setDoc(doc(db, 'users', anonymousUser.uid), anonymousUser);
    return anonymousUser;
  } catch (error: any) {
    console.error('❌ Error signing in anonymously:', error);
    if (error.code === 'auth/admin-restricted-operation') {
      throw new Error('El acceso anónimo no está habilitado en Firebase.\n\nPara habilitarlo:\n1. Ve a Firebase Console\n2. Authentication > Sign-in method\n3. Habilita "Anonymous"\n\nPor ahora, usa Google Sign-In o crea una cuenta.');
    }
    throw new Error(error.message || 'No se pudo iniciar sesión anónimamente');
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
  getUserEventsByStatus,
  updateEvent,
  deleteEvent,
  addParticipant,
  getEventParticipants,
  updateParticipantBalance,
  createExpense,
  getEventExpenses,
  updateExpense,
  deleteExpense,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  getUserGroups,
  generateInviteCode,
  getEventByInviteCode,
  signInAnonymously,
};
