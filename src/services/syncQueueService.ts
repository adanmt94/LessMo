/**
 * Servicio de Cola de Sincronización para Modo Offline
 * Maneja operaciones CRUD cuando no hay conexión y sincroniza cuando se recupera
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { logger, LogCategory } from '../utils/logger';

const STORAGE_KEY_SYNC_QUEUE = '@sync_queue';
const STORAGE_KEY_LAST_SYNC = '@last_sync_time';

export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum EntityType {
  EXPENSE = 'EXPENSE',
  EVENT = 'EVENT',
  PARTICIPANT = 'PARTICIPANT',
  COMMENT = 'COMMENT',
  PAYMENT = 'PAYMENT',
  TEMPLATE = 'TEMPLATE',
  REMINDER = 'REMINDER',
}

export interface SyncOperation {
  id: string;
  type: OperationType;
  entity: EntityType;
  entityId: string;
  data: any;
  timestamp: number;
  retries: number;
  error?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: Date | null;
  hasErrors: boolean;
}

let syncStatus: SyncStatus = {
  isOnline: true,
  isSyncing: false,
  pendingOperations: 0,
  lastSyncTime: null,
  hasErrors: false,
};

let statusListeners: Array<(status: SyncStatus) => void> = [];
let networkListenerUnsubscribe: (() => void) | null = null;
let isProcessingSyncQueue: boolean = false; // Prevenir procesamiento concurrente

/**
 * Inicializar el servicio de sincronización
 */
export async function initializeSyncService(): Promise<void> {
  try {
    // Cargar estado desde storage
    const queue = await getQueueFromStorage();
    const lastSync = await getLastSyncTime();
    
    syncStatus.pendingOperations = queue.length;
    syncStatus.lastSyncTime = lastSync;
    syncStatus.hasErrors = queue.some(op => op.error);
    
    // Escuchar cambios de conectividad
    networkListenerUnsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !syncStatus.isOnline;
      syncStatus.isOnline = state.isConnected || false;
      notifyStatusChange();
      
      // Si recuperamos conexión, intentar sincronizar
      if (wasOffline && syncStatus.isOnline) {
        logger.info(LogCategory.SYNC, 'Connection restored, starting sync');
        syncQueue();
      }
    });
    
    // Obtener estado inicial
    const netInfo = await NetInfo.fetch();
    syncStatus.isOnline = netInfo.isConnected || false;
    
    logger.info(LogCategory.SYNC, 'Sync service initialized', {
      isOnline: syncStatus.isOnline,
      pendingOperations: syncStatus.pendingOperations,
    });
  } catch (error) {
    logger.error(LogCategory.SYNC, 'Error initializing sync service', error);
  }
}

/**
 * Detener el servicio de sincronización
 */
export function stopSyncService(): void {
  if (networkListenerUnsubscribe) {
    networkListenerUnsubscribe();
    networkListenerUnsubscribe = null;
  }
  statusListeners = [];
}

/**
 * Agregar operación a la cola
 */
export async function addToQueue(
  type: OperationType,
  entity: EntityType,
  entityId: string,
  data: any
): Promise<void> {
  try {
    const operation: SyncOperation = {
      id: `${entity}_${type}_${entityId}_${Date.now()}`,
      type,
      entity,
      entityId,
      data,
      timestamp: Date.now(),
      retries: 0,
    };
    
    const queue = await getQueueFromStorage();
    queue.push(operation);
    await saveQueueToStorage(queue);
    
    syncStatus.pendingOperations = queue.length;
    notifyStatusChange();
    
    logger.info(LogCategory.SYNC, 'Operation added to queue', {
      type,
      entity,
      entityId,
    });
    
    // Si hay conexión, intentar sincronizar
    if (syncStatus.isOnline && !syncStatus.isSyncing) {
      syncQueue();
    }
  } catch (error) {
    logger.error(LogCategory.SYNC, 'Error adding to queue', error);
    throw error;
  }
}

/**
 * Sincronizar la cola de operaciones
 */
