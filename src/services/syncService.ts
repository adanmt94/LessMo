/**
 * Sync Service - Offline-First Mode
 * Queue operations when offline and sync when online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Event, Expense, Participant } from '../types';

const SYNC_QUEUE_KEY = '@sync_queue';
const OFFLINE_DATA_KEY = '@offline_data';
const LAST_SYNC_KEY = '@last_sync';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'event' | 'expense' | 'participant';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface OfflineData {
  events: Event[];
  expenses: Expense[];
  participants: Participant[];
  lastUpdated: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: number | null;
  failedOperations: number;
}

let syncStatus: SyncStatus = {
  isOnline: true,
  isSyncing: false,
  pendingOperations: 0,
  lastSyncTime: null,
  failedOperations: 0,
};

let statusListeners: ((status: SyncStatus) => void)[] = [];

/**
 * Initialize sync service
 */
export const initializeSyncService = async (): Promise<void> => {
  // Monitor network connectivity
  NetInfo.addEventListener(state => {
    const wasOffline = !syncStatus.isOnline;
    syncStatus.isOnline = state.isConnected ?? false;
    notifyListeners();

    // Auto-sync when coming back online
    if (wasOffline && syncStatus.isOnline) {
      syncPendingOperations();
    }
  });

  // Load initial status
  await updateSyncStatus();
};

/**
 * Subscribe to sync status changes
 */
export const subscribeSyncStatus = (listener: (status: SyncStatus) => void): (() => void) => {
  statusListeners.push(listener);
  listener(syncStatus); // Immediately call with current status

  // Return unsubscribe function
  return () => {
    statusListeners = statusListeners.filter(l => l !== listener);
  };
};

/**
 * Get current sync status
 */
export const getSyncStatus = (): SyncStatus => {
  return { ...syncStatus };
};

/**
 * Add operation to sync queue
 */
export const queueOperation = async (
  type: 'create' | 'update' | 'delete',
  entity: 'event' | 'expense' | 'participant',
  data: any
): Promise<void> => {
  const operation: SyncOperation = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    entity,
    data,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  const queue = await getSyncQueue();
  queue.push(operation);
  await saveSyncQueue(queue);
  await updateSyncStatus();

  // Try to sync immediately if online
  if (syncStatus.isOnline && !syncStatus.isSyncing) {
    syncPendingOperations();
  }
};

/**
 * Get sync queue
 */
const getSyncQueue = async (): Promise<SyncOperation[]> => {
  try {
    const json = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Error loading sync queue:', error);
    return [];
  }
};

/**
 * Save sync queue
 */
const saveSyncQueue = async (queue: SyncOperation[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving sync queue:', error);
  }
};

/**
 * Update sync status
 */
const updateSyncStatus = async (): Promise<void> => {
  const queue = await getSyncQueue();
  const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);

  syncStatus.pendingOperations = queue.filter(op => op.status === 'pending').length;
  syncStatus.failedOperations = queue.filter(op => op.status === 'failed').length;
  syncStatus.lastSyncTime = lastSyncStr ? parseInt(lastSyncStr, 10) : null;

  notifyListeners();
};

/**
 * Notify all listeners
 */
const notifyListeners = (): void => {
  for (const listener of statusListeners) {
    listener({ ...syncStatus });
  }
};

/**
 * Sync pending operations
 */
export const syncPendingOperations = async (): Promise<void> => {
  if (!syncStatus.isOnline || syncStatus.isSyncing) {
    return;
  }

  syncStatus.isSyncing = true;
  notifyListeners();

  try {
    const queue = await getSyncQueue();
    const pendingOps = queue.filter(op => op.status === 'pending' || op.status === 'failed');

    for (const operation of pendingOps) {
      try {
        operation.status = 'syncing';
        await saveSyncQueue(queue);

        // Execute the operation (call Firebase API)
        await executeOperation(operation);

        // Mark as completed
        operation.status = 'completed';
        operation.retryCount++;
      } catch (error: any) {
        console.error('Error syncing operation:', error);
        operation.status = 'failed';
        operation.error = error.message;
        operation.retryCount++;

        // Remove after 5 failed attempts
        if (operation.retryCount >= 5) {
          const index = queue.indexOf(operation);
          queue.splice(index, 1);
        }
      }

      await saveSyncQueue(queue);
    }

    // Remove completed operations
    const updatedQueue = queue.filter(op => op.status !== 'completed');
    await saveSyncQueue(updatedQueue);

    // Update last sync time
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

    await updateSyncStatus();
  } finally {
    syncStatus.isSyncing = false;
    notifyListeners();
  }
};

