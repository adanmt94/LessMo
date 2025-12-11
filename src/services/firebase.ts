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
  signInWithCredential,
  signInAnonymously as firebaseSignInAnonymously,
  sendPasswordResetEmail
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
  limit,
  Timestamp,
  addDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  arrayUnion
} from 'firebase/firestore';
import { 
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL 
} from 'firebase/storage';

// ====================================================================
// CONFIGURACIÓN DE FIREBASE
// ====================================================================
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'lessmo-9023f.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'lessmo-9023f',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'lessmo-9023f.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '364537925711',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:364537925711:web:145b2f74d691c58b905a3a'
};

// ====================================================================
// INICIALIZACIÓN SIMPLE Y SEGURA
// ====================================================================
console.log('🔥 [FIREBASE-INIT] Starting...');

let app: any;
let authInstance: any;
let dbInstance: any;
let storageInstance: any;
let googleProviderInstance: any;
let appleProviderInstance: any;

try {
  // Step 1: App
  app = initializeApp(firebaseConfig);
  console.log('✅ [FIREBASE-INIT] App OK');
  
  // Step 2: Auth
  authInstance = getAuth(app);
  console.log('✅ [FIREBASE-INIT] Auth OK');
  
  // Step 3: DB
  dbInstance = getFirestore(app);
  console.log('✅ [FIREBASE-INIT] DB OK');
  
  // Step 4: Storage
  storageInstance = getStorage(app);
  console.log('✅ [FIREBASE-INIT] Storage OK');
  
  // Step 5: Providers
  googleProviderInstance = new GoogleAuthProvider();
  appleProviderInstance = new OAuthProvider('apple.com');
  console.log('✅ [FIREBASE-INIT] All OK!');
} catch (e: any) {
  console.error('❌ [FIREBASE-INIT] FAILED:', e?.message);
  // Mock objects to prevent crashes
  authInstance = authInstance || { currentUser: null };
  dbInstance = dbInstance || {};
  storageInstance = storageInstance || {};
  googleProviderInstance = googleProviderInstance || {};
  appleProviderInstance = appleProviderInstance || {};
}

// Exports
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export const googleProvider = googleProviderInstance;
export const appleProvider = appleProviderInstance;

// Import types AFTER exports to avoid circular dependency
import { 
  User, 
  Event, 
  Participant, 
  Expense, 
  Currency,
  SplitType
} from '../types';

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
 * Enviar email de recuperación de contraseña
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: 'https://lessmo-9023f.firebaseapp.com',
      handleCodeInApp: false,
    });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('No existe una cuenta con este email');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Email inválido');
    } else {
      throw new Error('Error al enviar email de recuperación: ' + error.message);
    }
  }
};

/**
 * Observar cambios en el estado de autenticación
 */
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  if (!auth) {
    console.error('❌ Auth no está inicializado');
    // Retornar función vacía para evitar crash
    return () => {};
  }
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
      // Actualizar photoURL si ha cambiado
      const existingUser = userDoc.data() as User;
      if (userCredential.user.photoURL && existingUser.photoURL !== userCredential.user.photoURL) {
        await updateDoc(doc(db, 'users', userCredential.user.uid), {
          photoURL: userCredential.user.photoURL
        });
        return { ...existingUser, photoURL: userCredential.user.photoURL };
      }
      return existingUser;
    } else {
      // Crear nuevo usuario en Firestore
      const newUser: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName || userCredential.user.email!.split('@')[0],
        photoURL: userCredential.user.photoURL || undefined,
        createdAt: new Date(),
      };
      await setDoc(doc(db, 'users', newUser.uid), newUser);
      return newUser;
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ==================== EVENTOS (CONTENEDORES CON PRESUPUESTO) ====================
// NOTA: En Firestore se llaman "events" pero son EVENTOS/CONTENEDORES
// TODO: Migrar colección de "events" a "groups" en Firestore

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
 * Crear nuevo evento (contenedor con presupuesto)
 * NOTA: La función se llama createEvent pero crea un EVENTO
 * Un evento contiene múltiples eventos/gastos individuales
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
    }
    
    const docRef = await addDoc(collection(db, 'events'), eventData);
    
    // Si el evento pertenece a un evento, actualizar el array eventIds del evento
    if (groupId) {
      try {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          eventIds: arrayUnion(docRef.id)
        });
      } catch (error) {
        // No lanzar error aquí para no bloquear la creación del evento
      }
    }
    
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
  } catch (error: any) {
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
      
      // Intentar obtener la foto del usuario
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.photoURL) {
            participantData.photoURL = userData.photoURL;
          }
        }
      } catch (error) {
        // Photo fetch failed - not critical
      }
    }
    if (email) {
      participantData.email = email;
    }
    
    const docRef = await addDoc(collection(db, 'participants'), participantData);
    
    // Actualizar el evento con el nuevo participante
    const event = await getEvent(eventId);
    if (event) {
      const updatedParticipantIds = [...event.participantIds, docRef.id];
      await updateEvent(eventId, { participantIds: updatedParticipantIds });
      
      // Nota: En el nuevo modelo, Event ya no tiene groupId
      // Los eventos son los contenedores principales
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
    // Buscar participantes
    const q = query(
      collection(db, 'participants'),
      where('eventId', '==', eventId)
    );
    
    const querySnapshot = await getDocs(q);
    const participantsData = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Participant));
    
    // Fetch user photos for participants with userId - SIEMPRE verificar por actualizaciones
    const participants = await Promise.all(participantsData.map(async (participant) => {
      // Si tiene userId, intentar cargar la foto más reciente de users
      if (participant.userId) {
        try {
          const userRef = doc(db, 'users', participant.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.photoURL) {
              // Si la foto es diferente o no existe, actualizarla
              if (userData.photoURL !== participant.photoURL) {
                try {
                  await updateDoc(doc(db, 'participants', participant.id), {
                    photoURL: userData.photoURL
                  });
                } catch (updateError) {
                  // Update failed - not critical
                }
              }
              return {
                ...participant,
                photoURL: userData.photoURL
              };
            }
          }
        } catch (error) {
          // Photo fetch failed - not critical
        }
      }
      return participant;
    }));
    return participants;
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

