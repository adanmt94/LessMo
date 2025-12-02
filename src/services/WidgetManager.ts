/**
 * iOS Widget - Implementación completa con 3 tamaños
 * 
 * IMPORTANTE: Este código NO funciona en Expo Go
 * Requiere build nativa con WidgetKit
 * 
 * Tamaños disponibles:
 * - Small (pequeño): Resumen básico
 * - Medium (mediano): Detalle de gastos
 * - Large (grande): Lista de últimos gastos
 */

// ==========================================
// SWIFT CODE - ExpenseWidget.swift
// ==========================================

/*
import WidgetKit
import SwiftUI

// MARK: - Widget Entry
struct ExpenseEntry: TimelineEntry {
    let date: Date
    let totalAmount: Double
    let expenseCount: Int
    let todayExpenses: Double
    let currency: String
    let recentExpenses: [RecentExpense]
}

struct RecentExpense: Codable, Identifiable {
    let id: String
    let description: String
    let amount: Double
    let date: Date
}

// MARK: - Widget Provider
struct ExpenseProvider: TimelineProvider {
    func placeholder(in context: Context) -> ExpenseEntry {
        ExpenseEntry(
            date: Date(),
            totalAmount: 0.0,
            expenseCount: 0,
            todayExpenses: 0.0,
            currency: "€",
            recentExpenses: []
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (ExpenseEntry) -> Void) {
        let entry = ExpenseEntry(
            date: Date(),
            totalAmount: 1234.50,
            expenseCount: 15,
            todayExpenses: 45.60,
            currency: "€",
            recentExpenses: [
                RecentExpense(id: "1", description: "Café", amount: 3.50, date: Date()),
                RecentExpense(id: "2", description: "Almuerzo", amount: 12.00, date: Date()),
                RecentExpense(id: "3", description: "Transporte", amount: 5.00, date: Date())
            ]
        )
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<ExpenseEntry>) -> Void) {
        // Obtener datos desde App Group o UserDefaults compartido
        let sharedDefaults = UserDefaults(suiteName: "group.com.lessmo.app")
        
        let totalAmount = sharedDefaults?.double(forKey: "totalAmount") ?? 0.0
        let expenseCount = sharedDefaults?.integer(forKey: "expenseCount") ?? 0
        let todayExpenses = sharedDefaults?.double(forKey: "todayExpenses") ?? 0.0
        let currency = sharedDefaults?.string(forKey: "currency") ?? "€"
        
        // Decodificar gastos recientes
        var recentExpenses: [RecentExpense] = []
        if let data = sharedDefaults?.data(forKey: "recentExpenses") {
            recentExpenses = (try? JSONDecoder().decode([RecentExpense].self, from: data)) ?? []
        }
        
        let entry = ExpenseEntry(
            date: Date(),
            totalAmount: totalAmount,
            expenseCount: expenseCount,
            todayExpenses: todayExpenses,
            currency: currency,
            recentExpenses: recentExpenses
        )
        
        // Actualizar cada 15 minutos
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        
        completion(timeline)
    }
}

// MARK: - Small Widget View
struct SmallExpenseWidgetView: View {
    let entry: ExpenseEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Icono y título
            HStack {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
                Text("LessMo")
                    .font(.headline)
                    .bold()
            }
            
            Spacer()
            
            // Total del mes
            Text("Este Mes")
                .font(.caption)
                .foregroundColor(.secondary)
            
            Text("\(entry.totalAmount, specifier: "%.2f") \(entry.currency)")
                .font(.title2)
                .bold()
                .minimumScaleFactor(0.5)
            
            // Contador de gastos
            Text("\(entry.expenseCount) gastos")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .containerBackground(for: .widget) {
            LinearGradient(
                colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Medium Widget View
struct MediumExpenseWidgetView: View {
    let entry: ExpenseEntry
    
    var body: some View {
        HStack(spacing: 16) {
            // Columna izquierda: Total
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: "dollarsign.circle.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                    Text("LessMo")
                        .font(.headline)
                        .bold()
                }
                
                Spacer()
                
                Text("Total del Mes")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text("\(entry.totalAmount, specifier: "%.2f")")
                    .font(.title)
                    .bold()
                
                Text("\(entry.currency)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Divider()
            
            // Columna derecha: Hoy
            VStack(alignment: .leading, spacing: 4) {
                Text("Hoy")
                    .font(.subheadline)
                    .bold()
                
                Spacer()
                
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.caption)
                        .foregroundColor(.orange)
                    Text("\(entry.todayExpenses, specifier: "%.2f") \(entry.currency)")
                        .font(.title3)
                        .bold()
                }
                
                Text("\(entry.expenseCount) gastos")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                // Botón de acción
                Link(destination: URL(string: "lessmo://add-expense")!) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("Añadir")
                    }
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            LinearGradient(
                colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Large Widget View
struct LargeExpenseWidgetView: View {
    let entry: ExpenseEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
                Text("LessMo")
                    .font(.headline)
                    .bold()
                
                Spacer()
                
                Text("\(entry.totalAmount, specifier: "%.2f") \(entry.currency)")
                    .font(.title3)
                    .bold()
            }
            
            Divider()
            
            // Resumen del día
            HStack {
                VStack(alignment: .leading) {
                    Text("Gastos de Hoy")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(entry.todayExpenses, specifier: "%.2f") \(entry.currency)")
                        .font(.title3)
                        .bold()
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Total Gastos")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(entry.expenseCount)")
                        .font(.title3)
                        .bold()
                }
            }
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(Color.blue.opacity(0.1))
            .cornerRadius(8)
            
            // Lista de gastos recientes
            Text("Últimos Gastos")
                .font(.subheadline)
                .bold()
            
            ForEach(entry.recentExpenses.prefix(4)) { expense in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(expense.description)
                            .font(.caption)
                            .bold()
                        Text(expense.date, style: .relative)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Text("\(expense.amount, specifier: "%.2f") \(entry.currency)")
                        .font(.caption)
                        .bold()
                }
                .padding(.vertical, 4)
            }
            
            Spacer()
            
            // Botón de acción
            Link(destination: URL(string: "lessmo://add-expense")!) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Añadir Gasto")
                    Spacer()
                    Image(systemName: "chevron.right")
                }
                .font(.caption)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            LinearGradient(
                colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Widget Configuration
@main
struct ExpenseWidget: Widget {
    let kind: String = "ExpenseWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ExpenseProvider()) { entry in
            ExpenseWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Gastos LessMo")
        .description("Ve el resumen de tus gastos")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Entry View (Router)
struct ExpenseWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: ExpenseEntry
    
    @ViewBuilder
    var body: some View {
        switch family {
        case .systemSmall:
            SmallExpenseWidgetView(entry: entry)
        case .systemMedium:
            MediumExpenseWidgetView(entry: entry)
        case .systemLarge:
            LargeExpenseWidgetView(entry: entry)
        default:
            SmallExpenseWidgetView(entry: entry)
        }
    }
}

// MARK: - Preview
struct ExpenseWidget_Previews: PreviewProvider {
    static var previews: some View {
        let entry = ExpenseEntry(
            date: Date(),
            totalAmount: 1234.50,
            expenseCount: 15,
            todayExpenses: 45.60,
            currency: "€",
            recentExpenses: [
                RecentExpense(id: "1", description: "Café", amount: 3.50, date: Date()),
                RecentExpense(id: "2", description: "Almuerzo", amount: 12.00, date: Date()),
                RecentExpense(id: "3", description: "Transporte", amount: 5.00, date: Date())
            ]
        )
        
        Group {
            ExpenseWidgetEntryView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Small")
            
            ExpenseWidgetEntryView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium")
            
            ExpenseWidgetEntryView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemLarge))
                .previewDisplayName("Large")
        }
    }
}
*/

