/**
 * GlobalSearchBar - Busca gastos, eventos y personas en toda la app
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { AllCategoryLabels } from '../types';

interface SearchResult {
  id: string;
  type: 'expense' | 'event' | 'participant';
  title: string;
  subtitle: string;
  icon: string;
  data: any;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<Props> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!user || q.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];
    const lowerQ = q.toLowerCase().trim();

    try {
      // Search events where user is a participant
      const eventsRef = collection(db, 'events');
      const eventsQuery = query(
        eventsRef,
        where('participantIds', 'array-contains', user.uid),
      );
      const eventsSnap = await getDocs(eventsQuery);
      
      for (const doc of eventsSnap.docs) {
        const event = doc.data();
        const name = (event.name || '').toLowerCase();
        const desc = (event.description || '').toLowerCase();
        if (name.includes(lowerQ) || desc.includes(lowerQ)) {
          searchResults.push({
            id: doc.id,
            type: 'event',
            title: event.name,
            subtitle: `${event.participantIds?.length || 0} participantes · ${event.currency || 'EUR'}`,
            icon: event.icon || '📅',
            data: { eventId: doc.id },
          });
        }
      }

      // Search expenses across all accessible events + individual
      const expensesRef = collection(db, 'expenses');
      const expensesQuery = query(
        expensesRef,
        where('createdBy', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(200),
      );
      const expensesSnap = await getDocs(expensesQuery);

      for (const doc of expensesSnap.docs) {
        const expense = doc.data();
        const desc = (expense.description || expense.name || '').toLowerCase();
        const cat = (AllCategoryLabels[expense.category as keyof typeof AllCategoryLabels] || '').toLowerCase();
        const tags = (expense.tags || []).map((t: string) => t.toLowerCase());
        const notes = (expense.notes || '').toLowerCase();
        
        if (desc.includes(lowerQ) || cat.includes(lowerQ) || tags.some((t: string) => t.includes(lowerQ)) || notes.includes(lowerQ)) {
          const amount = expense.amount || 0;
          searchResults.push({
            id: doc.id,
            type: 'expense',
            title: expense.description || expense.name || 'Gasto',
            subtitle: `${amount.toFixed(2)} ${expense.currency || '€'} · ${AllCategoryLabels[expense.category as keyof typeof AllCategoryLabels] || expense.category}`,
            icon: expense.type === 'income' ? '📈' : '💰',
            data: { expenseId: doc.id, eventId: expense.eventId },
          });
        }
      }

      // Search participants in user's events
      const participantsRef = collection(db, 'participants');
      for (const eventDoc of eventsSnap.docs) {
        const pQuery = query(
          participantsRef,
          where('eventId', '==', eventDoc.id),
        );
        const pSnap = await getDocs(pQuery);
        for (const pDoc of pSnap.docs) {
          const p = pDoc.data();
          const pName = (p.name || '').toLowerCase();
          const pEmail = (p.email || '').toLowerCase();
          if (pName.includes(lowerQ) || pEmail.includes(lowerQ)) {
            // Only add unique participants
            if (!searchResults.find(r => r.type === 'participant' && r.title === p.name)) {
              searchResults.push({
                id: pDoc.id,
                type: 'participant',
                title: p.name,
                subtitle: eventDoc.data().name || 'Evento',
                icon: '👤',
                data: { eventId: eventDoc.id },
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('Search error:', error);
    }

    setResults(searchResults.slice(0, 30));
    setLoading(false);
  }, [user]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => performSearch(text), 300);
  }, [performSearch]);

  const handleResultPress = useCallback((result: SearchResult) => {
    onClose();
    setSearchQuery('');
    setResults([]);

    switch (result.type) {
      case 'event':
        navigation.navigate('EventDetail', { eventId: result.data.eventId });
        break;
      case 'expense':
        if (result.data.eventId) {
          navigation.navigate('EventDetail', { eventId: result.data.eventId });
        }
        break;
      case 'participant':
        navigation.navigate('EventDetail', { eventId: result.data.eventId });
        break;
    }
  }, [navigation, onClose]);

  const styles = getStyles(theme);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Buscar gastos, eventos, personas..."
              placeholderTextColor={theme.colors.textTertiary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}

        {!loading && searchQuery.length >= 2 && results.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Sin resultados para "{searchQuery}"</Text>
          </View>
        )}

        {!loading && searchQuery.length < 2 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💡</Text>
            <Text style={styles.emptyText}>Escribe al menos 2 caracteres para buscar</Text>
            <Text style={styles.hintText}>Busca por nombre, categoría, etiqueta o persona</Text>
          </View>
        )}

        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => handleResultPress(item)}>
              <Text style={styles.resultIcon}>{item.icon}</Text>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {item.type === 'expense' ? 'Gasto' : item.type === 'event' ? 'Evento' : 'Persona'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </Modal>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  cancelBtn: { marginLeft: 12, paddingVertical: 8 },
  cancelText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
  loadingContainer: { padding: 20, alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center' },
  hintText: { fontSize: 13, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 8 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  resultIcon: { fontSize: 28, marginRight: 12 },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  resultSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  typeBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },
});
