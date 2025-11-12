/**
 * SummaryScreen - Pantalla de resumen completo con gráficos y liquidaciones
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { RootStackParamList, Event, CategoryColors, CategoryLabels, CurrencySymbols } from '../types';
import { Card, Button } from '../components/lovable';
import { getEvent } from '../services/firebase';
import { useExpenses } from '../hooks/useExpenses';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

type SummaryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Summary'>;
type SummaryScreenRouteProp = RouteProp<RootStackParamList, 'Summary'>;

interface Props {
  navigation: SummaryScreenNavigationProp;
  route: SummaryScreenRouteProp;
}

const screenWidth = Dimensions.get('window').width;

export const SummaryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [exporting, setExporting] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  const {
    expenses,
    participants,
    getTotalExpenses,
    getRemainingBalance,
    getExpensesByCategory,
    getParticipantBalances,
    calculateSettlements,
    getParticipantById,
  } = useExpenses(eventId);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const eventData = await getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el evento');
    }
  };

  const exportAsImage = async () => {
    try {
      setExporting(true);
      if (!viewShotRef.current || !viewShotRef.current.capture) return;

      const uri = await viewShotRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartir resumen',
        });
      } else {
        Alert.alert('Info', 'Compartir no está disponible en este dispositivo');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar la imagen');
    } finally {
      setExporting(false);
    }
  };

  const shareAsText = async () => {
    try {
      setExporting(true);
      const totalExpenses = getTotalExpenses();
      const remainingBalance = getRemainingBalance(event!.initialBudget);
      const settlements = calculateSettlements();
      const currencySymbol = CurrencySymbols[event!.currency];

      let text = `📊 RESUMEN DE ${event!.name.toUpperCase()}\n\n`;
      text += `💰 Presupuesto: ${currencySymbol}${event!.initialBudget.toFixed(2)}\n`;
      text += `💸 Gastado: ${currencySymbol}${totalExpenses.toFixed(2)}\n`;
      text += `💵 Restante: ${currencySymbol}${remainingBalance.toFixed(2)}\n\n`;
      
      text += `👥 PARTICIPANTES:\n`;
      participants.forEach(p => {
        text += `• ${p.name}: ${currencySymbol}${p.individualBudget.toFixed(2)}\n`;
      });

      if (settlements.length > 0) {
        text += `\n💳 LIQUIDACIONES:\n`;
        settlements.forEach(s => {
          const from = getParticipantById(s.from);
          const to = getParticipantById(s.to);
          text += `• ${from?.name} debe ${currencySymbol}${s.amount.toFixed(2)} a ${to?.name}\n`;
        });
      }

      // En React Native, puedes usar Share API nativo
      const { Share } = await import('react-native');
      await Share.share({
        message: text,
        title: `Resumen de ${event!.name}`,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir el resumen');
    } finally {
      setExporting(false);
    }
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currencySymbol = CurrencySymbols[event.currency];
  const totalExpenses = getTotalExpenses();
  const remainingBalance = getRemainingBalance(event.initialBudget);
  const expensesByCategory = getExpensesByCategory();
  const participantBalances = getParticipantBalances();
  const settlements = calculateSettlements();

  // Datos para el gráfico de pastel
  const chartData = expensesByCategory.map((item) => ({
    name: CategoryLabels[item.category].split(' ')[1], // Quitamos el emoji
    population: item.total,
    color: CategoryColors[item.category],
    legendFontColor: '#6B7280',
    legendFontSize: 12,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Resumen completo</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
          {/* Resumen general */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>💰 Resumen general</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Presupuesto inicial</Text>
            <Text style={styles.summaryValue}>
              {currencySymbol}{event.initialBudget.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total gastado</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {currencySymbol}{totalExpenses.toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Saldo restante</Text>
            <Text
              style={[
                styles.summaryValueBold,
                { color: remainingBalance >= 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {currencySymbol}{remainingBalance.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total de gastos</Text>
            <Text style={styles.summaryValue}>{expenses.length}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Participantes</Text>
            <Text style={styles.summaryValue}>{participants.length}</Text>
          </View>
        </Card>

        {/* Gráfico de gastos por categoría */}
        {chartData.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>📊 Gastos por categoría</Text>
            
            <PieChart
              data={chartData}
              width={screenWidth - 80}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />

            <View style={styles.categoryList}>
              {expensesByCategory.map((item) => (
                <View key={item.category} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: CategoryColors[item.category] },
                      ]}
                    />
                    <Text style={styles.categoryName}>
                      {CategoryLabels[item.category]}
                    </Text>
                  </View>
                  <View style={styles.categoryStats}>
                    <Text style={styles.categoryAmount}>
                      {currencySymbol}{item.total.toFixed(2)}
                    </Text>
                    <Text style={styles.categoryPercentage}>
                      ({item.percentage.toFixed(1)}%)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Balances de participantes */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>👥 Balance de participantes</Text>
          
          {participantBalances.map((balance) => (
            <View key={balance.participantId} style={styles.balanceItem}>
              <Text style={styles.balanceName}>{balance.participantName}</Text>
              
              <View style={styles.balanceDetails}>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Pagó:</Text>
                  <Text style={styles.balanceAmount}>
                    {currencySymbol}{balance.totalPaid.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Debe:</Text>
                  <Text style={styles.balanceAmount}>
                    {currencySymbol}{balance.totalOwed.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabelBold}>Balance:</Text>
                  <Text
                    style={[
                      styles.balanceAmountBold,
                      { color: balance.balance >= 0 ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {balance.balance >= 0 ? '+' : ''}
                    {currencySymbol}{balance.balance.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Liquidaciones sugeridas */}
        {settlements.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>💸 Liquidaciones sugeridas</Text>
            <Text style={styles.cardSubtitle}>
              Para saldar las cuentas, realiza las siguientes transferencias:
            </Text>

            {settlements.map((settlement, index) => {
              const fromParticipant = getParticipantById(settlement.from);
              const toParticipant = getParticipantById(settlement.to);

              return (
                <View key={index} style={styles.settlementItem}>
                  <Text style={styles.settlementText}>
                    <Text style={styles.settlementName}>{fromParticipant?.name}</Text>
                    {' → '}
                    <Text style={styles.settlementName}>{toParticipant?.name}</Text>
                  </Text>
                  <Text style={styles.settlementAmount}>
                    {currencySymbol}{settlement.amount.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}
        </ViewShot>

        {/* Botones de exportar */}
        <View style={styles.exportButtons}>
          <Button
            title="📤 Compartir Texto"
            onPress={shareAsText}
            loading={exporting}
            variant="outline"
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title="📸 Compartir Imagen"
            onPress={exportAsImage}
            loading={exporting}
            variant="outline"
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    padding: 24,
  },
  card: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  categoryList: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  balanceItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  balanceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  balanceDetails: {
    marginLeft: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceAmount: {
    fontSize: 14,
    color: '#374151',
  },
  balanceLabelBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  balanceAmountBold: {
    fontSize: 16,
    fontWeight: '700',
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  settlementText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  settlementName: {
    fontWeight: '600',
    color: '#111827',
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  exportButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
});
