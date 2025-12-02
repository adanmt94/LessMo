/**
 * Recommendations Card Component
 * Display contextual recommendations in EventDetailScreen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { generateRecommendations, getPersonalizedTips, Recommendation } from '../services/recommendationsService';
import { Event, Expense, Participant } from '../types';

interface RecommendationsCardProps {
  event: Event;
  expenses: Expense[];
  participants: Participant[];
}

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  event,
  expenses,
  participants,
}) => {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [expenses, participants]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      // Generate recommendations
      const recs = await generateRecommendations(event, expenses, participants);
      setRecommendations(recs);

      // Get personalized tips
      const language = currentLanguage.code as 'es' | 'en';
      const personalizedTips = getPersonalizedTips(expenses, participants, language);
      setTips(personalizedTips);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleRecPress = (rec: Recommendation) => {
    setSelectedRec(rec);
    setDetailsModalVisible(true);
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') return '#EF4444';
    if (priority === 'medium') return '#F59E0B';
    return '#10B981';
  };

  const getPriorityBgColor = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') {
      return theme.isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)';
    }
    if (priority === 'medium') {
      return theme.isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)';
    }
    return theme.isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (recommendations.length === 0 && tips.length === 0) {
    return null; // Don't show card if no recommendations
  }

  const language = currentLanguage.code as 'es' | 'en';

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            💡 {language === 'es' ? 'Recomendaciones' : 'Recommendations'}
          </Text>
          <TouchableOpacity onPress={loadRecommendations}>
            <Text style={[styles.refreshButton, { color: theme.colors.primary }]}>
              🔄
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            {recommendations.slice(0, 3).map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={[
                  styles.recCard,
                  {
                    backgroundColor: getPriorityBgColor(rec.priority),
                    borderLeftColor: getPriorityColor(rec.priority),
                  },
                ]}
                onPress={() => handleRecPress(rec)}
              >
                <View style={styles.recHeader}>
                  <Text style={styles.recIcon}>{rec.icon}</Text>
                  <Text style={[styles.recTitle, { color: theme.colors.text }]}>
                    {language === 'es' ? rec.title : rec.titleEn}
                  </Text>
                </View>
                <Text style={[styles.recDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                  {language === 'es' ? rec.description : rec.descriptionEn}
                </Text>
                {rec.actionLabel && (
                  <Text style={[styles.actionLabel, { color: theme.colors.primary }]}>
                    {language === 'es' ? rec.actionLabel : rec.actionLabelEn} →
                  </Text>
                )}
              </TouchableOpacity>
            ))}

            {recommendations.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => {
                  // Show all recommendations in modal
                  setSelectedRec(null);
                  setDetailsModalVisible(true);
                }}
              >
                <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                  {language === 'es' 
                    ? `Ver todas (${recommendations.length})` 
                    : `View all (${recommendations.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <View style={styles.tipsSection}>
            <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
              {language === 'es' ? '💡 Consejos' : '💡 Tips'}
            </Text>
            {tips.map((tip, index) => (
              <Text key={index} style={[styles.tip, { color: theme.colors.textSecondary }]}>
                • {tip}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {selectedRec 
                  ? (language === 'es' ? selectedRec.title : selectedRec.titleEn)
                  : (language === 'es' ? 'Todas las recomendaciones' : 'All recommendations')}
              </Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Text style={[styles.closeButton, { color: theme.colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedRec ? (
                // Single recommendation details
                <>
                  <Text style={[styles.modalIcon, { color: theme.colors.text }]}>{selectedRec.icon}</Text>
                  <Text style={[styles.modalDescription, { color: theme.colors.text }]}>
                    {language === 'es' ? selectedRec.description : selectedRec.descriptionEn}
                  </Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityBgColor(selectedRec.priority) }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(selectedRec.priority) }]}>
                      {selectedRec.priority === 'high' && (language === 'es' ? '🔴 Alta' : '🔴 High')}
                      {selectedRec.priority === 'medium' && (language === 'es' ? '🟡 Media' : '🟡 Medium')}
                      {selectedRec.priority === 'low' && (language === 'es' ? '🟢 Baja' : '🟢 Low')}
                    </Text>
                  </View>
                </>
              ) : (
                // All recommendations list
                recommendations.map((rec) => (
                  <TouchableOpacity
                    key={rec.id}
                    style={[
                      styles.modalRecCard,
                      {
                        backgroundColor: theme.colors.card,
                        borderLeftColor: getPriorityColor(rec.priority),
                      },
                    ]}
                    onPress={() => setSelectedRec(rec)}
                  >
                    <View style={styles.recHeader}>
                      <Text style={styles.recIcon}>{rec.icon}</Text>
                      <Text style={[styles.recTitle, { color: theme.colors.text }]}>
                        {language === 'es' ? rec.title : rec.titleEn}
                      </Text>
                    </View>
                    <Text style={[styles.recDescription, { color: theme.colors.textSecondary }]}>
                      {language === 'es' ? rec.description : rec.descriptionEn}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    fontSize: 20,
  },
  section: {
    marginBottom: 12,
  },
  recCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  recDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 28,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 28,
  },
  viewAllButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  tip: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
  modalIcon: {
    fontSize: 60,
    textAlign: 'center',
    marginVertical: 20,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  priorityBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalRecCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
});