/**
 * Execute a sync operation
 */
const executeOperation = async (operation: SyncOperation): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In production: Call actual Firebase API
  // For now, just simulate success
  console.log('Executing operation:', operation);

  // Import Firebase services dynamically to avoid circular dependencies
  const { createEvent, updateEvent, deleteEvent } = await import('../services/firebase');

  switch (operation.entity) {
    case 'event':
      if (operation.type === 'create') {
        const { name, initialBudget, currency, createdBy, description, groupId } = operation.data;
        await createEvent(name, initialBudget, currency, createdBy, description, groupId);
      } else if (operation.type === 'update') {
        await updateEvent(operation.data.id, operation.data);
      } else if (operation.type === 'delete') {
        await deleteEvent(operation.data.id);
      }
      break;

    case 'expense':
      // Similar logic for expenses
      console.log('Expense operation:', operation.type);
      break;

    case 'participant':
      // Similar logic for participants
      console.log('Participant operation:', operation.type);
      break;
  }
};

/**
 * Cache data for offline access
 */
export const cacheOfflineData = async (data: Partial<OfflineData>): Promise<void> => {
  try {
    const existing = await getOfflineData();
    const updated: OfflineData = {
      events: data.events ?? existing.events,
      expenses: data.expenses ?? existing.expenses,
      participants: data.participants ?? existing.participants,
      lastUpdated: Date.now(),
    };

    await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error caching offline data:', error);
  }
};

/**
 * Get cached offline data
 */
export const getOfflineData = async (): Promise<OfflineData> => {
  try {
    const json = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    if (json) {
      return JSON.parse(json);
    }
  } catch (error) {
    console.error('Error loading offline data:', error);
  }

  return {
    events: [],
    expenses: [],
    participants: [],
    lastUpdated: 0,
  };
};

/**
 * Clear sync queue (for testing or reset)
 */
export const clearSyncQueue = async (): Promise<void> => {
  await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  await updateSyncStatus();
};

/**
 * Clear offline data cache
 */
export const clearOfflineCache = async (): Promise<void> => {
  await AsyncStorage.removeItem(OFFLINE_DATA_KEY);
};

/**
 * Force sync now
 */
export const forceSyncNow = async (): Promise<void> => {
  if (!syncStatus.isOnline) {
    throw new Error('Cannot sync while offline');
  }

  await syncPendingOperations();
};

/**
 * Get formatted last sync time
 */
export const getLastSyncTimeFormatted = (language: 'es' | 'en'): string => {
  if (!syncStatus.lastSyncTime) {
    return language === 'es' ? 'Nunca' : 'Never';
  }

  const now = Date.now();
  const diff = now - syncStatus.lastSyncTime;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return language === 'es' ? 'Justo ahora' : 'Just now';
  }
  if (minutes < 60) {
    return language === 'es' ? `Hace ${minutes} min` : `${minutes} min ago`;
  }
  if (hours < 24) {
    return language === 'es' ? `Hace ${hours}h` : `${hours}h ago`;
  }
  return language === 'es' ? `Hace ${days} días` : `${days} days ago`;
};

/**
 * Resolve conflicts (simple strategy: last write wins)
 */
export const resolveConflict = async (
  localData: any,
  remoteData: any
): Promise<any> => {
  // Last write wins strategy
  const localTime = localData.updatedAt || localData.createdAt || 0;
  const remoteTime = remoteData.updatedAt || remoteData.createdAt || 0;

  return remoteTime > localTime ? remoteData : localData;
};