// ==========================================
// REACT NATIVE CODE - Widget Data Manager
// ==========================================

import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WidgetData {
  totalAmount: number;
  expenseCount: number;
  todayExpenses: number;
  currency: string;
  recentExpenses: RecentExpense[];
}

interface RecentExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

const { WidgetModule } = NativeModules;

export class WidgetDataManager {
  private static sharedSuite = 'group.com.lessmo.app';

  /**
   * Actualiza los datos del widget
   */
  static async updateWidget(data: WidgetData): Promise<void> {
    if (Platform.OS !== 'ios') {
      
      return;
    }

    if (!WidgetModule) {
      
      return;
    }

    try {
      await WidgetModule.setData(this.sharedSuite, {
        totalAmount: data.totalAmount,
        expenseCount: data.expenseCount,
        todayExpenses: data.todayExpenses,
        currency: data.currency,
        recentExpenses: JSON.stringify(data.recentExpenses),
      });

      // Recargar el widget
      await WidgetModule.reloadAllTimelines();

      
    } catch (error) {
      
    }
  }

  /**
   * Obtiene los datos actuales del widget
   */
  static async getWidgetData(): Promise<WidgetData | null> {
    try {
      const data = await AsyncStorage.getItem('@LessMo:widgetData');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      
      return null;
    }
  }

  /**
   * Guarda los datos para sincronizar con el widget
   */
  static async saveWidgetData(data: WidgetData): Promise<void> {
    try {
      await AsyncStorage.setItem('@LessMo:widgetData', JSON.stringify(data));
      await this.updateWidget(data);
    } catch (error) {
      
    }
  }
}

// ==========================================
// NATIVE MODULE BRIDGE - WidgetModule.swift
// ==========================================

/*
import Foundation
import WidgetKit

@objc(WidgetModule)
class WidgetModule: NSObject {
    
    @objc
    func setData(_ suiteName: String, data: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        guard let sharedDefaults = UserDefaults(suiteName: suiteName) else {
            reject("SUITE_ERROR", "No se pudo acceder a UserDefaults compartido", nil)
            return
        }
        
        sharedDefaults.set(data["totalAmount"] as? Double ?? 0.0, forKey: "totalAmount")
        sharedDefaults.set(data["expenseCount"] as? Int ?? 0, forKey: "expenseCount")
        sharedDefaults.set(data["todayExpenses"] as? Double ?? 0.0, forKey: "todayExpenses")
        sharedDefaults.set(data["currency"] as? String ?? "€", forKey: "currency")
        
        if let recentExpensesJSON = data["recentExpenses"] as? String,
           let recentExpensesData = recentExpensesJSON.data(using: .utf8) {
            sharedDefaults.set(recentExpensesData, forKey: "recentExpenses")
        }
        
        sharedDefaults.synchronize()
        resolve(true)
    }
    
    @objc
    func reloadAllTimelines(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        WidgetCenter.shared.reloadAllTimelines()
        resolve(true)
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
*/

// ==========================================
// BRIDGE HEADER - WidgetModule.m
// ==========================================

/*
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetModule, NSObject)

RCT_EXTERN_METHOD(setData:(NSString *)suiteName
                  data:(NSDictionary *)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(reloadAllTimelines:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
*/

export default WidgetDataManager;