export async function syncQueue(): Promise<void> {
  if (syncStatus.isSyncing || !syncStatus.isOnline || isProcessingSyncQueue) {
    if (isProcessingSyncQueue) {
      logger.info(LogCategory.SYNC, 'Queue already processing, skipping');
    }
    return;
  }
  
  try {
    isProcessingSyncQueue = true;
    syncStatus.isSyncing = true;
    notifyStatusChange();
    
    const queue = await getQueueFromStorage();
    if (queue.length === 0) {
      syncStatus.isSyncing = false;
      notifyStatusChange();
      return;
    }
    
    logger.info(LogCategory.SYNC, 'Starting sync', { operations: queue.length });
    
    const results = await Promise.allSettled(
      queue.map(operation => processOperation(operation))
    );
    
    // Filtrar operaciones que fallaron
    const remainingQueue: SyncOperation[] = [];
    let hasErrors = false;
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const operation = queue[index];
        operation.retries += 1;
        operation.error = result.reason?.message || 'Unknown error';
        
        // Si no supera el máximo de reintentos, mantener en cola
        if (operation.retries < 3) {
          remainingQueue.push(operation);
        } else {
          logger.error(LogCategory.SYNC, 'Operation exceeded max retries', {
            operation: operation.id,
            error: operation.error,
          });
          hasErrors = true;
        }
      }
    });
    
    // Actualizar cola
    await saveQueueToStorage(remainingQueue);
    await updateLastSyncTime();
    
    syncStatus.pendingOperations = remainingQueue.length;
    syncStatus.hasErrors = hasErrors;
    syncStatus.lastSyncTime = new Date();
    
    logger.info(LogCategory.SYNC, 'Sync completed', {
      processed: queue.length - remainingQueue.length,
      remaining: remainingQueue.length,
      hasErrors,
    });
  } catch (error) {
    logger.error(LogCategory.SYNC, 'Error syncing queue', error);
  } finally {
    isProcessingSyncQueue = false;
    syncStatus.isSyncing = false;
    notifyStatusChange();
  }
}

/**
 * Procesar una operación individual
 */
async function processOperation(operation: SyncOperation): Promise<void> {
  try {
    logger.info(LogCategory.SYNC, 'Processing operation', {
      id: operation.id,
      type: operation.type,
      entity: operation.entity,
    });
    
    // Aquí se ejecutaría la operación real en Firebase
    // Por ahora simulamos éxito
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // TODO: Implementar lógica específica por tipo de entidad
    // switch (operation.entity) {
    //   case EntityType.EXPENSE:
    //     await syncExpense(operation);
    //     break;
    //   case EntityType.COMMENT:
    //     await syncComment(operation);
    //     break;
    //   // ... otros casos
    // }
    
    logger.info(LogCategory.SYNC, 'Operation processed successfully', {
      id: operation.id,
    });
  } catch (error) {
    logger.error(LogCategory.SYNC, 'Error processing operation', {
      id: operation.id,
      error,
    });
    throw error;
  }
}

/**
 * Obtener estado de sincronización
 */
export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

/**
 * Suscribirse a cambios de estado
 */
export function subscribeToStatus(listener: (status: SyncStatus) => void): () => void {
  statusListeners.push(listener);
  
  // Enviar estado inicial
  listener(getSyncStatus());
  
  // Retornar función para cancelar suscripción
  return () => {
    statusListeners = statusListeners.filter(l => l !== listener);
  };
}

/**
 * Limpiar cola (útil para debugging)
 */
export async function clearQueue(): Promise<void> {
  try {
    await saveQueueToStorage([]);
    syncStatus.pendingOperations = 0;
    syncStatus.hasErrors = false;
    notifyStatusChange();
    logger.info(LogCategory.SYNC, 'Queue cleared');
  } catch (error) {
    logger.error(LogCategory.SYNC, 'Error clearing queue', error);
    throw error;
  }
}

/**
 * Obtener operaciones pendientes
 */
export async function getPendingOperations(): Promise<SyncOperation[]> {
  return await getQueueFromStorage();
}

/**
 * Forzar sincronización manual
 */
export async function forceSync(): Promise<void> {
  if (!syncStatus.isOnline) {
    throw new Error('No network connection');
  }
  await syncQueue();
}

// === Funciones de Storage ===

async function getQueueFromStorage(): Promise<SyncOperation[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_SYNC_QUEUE);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error getting queue from storage', error);
    return [];
  }
}

async function saveQueueToStorage(queue: SyncOperation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SYNC_QUEUE, JSON.stringify(queue));
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error saving queue to storage', error);
    throw error;
  }
}

async function getLastSyncTime(): Promise<Date | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_LAST_SYNC);
    return stored ? new Date(parseInt(stored)) : null;
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error getting last sync time', error);
    return null;
  }
}

async function updateLastSyncTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error updating last sync time', error);
  }
}

function notifyStatusChange(): void {
  const currentStatus = getSyncStatus();
  statusListeners.forEach(listener => {
    try {
      listener(currentStatus);
    } catch (error) {
      logger.error(LogCategory.SYNC, 'Error notifying status listener', error);
    }
  });
}