/**
 * Eliminar participante
 */
export const deleteParticipant = async (participantId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'participants', participantId));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ==================== EVENTOS/GASTOS INDIVIDUALES ====================
// NOTA: En Firestore se llaman "expenses" y son correctos
// Son gastos individuales donde alguien paga y otros deben

/**
 * Crear nuevo evento/gasto individual
 * Un evento tiene:
 *   - paidBy: quien pagó
 *   - participantIds: quienes deben (beneficiaries)
 *   - splitType: cómo se divide
 */
export const createExpense = async (
  eventId: string,
  paidBy: string,
  amount: number,
  description: string,
  category: string,
  participantIds: string[],
  splitType: SplitType = 'equal',
  customSplits?: { [participantId: string]: number },
  percentageSplits?: { [participantId: string]: number },
  receiptPhoto?: string,
  name?: string,
  currency?: Currency,
  createdBy?: string
): Promise<string> => {
  try {
    const expenseData: Omit<Expense, 'id'> = {
      eventId,
      name: name || description,
      paidBy,
      amount,
      description,
      category: category as any,
      date: new Date(),
      participantIds,
      splitType,
      customSplits,
      percentageSplits,
      createdAt: new Date(),
      receiptPhoto,
      currency: currency || 'EUR',
      createdBy: createdBy || paidBy,
    };
    
    // Filtrar campos undefined antes de guardar
    const cleanExpenseData: any = {
      eventId: expenseData.eventId,
      name: expenseData.name,
      paidBy: expenseData.paidBy,
      amount: expenseData.amount,
      description: expenseData.description,
      category: expenseData.category,
      date: expenseData.date,
      participantIds: expenseData.participantIds,
      splitType: expenseData.splitType,
      currency: expenseData.currency,
      createdBy: expenseData.createdBy,
      createdAt: expenseData.createdAt,
    };
    
    // Solo agregar customSplits si existe
    if (customSplits && (splitType === 'custom' || splitType === 'amount')) {
      cleanExpenseData.customSplits = customSplits;
    }
    
    // Solo agregar percentageSplits si existe
    if (percentageSplits && splitType === 'percentage') {
      cleanExpenseData.percentageSplits = percentageSplits;
    }
    
    // Solo agregar receiptPhoto si existe
    if (receiptPhoto) {
      cleanExpenseData.receiptPhoto = receiptPhoto;
    }
    
    const docRef = await addDoc(collection(db, 'expenses'), cleanExpenseData);
    
    // Actualizar balances de participantes
    await updateBalancesAfterExpense(paidBy, amount, participantIds, splitType, customSplits, percentageSplits);
    
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
  participantIds: string[],
  splitType: SplitType,
  customSplits?: { [participantId: string]: number },
  percentageSplits?: { [participantId: string]: number }
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Lógica: Solo RESTAR de cada participante su parte del gasto
    // El balance representa el saldo disponible de su presupuesto individual
    
    if (splitType === 'equal') {
      if (!participantIds || participantIds.length === 0) {
        console.error('[FIREBASE] No hay participantes para dividir el gasto');
        return;
      }
      const splitAmount = amount / participantIds.length;
      
      for (const participantId of participantIds) {
        const participantDoc = await getDoc(doc(db, 'participants', participantId));
        
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance - splitAmount;
          batch.update(doc(db, 'participants', participantId), {
            currentBalance: newBalance
          });
        }
      }
    } else if (splitType === 'percentage' && percentageSplits) {
      for (const [participantId, percentage] of Object.entries(percentageSplits)) {
        const splitAmount = (amount * percentage) / 100;
        const participantDoc = await getDoc(doc(db, 'participants', participantId));
        
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance - splitAmount;
          batch.update(doc(db, 'participants', participantId), {
            currentBalance: newBalance
          });
        }
      }
    } else if ((splitType === 'custom' || splitType === 'amount') && customSplits) {
      for (const [participantId, splitAmount] of Object.entries(customSplits)) {
        const participantDoc = await getDoc(doc(db, 'participants', participantId));
        
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance - splitAmount;
          batch.update(doc(db, 'participants', participantId), {
            currentBalance: newBalance
          });
        }
      }
    } else if (splitType === 'items' && customSplits) {
      // Para 'items', usar el mismo comportamiento que 'custom' 
      // ya que customSplits contendrá el desglose calculado por participante
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
 * Actualizar gasto existente con recálculo de balances
 */
export const updateExpense = async (
  expenseId: string,
  eventId: string,
  paidBy: string,
  amount: number,
  description: string,
  category: string,
  participantIds: string[],
  splitType: SplitType = 'equal',
  customSplits?: { [participantId: string]: number },
  percentageSplits?: { [participantId: string]: number },
  receiptPhoto?: string
): Promise<void> => {
  try {
    // 1. Obtener el gasto original
    const expenseDoc = await getDoc(doc(db, 'expenses', expenseId));
    if (!expenseDoc.exists()) {
      throw new Error('Gasto no encontrado');
    }
    const originalExpense = expenseDoc.data() as Expense;

    // 2. Revertir los cambios de balance del gasto original
    await revertBalanceChanges(
      originalExpense.paidBy,
      originalExpense.amount,
      originalExpense.participantIds || [],
      originalExpense.splitType,
      originalExpense.customSplits,
      originalExpense.percentageSplits
    );

    // 3. Actualizar el gasto en Firestore
    const cleanExpenseData: any = {
      eventId,
      paidBy,
      amount,
      description,
      category,
      participantIds,
      splitType,
    };
    
    if (customSplits && (splitType === 'custom' || splitType === 'amount')) {
      cleanExpenseData.customSplits = customSplits;
    }
    
    if (percentageSplits && splitType === 'percentage') {
      cleanExpenseData.percentageSplits = percentageSplits;
    }
    
    if (receiptPhoto) {
      cleanExpenseData.receiptPhoto = receiptPhoto;
    }
    
    await updateDoc(doc(db, 'expenses', expenseId), cleanExpenseData);

    // 4. Aplicar los nuevos cambios de balance
    await updateBalancesAfterExpense(paidBy, amount, participantIds, splitType, customSplits, percentageSplits);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Revertir cambios de balance (para edición/eliminación de gastos)
 */
const revertBalanceChanges = async (
  paidBy: string,
  amount: number,
  participantIds: string[],
  splitType: SplitType,
  customSplits?: { [participantId: string]: number },
  percentageSplits?: { [participantId: string]: number }
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    if (splitType === 'equal') {
      if (!participantIds || participantIds.length === 0) {
        console.error('[FIREBASE] No hay participantes para revertir el gasto');
        return;
      }
      const splitAmount = amount / participantIds.length;
      
      for (const participantId of participantIds) {
        const participantDoc = await getDoc(doc(db, 'participants', participantId));
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance + splitAmount; // SUMAR para revertir
          batch.update(doc(db, 'participants', participantId), {
            currentBalance: newBalance
          });
        }
      }
    } else if (splitType === 'percentage' && percentageSplits) {
      for (const [participantId, percentage] of Object.entries(percentageSplits)) {
        const splitAmount = (amount * percentage) / 100;
        const participantDoc = await getDoc(doc(db, 'participants', participantId));
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance + splitAmount; // SUMAR para revertir
          batch.update(doc(db, 'participants', participantId), {
            currentBalance: newBalance
          });
        }
      }
    } else if ((splitType === 'custom' || splitType === 'amount') && customSplits) {
      for (const [participantId, splitAmount] of Object.entries(customSplits)) {
        const participantDoc = await getDoc(doc(db, 'participants', participantId));
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance + splitAmount; // SUMAR para revertir
          batch.update(doc(db, 'participants', participantId), {
            currentBalance: newBalance
          });
        }
      }
    } else if (splitType === 'items' && customSplits) {
      // Para 'items', usar el mismo comportamiento que 'custom' 
      // ya que customSplits contendrá el desglose calculado por participante
      for (const [participantId, splitAmount] of Object.entries(customSplits)) {
        const participantDoc = await getDoc(doc(db, 'participants', participantId));
        if (participantDoc.exists()) {
          const participant = participantDoc.data() as Participant;
          const newBalance = participant.currentBalance + splitAmount; // SUMAR para revertir
          batch.update(doc(db, 'participants', participantId), {
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
      where('eventId', '==', eventId)
    );
    
    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        // Normalizar participantIds para evitar errores
        participantIds: data.participantIds || data.beneficiaries || [],
      } as Expense;
    });
    
    // Ordenar en memoria para evitar índice compuesto
    expenses.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    return expenses;
  } catch (error: any) {
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
 * Eliminar gasto con reversión completa de balances
 */
export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    // 1. Obtener el gasto antes de eliminarlo
    const expenseDoc = await getDoc(doc(db, 'expenses', expenseId));
    
    if (!expenseDoc.exists()) {
      throw new Error('Gasto no encontrado');
    }

    const expense = expenseDoc.data() as Expense;

    // 2. Revertir los cambios de balance que causó este gasto
    // La función revertBalanceChanges SUMA los montos que se habían RESTADO
    await revertBalanceChanges(
      expense.paidBy,
      expense.amount,
      expense.participantIds || [],
      expense.splitType,
      expense.customSplits,
      expense.percentageSplits
    );

    // 3. Eliminar el gasto de Firestore
    await deleteDoc(doc(db, 'expenses', expenseId));
    
    console.log('✅ Gasto eliminado y balances revertidos correctamente');
  } catch (error: any) {
    console.error('❌ Error eliminando gasto:', error);
    throw new Error(error.message);
  }
};

