/**
 * AchievementsScreen - Muestra badges, estadísticas y leaderboard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useExpenses } from '../hooks/useExpenses';
import { getEvent } from '../services/firebase';
import { 
  calculateParticipantStats, 
  getEventLeaderboard,
  Badge,
  ParticipantStats 
} from '../services/gamificationService';

type AchievementsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Achievements'>;
type AchievementsScreenRouteProp = RouteProp<RootStackParamList, 'Achievements'>;

interface Props {
  navigation: AchievementsScreenNavigationProp;
  route: AchievementsScreenRouteProp;
}

export function AchievementsScreen({ navigation, route }: Props) {
  const { eventId, participantId } = route.params;
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const language = currentLanguage.code as 'es' | 'en';
  const { expenses, participants } = useExpenses(eventId);
  const [stats, setStats] = useState<ParticipantStats | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [eventId, participantId, expenses, participants]);

  const loadData = async () => {
    try {
      const eventData = await getEvent(eventId);
      setEvent(eventData);

      const participant = participants.find(p => p.id === participantId);
      if (participant && expenses.length > 0 && eventData) {
        const participantStats = calculateParticipantStats(
          participant,
          expenses,
          participants,
          eventData,
          language
        );
        setStats(participantStats);
      }
    } catch (error) {
      console.error('Error loading achievement data:', error);
    }
  };

  const leaderboard = event && expenses.length > 0 
    ? getEventLeaderboard(expenses, participants, event)
    : [];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
    },
    backButtonText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    leaderboardButton: {
      padding: 8,
    },
    leaderboardButtonText: {
      fontSize: 24,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 16,
    },
    badgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    badgeCard: {
      width: '48%',
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    badgeCardLegendary: {
      borderColor: '#F59E0B',
      backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
    },
    badgeCardEpic: {
      borderColor: '#8B5CF6',
      backgroundColor: theme.isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
    },
    badgeCardRare: {
      borderColor: '#3B82F6',
      backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
    },
    badgeIcon: {
      fontSize: 48,
      marginBottom: 8,
    },
    badgeName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    badgeRarity: {
      fontSize: 11,
      fontWeight: '500',
      textTransform: 'uppercase',
      marginTop: 4,
    },
    rarityLegendary: {
      color: '#F59E0B',
    },
    rarityEpic: {
      color: '#8B5CF6',
    },
    rarityRare: {
      color: '#3B82F6',
    },
    rarityCommon: {
      color: theme.colors.textSecondary,
    },
    statsContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    statsRowLast: {
      borderBottomWidth: 0,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
    },
    rankingsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    rankingCard: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
    },
    rankingPosition: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    rankingLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    funFactsContainer: {
      gap: 8,
    },
    funFact: {
      backgroundColor: theme.colors.card,
      padding: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    funFactIcon: {
      fontSize: 20,
    },
    funFactText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    noBadgesContainer: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: theme.colors.card,
      borderRadius: 16,
    },
    noBadgesIcon: {
      fontSize: 64,
      marginBottom: 16,
      opacity: 0.5,
    },
    noBadgesText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderRadius: 24,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
    },
    modalBadgeIcon: {
      fontSize: 80,
      marginBottom: 16,
    },
    modalBadgeName: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    modalBadgeDescription: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    modalCloseButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    modalCloseButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    // Leaderboard modal styles
    leaderboardModal: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    leaderboardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    leaderboardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    leaderboardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
    },
    leaderboardRank: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    leaderboardRankText: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    leaderboardInfo: {
      flex: 1,
    },
    leaderboardName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    leaderboardStats: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    leaderboardBadges: {
      flexDirection: 'row',
      gap: 4,
    },
    leaderboardBadgeIcon: {
      fontSize: 16,
    },
  });

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return styles.rarityLegendary;
      case 'epic':
        return styles.rarityEpic;
      case 'rare':
        return styles.rarityRare;
      default:
        return styles.rarityCommon;
    }
  };

  const getBadgeCardStyle = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return styles.badgeCardLegendary;
      case 'epic':
        return styles.badgeCardEpic;
      case 'rare':
        return styles.badgeCardRare;
      default:
        return null;
    }
  };

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🏆 Logros</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.noBadgesText}>Cargando estadísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 Logros</Text>
        <TouchableOpacity 
          onPress={() => setShowLeaderboard(true)} 
          style={styles.leaderboardButton}
        >
          <Text style={styles.leaderboardButtonText}>📊</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Rankings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Tu Posición</Text>
          <View style={styles.rankingsContainer}>
            <View style={styles.rankingCard}>
              <Text style={styles.rankingPosition}>#{stats.rankings.mostGenerous}</Text>
              <Text style={styles.rankingLabel}>Más Generoso</Text>
            </View>
            <View style={styles.rankingCard}>
              <Text style={styles.rankingPosition}>#{stats.rankings.mostActive}</Text>
              <Text style={styles.rankingLabel}>Más Activo</Text>
            </View>
            <View style={styles.rankingCard}>
              <Text style={styles.rankingPosition}>#{stats.rankings.mostOrganized}</Text>
              <Text style={styles.rankingLabel}>Más Organizado</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🏅 Badges Desbloqueados ({stats.badges.length})
          </Text>
          {stats.badges.length > 0 ? (
            <View style={styles.badgesGrid}>
              {stats.badges.map((badge) => (
                <TouchableOpacity
                  key={badge.id}
                  style={[styles.badgeCard, getBadgeCardStyle(badge.rarity)]}
                  onPress={() => setSelectedBadge(badge)}
                >
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={styles.badgeName}>
                    {language === 'es' ? badge.name : badge.nameEn}
                  </Text>
                  <Text style={[styles.badgeRarity, getRarityStyle(badge.rarity)]}>
                    {badge.rarity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noBadgesContainer}>
              <Text style={styles.noBadgesIcon}>🎯</Text>
              <Text style={styles.noBadgesText}>
                Aún no has desbloqueado ningún badge.{'\n'}
                ¡Sigue registrando gastos para conseguirlos!
              </Text>
            </View>
          )}
        </View>

        {/* Estadísticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Tus Estadísticas</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Total pagado</Text>
              <Text style={styles.statValue}>{stats.stats.totalPaid.toFixed(2)}€</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Gastos registrados</Text>
              <Text style={styles.statValue}>{stats.stats.totalExpenses}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Gasto promedio</Text>
              <Text style={styles.statValue}>{stats.stats.averageExpense.toFixed(2)}€</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Gasto más grande</Text>
              <Text style={styles.statValue}>{stats.stats.biggestExpense.toFixed(2)}€</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Días activos</Text>
              <Text style={styles.statValue}>{stats.stats.daysActive}</Text>
            </View>
            <View style={[styles.statsRow, styles.statsRowLast]}>
              <Text style={styles.statLabel}>Fotos subidas</Text>
              <Text style={styles.statValue}>{stats.stats.photoUploadRate.toFixed(0)}%</Text>
            </View>
          </View>
        </View>

        {/* Fun Facts */}
        {stats.funFacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Datos Curiosos</Text>
            <View style={styles.funFactsContainer}>
              {stats.funFacts.map((fact, index) => (
                <View key={index} style={styles.funFact}>
                  <Text style={styles.funFactIcon}>✨</Text>
                  <Text style={styles.funFactText}>{fact}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Badge Detail Modal */}
      <Modal
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBadge(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalBadgeIcon}>{selectedBadge?.icon}</Text>
            <Text style={styles.modalBadgeName}>
              {selectedBadge && (language === 'es' ? selectedBadge.name : selectedBadge.nameEn)}
            </Text>
            <Text style={styles.modalBadgeDescription}>
              {selectedBadge && (language === 'es' ? selectedBadge.description : selectedBadge.descriptionEn)}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedBadge(null)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Leaderboard Modal */}
      <Modal
        visible={showLeaderboard}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.leaderboardModal} edges={['top', 'bottom']}>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.leaderboardTitle}>🏆 Ranking del Evento</Text>
            <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
              <Text style={styles.backButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {leaderboard.map((entry) => (
              <View key={entry.participant.id} style={styles.leaderboardItem}>
                <View style={[
                  styles.leaderboardRank,
                  entry.rank === 1 && { backgroundColor: '#F59E0B' },
                  entry.rank === 2 && { backgroundColor: '#94A3B8' },
                  entry.rank === 3 && { backgroundColor: '#CD7F32' },
                ]}>
                  <Text style={styles.leaderboardRankText}>{entry.rank}</Text>
                </View>
                <View style={styles.leaderboardInfo}>
                  <Text style={styles.leaderboardName}>{entry.participant.name}</Text>
                  <Text style={styles.leaderboardStats}>
                    {entry.totalPaid.toFixed(0)}€ • {entry.totalExpenses} gastos
                  </Text>
                </View>
                <View style={styles.leaderboardBadges}>
                  {entry.badges.slice(0, 3).map((badge) => (
                    <Text key={badge.id} style={styles.leaderboardBadgeIcon}>
                      {badge.icon}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
