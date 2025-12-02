/**
 * Live Activities - Implementación para iOS 16.1+
 * 
 * IMPORTANTE: Este código NO funciona en Expo Go
 * Requiere build nativa con:
 * - iOS 16.1+
 * - WidgetKit
 * - ActivityKit
 * 
 * Live Activities muestra información en tiempo real en:
 * - Lock Screen (Pantalla bloqueada)
 * - Dynamic Island (iPhone 14 Pro+)
 * 
 * Casos de uso en LessMo:
 * - Seguimiento de gasto activo
 * - Contador de gastos del día
 * - Resumen de evento en curso
 */

// ==========================================
// SWIFT CODE - Para implementar en iOS
// ==========================================

/*
// 1. Crear ExpenseActivityAttributes.swift

import ActivityKit
import Foundation

struct ExpenseActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Datos dinámicos que cambian
        var currentAmount: Double
        var expenseCount: Int
        var lastUpdate: Date
    }
    
    // Datos estáticos que no cambian
    var eventName: String
    var currency: String
}

// 2. Crear ExpenseActivityWidget.swift

import WidgetKit
import SwiftUI

@main
struct ExpenseLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ExpenseActivityAttributes.self) { context in
            // Lock Screen UI
            VStack(alignment: .leading) {
                HStack {
                    Image(systemName: "dollarsign.circle.fill")
                        .foregroundColor(.blue)
                    Text(context.attributes.eventName)
                        .font(.headline)
                }
                
                HStack {
                    VStack(alignment: .leading) {
                        Text("Total Gastado")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("\(context.state.currentAmount, specifier: "%.2f") \(context.attributes.currency)")
                            .font(.title2)
                            .bold()
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing) {
                        Text("Gastos")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("\(context.state.expenseCount)")
                            .font(.title2)
                            .bold()
                    }
                }
            }
            .padding()
            .activityBackgroundTint(Color.blue.opacity(0.2))
            
        } dynamicIsland: { context in
            // Dynamic Island UI
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "dollarsign.circle.fill")
                        .foregroundColor(.blue)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.currentAmount, specifier: "%.0f") \(context.attributes.currency)")
                        .font(.title3)
                        .bold()
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("\(context.state.expenseCount) gastos • \(context.attributes.eventName)")
                        .font(.caption)
                }
            } compactLeading: {
                // Compact leading
                Image(systemName: "dollarsign.circle.fill")
            } compactTrailing: {
                // Compact trailing
                Text("\(context.state.currentAmount, specifier: "%.0f")")
                    .font(.caption2)
            } minimal: {
                // Minimal view
                Image(systemName: "dollarsign.circle.fill")
            }
        }
    }
}
*/

// ==========================================
// REACT NATIVE CODE - Para llamar desde JS
// ==========================================

import { NativeModules, Platform } from 'react-native';

interface LiveActivityData {
  eventName: string;
  currency: string;
  currentAmount: number;
  expenseCount: number;
}

const { LiveActivityModule } = NativeModules;

export class LiveActivitiesManager {
  private static activityId: string | null = null;

  /**
   * Inicia una Live Activity
   */
  static async startActivity(data: LiveActivityData): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    if (!LiveActivityModule) {
      return;
    }

    try {
      const activityId = await LiveActivityModule.startActivity({
        eventName: data.eventName,
        currency: data.currency,
        currentAmount: data.currentAmount,
        expenseCount: data.expenseCount,
        lastUpdate: new Date().toISOString(),
      });

      this.activityId = activityId;
    } catch (error) {
      // Start failed
    }
  }

  /**
   * Actualiza una Live Activity existente
   */
  static async updateActivity(data: Partial<LiveActivityData>): Promise<void> {
    if (!this.activityId || !LiveActivityModule) {
      return;
    }

    try {
      await LiveActivityModule.updateActivity(this.activityId, {
        currentAmount: data.currentAmount,
        expenseCount: data.expenseCount,
        lastUpdate: new Date().toISOString(),
      });
    } catch (error) {
      // Update failed
    }
  }

  /**
   * Detiene la Live Activity
   */
  static async endActivity(): Promise<void> {
    if (!this.activityId || !LiveActivityModule) {
      return;
    }

    try {
      await LiveActivityModule.endActivity(this.activityId);
      this.activityId = null;
      
    } catch (error) {
      
    }
  }

  /**
   * Verifica si Live Activities están soportadas
   */
  static isSupported(): boolean {
    if (Platform.OS !== 'ios') return false;
    // En iOS, Platform.Version es string como "16.1.2"
    const version = parseFloat(String(Platform.Version));
    return version >= 16.1;
  }
}

// ==========================================
// NATIVE MODULE BRIDGE - LiveActivityModule.swift
// ==========================================

/*
import Foundation
import ActivityKit

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
    
    private var currentActivity: Activity<ExpenseActivityAttributes>?
    
    @objc
    func startActivity(_ data: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            reject("NOT_ENABLED", "Live Activities no están habilitadas", nil)
            return
        }
        
        let attributes = ExpenseActivityAttributes(
            eventName: data["eventName"] as? String ?? "",
            currency: data["currency"] as? String ?? "€"
        )
        
        let contentState = ExpenseActivityAttributes.ContentState(
            currentAmount: data["currentAmount"] as? Double ?? 0.0,
            expenseCount: data["expenseCount"] as? Int ?? 0,
            lastUpdate: Date()
        )
        
        do {
            let activity = try Activity<ExpenseActivityAttributes>.request(
                attributes: attributes,
                contentState: contentState,
                pushType: nil
            )
            
            currentActivity = activity
            resolve(activity.id)
        } catch {
            reject("START_ERROR", error.localizedDescription, error)
        }
    }
    
    @objc
    func updateActivity(_ activityId: String, data: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        guard let activity = currentActivity else {
            reject("NO_ACTIVITY", "No hay actividad activa", nil)
            return
        }
        
        let contentState = ExpenseActivityAttributes.ContentState(
            currentAmount: data["currentAmount"] as? Double ?? 0.0,
            expenseCount: data["expenseCount"] as? Int ?? 0,
            lastUpdate: Date()
        )
        
        Task {
            await activity.update(using: contentState)
            resolve(true)
        }
    }
    
    @objc
    func endActivity(_ activityId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        guard let activity = currentActivity else {
            reject("NO_ACTIVITY", "No hay actividad activa", nil)
            return
        }
        
        Task {
            await activity.end(dismissalPolicy: .immediate)
            currentActivity = nil
            resolve(true)
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
*/

// ==========================================
// BRIDGE HEADER - LiveActivityModule.m
// ==========================================

/*
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityModule, NSObject)

RCT_EXTERN_METHOD(startActivity:(NSDictionary *)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateActivity:(NSString *)activityId
                  data:(NSDictionary *)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(endActivity:(NSString *)activityId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
*/

export default LiveActivitiesManager;