// ==================== EVENTOS ====================

/**
 * Crear nuevo evento
 */
export const createGroup = async (
  name: string,
  createdBy: string,
  description?: string,
  color?: string,
  icon?: string,
  type?: 'project' | 'recurring',
  budget?: number,
  currency?: 'EUR' | 'USD' | 'GBP'
): Promise<string> => {
  try {
    const inviteCode = generateInviteCode();
    
    const groupData: any = {
      name,
      createdBy,
      inviteCode,
      createdAt: new Date(),
      memberIds: [createdBy],
      eventIds: [],
      type: type || 'project', // Por defecto 'project' (compatible con eventos antiguos)
      currency: currency || 'EUR', // Moneda por defecto
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
    if (budget !== undefined && budget > 0) {
      groupData.budget = budget;
      groupData.initialBudget = budget;
    }
    
    const docRef = await addDoc(collection(db, 'groups'), groupData);
    console.log('✅ Evento creado:', docRef.id, 'tipo:', type || 'project', 'código:', inviteCode);
    
    // Si es tipo 'recurring', crear evento "General" automáticamente
    if (type === 'recurring') {
      try {
        const defaultEventId = await createEvent(
          'General', // Nombre fijo
          0, // Sin presupuesto inicial
          'EUR', // Currency
          createdBy, // userId
          'Gastos generales del evento', // Descripción
          docRef.id // groupId
        );
        
        // Actualizar evento con defaultEventId
        await updateDoc(doc(db, 'groups', docRef.id), {
          defaultEventId,
          eventIds: [defaultEventId]
        });
      } catch (error) {
        console.error('⚠️ Error creando evento General:', error);
        // No fallar la creación del evento por esto
      }
    }
    
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error creating group:', error);
    throw new Error(error.message);
  }
};

/**
 * Obtener eventos del usuario
 */
export const getUserGroups = async (userId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const groups = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
      const groupData = docSnap.data();
      const groupId = docSnap.id;
      
      // Calcular estadísticas en tiempo real
      let eventIds = groupData.eventIds || [];
      let memberIds = groupData.memberIds || [];
      
      // Si no hay eventIds guardados, buscar eventos que pertenezcan a este evento
      if (eventIds.length === 0) {
        try {
          const eventsQuery = query(
            collection(db, 'events'),
            where('groupId', '==', groupId)
          );
          const eventsSnapshot = await getDocs(eventsQuery);
          eventIds = eventsSnapshot.docs.map(doc => doc.id);
          
          // Actualizar el evento con los eventIds encontrados (migración automática)
          if (eventIds.length > 0) {
            await updateDoc(doc(db, 'groups', groupId), {
              eventIds: eventIds
            }).catch(err => console.error('⚠️ No se pudo actualizar eventIds:', err));
          }
        } catch (error) {
          console.error('⚠️ Error buscando eventos del evento:', error);
        }
      }
      
      return { 
        id: groupId, 
        ...groupData,
        eventIds,
        memberIds
      };
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
      console.log('⚠️ Sin permisos para leer eventos, retornando lista vacía');
      return [];
    }
    throw new Error(error.message || 'No se pudieron cargar los eventos');
  }
};

