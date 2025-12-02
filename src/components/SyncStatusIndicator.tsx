/**
 * Sync Status Indicator Component
 * Display network and sync status in the app header
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  subscribeSyncStatus,
  getSyncStatus,
  forceSyncNow,
  getLastSyncTimeFormatted,
  clearSyncQueue,
  SyncStatus,
  SyncOperation,
} from '../services/syncService';

export const SyncStatusIndicator: React.FC = () => {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const language = currentLanguage.code as 'es' | 'en';

  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus(setStatus);
    return unsubscribe;
  }, []);

  const handlePress = () => {
    setDetailsVisible(true);
  };

  const handleSyncNow = async () => {
    try {
      await forceSyncNow();
      Alert.alert(
        language === 'es' ? '✅ Sincronizado' : '✅ Synced',
        language === 'es' ? 'Todos los cambios han sido sincronizados' : 'All changes synced',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        language === 'es' ? '❌ Error' : '❌ Error',
        error.message,
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearQueue = () => {
    Alert.alert(
      language === 'es' ? '⚠️ Limpiar cola' : '⚠️ Clear queue',
      language === 'es' 
        ? '¿Eliminar todas las operaciones pendientes? Esta acción no se puede deshacer.'
        : 'Delete all pending operations? This action cannot be undone.',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'es' ? 'Eliminar' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await clearSyncQueue();
            setDetailsVisible(false);
          },
        },
      ]
    );
  };

  // Determine indicator color and icon
  let indicatorColor = '#10B981'; // Green - online and synced
  let icon = '✓';

  if (!status.isOnline) {
    indicatorColor = '#EF4444'; // Red - offline
    icon = '✕';
  } else if (status.isSyncing) {
    indicatorColor = '#F59E0B'; // Orange - syncing
    icon = '⟳';
  } else if (status.pendingOperations > 0) {
    indicatorColor = '#3B82F6'; // Blue - pending operations
    icon = '•';
  } else if (status.failedOperations > 0) {
    indicatorColor = '#F59E0B'; // Orange - failed operations
    icon = '!';
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.indicator, { backgroundColor: indicatorColor }]}
        onPress={handlePress}
      >
        <Text style={styles.indicatorIcon}>{icon}</Text>
        {status.pendingOperations > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{status.pendingOperations}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Details Modal */}
      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {language === 'es' ? '🔄 Estado de sincronización' : '🔄 Sync Status'}
              </Text>
              <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                <Text style={[styles.closeButton, { color: theme.colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Network Status */}
              <View style={[styles.statusCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
                    {language === 'es' ? 'Conexión' : 'Connection'}
                  </Text>
                  <View style={styles.statusValue}>
                    <View style={[styles.dot, { backgroundColor: status.isOnline ? '#10B981' : '#EF4444' }]} />
                    <Text style={[styles.statusText, { color: theme.colors.text }]}>
                      {status.isOnline 
                        ? (language === 'es' ? 'En línea' : 'Online')
                        : (language === 'es' ? 'Sin conexión' : 'Offline')}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
                    {language === 'es' ? 'Sincronizando' : 'Syncing'}
                  </Text>
                  <Text style={[styles.statusText, { color: theme.colors.text }]}>
                    {status.isSyncing 
                      ? (language === 'es' ? 'Sí' : 'Yes')
                      : (language === 'es' ? 'No' : 'No')}
                  </Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
                    {language === 'es' ? 'Última sincronización' : 'Last sync'}
                  </Text>
                  <Text style={[styles.statusText, { color: theme.colors.text }]}>
                    {getLastSyncTimeFormatted(language)}
                  </Text>
                </View>
              </View>

              {/* Operations Status */}
              <View style={[styles.statusCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {language === 'es' ? 'Operaciones' : 'Operations'}
                </Text>

                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
                    {language === 'es' ? '⏳ Pendientes' : '⏳ Pending'}
                  </Text>
                  <Text style={[styles.statusNumber, { color: '#3B82F6' }]}>
                    {status.pendingOperations}
                  </Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
                    {language === 'es' ? '❌ Fallidas' : '❌ Failed'}
                  </Text>
                  <Text style={[styles.statusNumber, { color: '#EF4444' }]}>
                    {status.failedOperations}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { 
                      backgroundColor: theme.colors.primary,
                      opacity: !status.isOnline || status.isSyncing ? 0.5 : 1,
                    },
                  ]}
                  onPress={handleSyncNow}
                  disabled={!status.isOnline || status.isSyncing}
                >
                  <Text style={styles.actionButtonText}>
                    {language === 'es' ? '🔄 Sincronizar ahora' : '🔄 Sync now'}
                  </Text>
                </TouchableOpacity>

                {status.pendingOperations > 0 && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                    onPress={handleClearQueue}
                  >
                    <Text style={styles.actionButtonText}>
                      {language === 'es' ? '🗑️ Limpiar cola' : '🗑️ Clear queue'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Info */}
              <View style={[styles.infoCard, { backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }]}>
                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                  {language === 'es'
                    ? 'ℹ️ Las operaciones se sincronizan automáticamente cuando hay conexión. Puedes trabajar sin conexión y los cambios se guardarán localmente.'
                    : 'ℹ️ Operations sync automatically when online. You can work offline and changes will be saved locally.'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  indicatorIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    fontSize: 28,
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actions: {
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