/**
 * Obtener un evento por ID
 */
export const getGroup = async (groupId: string): Promise<any> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      throw new Error('Evento no encontrado');
    }
    return {
      id: groupDoc.id,
      ...groupDoc.data()
    };
  } catch (error: any) {
    console.error('❌ Error loading group:', error);
    throw new Error(error.message || 'No se pudo cargar el evento');
  }
};

/**
 * Actualizar un evento
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
    console.log('✅ Evento actualizado:', groupId);
  } catch (error: any) {
    console.error('❌ Error updating group:', error);
    throw new Error(error.message || 'No se pudo actualizar el evento');
  }
};

/**
 * Eliminar un evento
 */
export const deleteGroup = async (groupId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'groups', groupId));
    console.log('✅ Evento eliminado:', groupId);
  } catch (error: any) {
    console.error('❌ Error deleting group:', error);
    throw new Error(error.message || 'No se pudo eliminar el evento');
  }
};

/**
 * Buscar evento por código de invitación
 */
export const getGroupByInviteCode = async (inviteCode: string): Promise<any | null> => {
  try {
    const q = query(
      collection(db, 'groups'),
      where('inviteCode', '==', inviteCode.toUpperCase())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const groupDoc = querySnapshot.docs[0];
    return {
      id: groupDoc.id,
      ...groupDoc.data()
    };
  } catch (error: any) {
    console.error('❌ Error buscando evento por código:', error);
    throw new Error(error.message || 'No se pudo buscar el evento');
  }
};

/**
 * Agregar miembro a un evento
 */
export const addGroupMember = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('Evento no encontrado');
    }
    
    const groupData = groupDoc.data();
    const currentMembers = groupData.memberIds || [];
    
    // Verificar si ya es miembro
    if (currentMembers.includes(userId)) {
      console.log('⚠️ El usuario ya es miembro del evento');
      return;
    }
    
    // Agregar userId al array de memberIds
    await updateDoc(groupRef, {
      memberIds: [...currentMembers, userId],
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('❌ Error agregando miembro:', error);
    throw new Error(error.message || 'No se pudo agregar al evento');
  }
};

/**
 * Obtener información de un usuario
 */
export const getUserInfo = async (userId: string): Promise<{ id: string; name: string; email?: string } | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    const userData = userDoc.data();
    return {
      id: userId,
      name: userData.name || userData.displayName || userData.email?.split('@')[0] || 'Usuario',
      email: userData.email
    };
  } catch (error: any) {
    console.error('❌ Error obteniendo usuario:', error);
    return null;
  }
};

/**
 * Eliminar miembro de un evento
 */
export const removeGroupMember = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('Evento no encontrado');
    }
    
    const groupData = groupDoc.data();
    const currentMembers = groupData.memberIds || [];
    
    // Verificar si es miembro
    if (!currentMembers.includes(userId)) {
      console.log('⚠️ El usuario no es miembro del evento');
      return;
    }
    
    // No permitir eliminar al creador
    if (groupData.createdBy === userId) {
      throw new Error('No puedes eliminarte como creador del evento');
    }
    
    // Eliminar userId del array de memberIds
    await updateDoc(groupRef, {
      memberIds: currentMembers.filter((id: string) => id !== userId),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Miembro eliminado del evento:', userId);
  } catch (error: any) {
    console.error('❌ Error eliminando miembro:', error);
    throw new Error(error.message || 'No se pudo eliminar del evento');
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
    
    // 1. Obtener eventos creados por el usuario
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
    const userEvents = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Event));
    
    console.log('📝 Eventos creados por usuario:', userEvents.length);
    
    // 2. Obtener eventos donde el usuario es miembro
    const userGroups = await getUserGroups(userId);
    const groupIds = userGroups.map(g => g.id);
    console.log('👥 Eventos del usuario:', groupIds.length, groupIds);
    
    // 3. Obtener eventos de esos eventos
    let groupEvents: Event[] = [];
    if (groupIds.length > 0) {
      // Firestore tiene límite de 10 elementos en 'in', así que hacemos consultas por lotes
      const batchSize = 10;
      for (let i = 0; i < groupIds.length; i += batchSize) {
        const batch = groupIds.slice(i, i + batchSize);
        
        let groupQuery;
        if (status) {
          groupQuery = query(
            collection(db, 'events'),
            where('groupId', 'in', batch),
            where('status', '==', status)
          );
        } else {
          groupQuery = query(
            collection(db, 'events'),
            where('groupId', 'in', batch)
          );
        }
        
        const groupSnapshot = await getDocs(groupQuery);
        const batchEvents = groupSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Event));
        
        groupEvents = [...groupEvents, ...batchEvents];
      }
    }    // 4. Combinar y eliminar duplicados (por si un evento está en ambas listas)
    const allEventsMap = new Map<string, Event>();
    
    // Primero agregar eventos del usuario
    userEvents.forEach(event => {
      allEventsMap.set(event.id, event);
    });
    
    // Luego agregar eventos de eventos (no sobrescribir si ya existe)
    groupEvents.forEach(event => {
      if (!allEventsMap.has(event.id)) {
        allEventsMap.set(event.id, event);
      }
    });
    
    const allEvents = Array.from(allEventsMap.values());
    console.log('✅ Total eventos (sin duplicados):', allEvents.length);
    
    // 5. Ordenar por fecha de creación
    return allEvents.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error: any) {
    console.error('❌ Error loading events by status:', error);
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

// ==================== CHAT ====================

/**
 * Subir imagen de chat a Firebase Storage
 */
export const uploadChatImage = async (
  chatId: string,
  imageUri: string
): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const filename = `chat_${Date.now()}.jpg`;
    const storageRef = ref(storage, `chats/${chatId}/${filename}`);
    
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('✅ Imagen de chat subida:', downloadURL);
    return downloadURL;
  } catch (error: any) {
    console.error('❌ Error subiendo imagen de chat:', error);
    throw new Error('No se pudo subir la imagen');
  }
};

/**
 * Enviar mensaje en un evento
 */
export const sendEventMessage = async (
  eventId: string,
  userId: string,
  userName: string,
  message: string,
  imageUrl?: string,
  receiptData?: { amount: number; description: string; category: string }
): Promise<string> => {
  try {
    const messageData: any = {
      eventId,
      userId,
      userName,
      message: message.trim(),
      createdAt: serverTimestamp(),
      read: false,
    };
    
    if (imageUrl) {
      messageData.imageUrl = imageUrl;
    }
    
    if (receiptData) {
      messageData.receiptData = receiptData;
    }
    
    const docRef = await addDoc(collection(db, 'messages'), messageData);
    console.log('✅ Mensaje enviado:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error enviando mensaje:', error);
    throw new Error(error.message || 'No se pudo enviar el mensaje');
  }
};

/**
 * Obtener mensajes de un evento
 */
export const getEventMessages = async (eventId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    console.error('❌ Error cargando mensajes:', error);
    return [];
  }
};

/**
 * Suscribirse a mensajes de un evento en tiempo real
 */
export const subscribeToEventMessages = (
  eventId: string,
  callback: (messages: any[]) => void
) => {
  const q = query(
    collection(db, 'messages'),
    where('eventId', '==', eventId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

/**
 * Enviar mensaje en un evento
 */
export const sendGroupMessage = async (
  groupId: string,
  userId: string,
  userName: string,
  message: string,
  imageUrl?: string,
  receiptData?: { amount: number; description: string; category: string }
): Promise<string> => {
  try {
    const messageData: any = {
      userId,
      userName,
      message: message.trim(),
      createdAt: serverTimestamp(),
      read: false,
    };
    
    if (imageUrl) {
      messageData.imageUrl = imageUrl;
    }
    
    if (receiptData) {
      messageData.receiptData = receiptData;
    }
    
    // Usar subcolección groups/{groupId}/messages
    const messagesRef = collection(db, 'groups', groupId, 'messages');
    const docRef = await addDoc(messagesRef, messageData);
    console.log('✅ Mensaje de evento enviado:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error enviando mensaje de evento:', error);
    throw new Error(error.message || 'No se pudo enviar el mensaje');
  }
};

/**
 * Obtener mensajes de un evento
 */
export const getGroupMessages = async (groupId: string): Promise<any[]> => {
  try {
    // Usar subcolección groups/{groupId}/messages
    const messagesRef = collection(db, 'groups', groupId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    console.error('❌ Error cargando mensajes de evento:', error);
    return [];
  }
};

/**
 * Suscribirse a mensajes de un evento en tiempo real
 */
export const subscribeToGroupMessages = (
  groupId: string,
  callback: (messages: any[]) => void
) => {
  // Usar subcolección groups/{groupId}/messages
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

/**
 * Sincronizar estadísticas de un evento (migración/actualización manual)
 */
export const syncGroupStats = async (groupId: string): Promise<void> => {
  try {
    console.log('🔄 Sincronizando estadísticas del evento:', groupId);
    
    // Buscar todos los eventos del evento
    const eventsQuery = query(
      collection(db, 'events'),
      where('groupId', '==', groupId)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    const eventIds = eventsSnapshot.docs.map(doc => doc.id);
    
    // Buscar todos los miembros únicos del evento
    const memberIdsSet = new Set<string>();
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      if (eventData.participantIds && Array.isArray(eventData.participantIds)) {
        // Obtener userIds de los participantes
        for (const participantId of eventData.participantIds) {
          try {
            const participantDoc = await getDoc(doc(db, 'participants', participantId));
            if (participantDoc.exists()) {
              const participantData = participantDoc.data();
              if (participantData.userId) {
                memberIdsSet.add(participantData.userId);
              }
            }
          } catch (error) {
            console.error('⚠️ Error obteniendo participante:', error);
          }
        }
      }
    }
    
    const memberIds = Array.from(memberIdsSet);
    
    // Actualizar el evento con las estadísticas correctas
    await updateDoc(doc(db, 'groups', groupId), {
      eventIds: eventIds,
      memberIds: memberIds
    });
    
    console.log('✅ Estadísticas sincronizadas:', { 
      groupId, 
      eventos: eventIds.length, 
      miembros: memberIds.length 
    });
  } catch (error: any) {
    console.error('❌ Error sincronizando estadísticas del evento:', error);
    throw new Error('Error al sincronizar estadísticas del evento');
  }
};

/**
 * Refrescar fotos de participantes desde users
 * Útil cuando las fotos de perfil se actualizan
 */
export const refreshParticipantPhotos = async (eventId: string): Promise<number> => {
  try {
    console.log('🔄 Refrescando fotos de participantes para evento:', eventId);
    
    const participants = await getEventParticipants(eventId);
    let updated = 0;
    
    for (const participant of participants) {
      if (participant.userId) {
        try {
          const userRef = doc(db, 'users', participant.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.photoURL && userData.photoURL !== participant.photoURL) {
              await updateDoc(doc(db, 'participants', participant.id), {
                photoURL: userData.photoURL
              });
              updated++;
              console.log('✅ Foto actualizada para', participant.name);
            }
          }
        } catch (error) {
          console.error('❌ Error actualizando foto de', participant.name, ':', error);
        }
      }
    }
    
    console.log('✅ Fotos actualizadas:', updated, 'de', participants.length);
    return updated;
  } catch (error: any) {
    console.error('❌ Error al refrescar fotos:', error);
    throw new Error('Error al refrescar fotos de participantes');
  }
};

/**
 * Subir foto de recibo a Firebase Storage
 */
export const uploadReceiptPhoto = async (uri: string, expenseId: string): Promise<string> => {
  try {
    console.log('📸 uploadReceiptPhoto - Iniciando subida de foto');
    const storage = getStorage();
    const filename = `receipts/${expenseId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    
    // Convertir URI a Blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    console.log('☁️ Subiendo blob a Firebase Storage...');
    await uploadBytes(storageRef, blob);
    
    // Obtener URL pública
    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ Foto subida exitosamente:', downloadURL);
    
    return downloadURL;
  } catch (error: any) {
    console.error('❌ Error subiendo foto:', error);
    throw new Error('Error al subir la foto del recibo');
  }
};

// ====================================================================
// 🔄 MIGRACIÓN DEL MODELO - ALIASES Y FUNCIONES NUEVAS
// ====================================================================
//
// NOMENCLATURA CORRECTA (después de migración):
//   - Group: Contenedor con presupuesto máximo
//   - GroupEvent: Gasto único (alguien paga, otros deben)
//
// NOMENCLATURA LEGACY (temporal):
//   - Event: Alias de Group
//   - Expense: Alias de GroupEvent
//
// FIRESTORE:
//   /groups/{groupId} - Contenedores con presupuesto
//   /events/{eventId} - Gastos individuales (TODO: migrar a /groupEvents/)
//
// ====================================================================

// ==================== FUNCIONES PRINCIPALES (NOMENCLATURA CORRECTA) ====================

/**
 * Crear nuevo evento (contenedor con presupuesto)
 * @param name - Nombre del evento
 * @param budget - Presupuesto máximo del evento
 * @param currency - Moneda del evento
 * @param userId - ID del creador
 * @returns ID del evento creado
 */
export const createGroupContainer = createGroup;

/**
 * Obtener eventos del usuario (ya existe la función, no crear alias)
 */
// export const getUserGroupContainers = getUserGroups; // Comentado - función ya existe

/**
 * Obtener evento por ID
 */
export const getGroupContainer = getGroup;

/**
 * Actualizar evento
 */
export const updateGroupContainer = updateGroup;

/**
 * Eliminar evento
 */
export const deleteGroupContainer = deleteGroup;

/**
 * Obtener evento por código de invitación
 */
export const getGroupByCode = getGroupByInviteCode;

/**
 * Agregar participante a evento
 */
export const addGroupParticipant = addGroupMember;

/**
 * Eliminar participante de evento
 */
export const removeGroupParticipant = removeGroupMember;

/**
 * Crear evento/gasto individual dentro de un evento
 * Un evento tiene: quien paga (paidBy) y quienes deben (participantIds)
 * @param groupId - ID del evento contenedor
 * @param name - Nombre del evento/gasto
 * @param amount - Monto del gasto
 * @param paidBy - ID del participante que pagó
 * @param participantIds - IDs de participantes que deben
 * @returns ID del evento creado
 */
export const createGroupEvent = createExpense;

/**
 * Obtener eventos/gastos de un evento
 */
export const getGroupEvents = getEventExpenses;

/**
 * Actualizar evento/gasto
 */
export const updateGroupEvent = updateExpense;

/**
 * Eliminar evento/gasto
 */
export const deleteGroupEvent = deleteExpense;

// ==================== ALIASES DE COMPATIBILIDAD (LEGACY) ====================
// Mantener código existente funcionando durante la migración

// "Event" functions → ahora apuntan a Groups (contenedores)
export const createEventContainer = createGroup;
export const getUserEventsContainer = getUserGroups;
export const getEventContainer = getGroup;
export const updateEventContainer = updateGroup;
export const deleteEventContainer = deleteGroup;
export const getEventContainerByInviteCode = getGroupByInviteCode;
export const addEventParticipant = addGroupMember;
export const removeEventParticipant = removeGroupMember;
export const syncEventStats = syncGroupStats;
export const sendEventContainerMessage = sendGroupMessage;
export const getEventContainerMessages = getGroupMessages;
export const subscribeToEventContainerMessages = subscribeToGroupMessages;

// "Expense" functions → ahora son GroupEvents
export const getExpensesByEvent = getEventExpenses;
export const getExpensesByGroup = getEventExpenses;

export default {
  auth,
  db,
  registerWithEmail,
  signInWithEmail,
  signOut,
  resetPassword,
  onAuthChange,
  createEvent,
  getEvent,
  getUserEvents,
  getUserEventsByStatus,
  updateEvent,
  deleteEvent,
  addParticipant,
  getEventParticipants,
  deleteParticipant,
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
  getGroupByInviteCode,
  addGroupMember,
  generateInviteCode,
  getEventByInviteCode,
  sendEventMessage,
  getEventMessages,
  subscribeToEventMessages,
  sendGroupMessage,
  getGroupMessages,
  subscribeToGroupMessages,
  signInAnonymously,
  syncGroupStats,
  refreshParticipantPhotos,
  uploadReceiptPhoto,
  uploadChatImage,
  removeGroupMember,
  getUserInfo,
  // Nuevos aliases
  createEventContainer,
  getUserEventsContainer,
  getEventContainer,
  updateEventContainer,
  deleteEventContainer,
  getEventContainerByInviteCode,
  addEventParticipant,
  removeEventParticipant,
  syncEventStats,
  sendEventContainerMessage,
  getEventContainerMessages,
  subscribeToEventContainerMessages,
  getExpensesByEvent,
};
