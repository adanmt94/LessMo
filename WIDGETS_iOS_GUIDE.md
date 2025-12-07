# 📱 GUÍA DE IMPLEMENTACIÓN DE WIDGETS iOS - Les$Mo

## 🎯 Objetivo

Implementar widgets para la pantalla de inicio de iOS que muestren información rápida de:
- Resumen de gastos del mes
- Balance actual
- Próximos pagos pendientes
- Gastos recientes

## 📋 Tamaños de Widgets iOS

iOS soporta 3 tamaños de widgets:

### 1. **Small (Pequeño)** - 2x2 cuadrículas
- Dimensiones: ~155x155 pts
- Contenido: Balance total o gasto del mes
- Actualización: Cada 15-30 minutos

### 2. **Medium (Mediano)** - 4x2 cuadrículas
- Dimensiones: ~329x155 pts
- Contenido: Balance + gráfico simple + últimos 2 gastos
- Actualización: Cada 15-30 minutos

### 3. **Large (Grande)** - 4x4 cuadrículas
- Dimensiones: ~329x345 pts
- Contenido: Balance + gráfico + últimos 5 gastos + deudas
- Actualización: Cada 15-30 minutos

## 🛠️ OPCIÓN 1: Usando Expo Config Plugin (Recomendado)

Expo 50+ tiene soporte para widgets iOS usando App Intents.

### Paso 1: Instalar dependencias

```bash
npx expo install expo-quick-actions react-native-widget-extension
```

### Paso 2: Configurar app.config.js

```javascript
export default {
  expo: {
    // ... configuración existente
    plugins: [
      [
        "react-native-widget-extension",
        {
          ios: {
            widgets: [
              {
                name: "BalanceWidget",
                displayName: "Balance Les$Mo",
                description: "Ve tu balance actual",
                families: ["systemSmall", "systemMedium", "systemLarge"]
              }
            ]
          }
        }
      ]
    ]
  }
};
```

### Paso 3: Crear servicio de datos del widget

Archivo: `src/services/widgetDataService.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserBalance, getRecentExpenses } from './firebase';

export interface WidgetData {
  balance: number;
  currency: string;
  monthTotal: number;
  recentExpenses: Array<{
    description: string;
    amount: number;
    date: string;
  }>;
  lastUpdate: string;
}

const WIDGET_DATA_KEY = '@LessMo:widget_data';

/**
 * Actualizar datos para widgets
 * Llamar después de cada cambio en gastos/balance
 */
export async function updateWidgetData(userId: string): Promise<void> {
  try {
    // Obtener datos actualizados
    const balance = await getUserBalance(userId);
    const recentExpenses = await getRecentExpenses(userId, 5);
    
    // Calcular total del mes
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExpenses = recentExpenses.filter(e => 
      new Date(e.date) >= monthStart
    );
    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const widgetData: WidgetData = {
      balance: balance.total,
      currency: 'EUR',
      monthTotal,
      recentExpenses: recentExpenses.slice(0, 5).map(e => ({
        description: e.description,
        amount: e.amount,
        date: e.date.toISOString()
      })),
      lastUpdate: new Date().toISOString()
    };

    // Guardar para widgets
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));
    
    // Notificar a los widgets que hay datos nuevos
    if (Platform.OS === 'ios') {
      // Usar expo-quick-actions o native module para refrescar
    }
  } catch (error) {
    console.error('Error actualizando datos del widget:', error);
  }
}

/**
 * Obtener datos actuales para widgets
 */
export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error obteniendo datos del widget:', error);
    return null;
  }
}
```

### Paso 4: Integrar en la app

Actualizar `src/hooks/useExpenses.ts` para refrescar widgets:

```typescript
import { updateWidgetData } from '../services/widgetDataService';
import { useAuth } from './useAuth';

export const useExpenses = (eventId: string) => {
  const { user } = useAuth();
  
  const addExpense = async (...args) => {
    // ... código existente
    
    // Actualizar datos del widget
    if (user?.uid) {
      await updateWidgetData(user.uid);
    }
    
    return result;
  };
  
  // Similar para editExpense, deleteExpense, etc.
};
```

## 🛠️ OPCIÓN 2: Desarrollo Nativo con Swift (Completo)

Para control total, necesitas crear widgets nativos en Swift.

### Estructura de archivos (iOS native):

```
ios/
├── LessMo/
└── LessMoWidget/                    # Target nuevo
    ├── LessMoWidget.swift           # Widget principal
    ├── BalanceWidgetView.swift      # Vista del widget
    ├── WidgetDataProvider.swift     # Proveedor de datos
    ├── Assets.xcassets/             # Recursos del widget
    └── Info.plist
```

### Código Swift para Widget Small

```swift
// LessMoWidget.swift
import WidgetKit
import SwiftUI

struct BalanceWidget: Widget {
    let kind: String = "BalanceWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BalanceProvider()) { entry in
            BalanceWidgetView(entry: entry)
        }
        .configurationDisplayName("Balance Les$Mo")
        .description("Ve tu balance actual en tiempo real")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct BalanceEntry: TimelineEntry {
    let date: Date
    let balance: Double
    let currency: String
    let monthTotal: Double
    let recentExpenses: [Expense]
}

struct BalanceProvider: TimelineProvider {
    func placeholder(in context: Context) -> BalanceEntry {
        BalanceEntry(
            date: Date(),
            balance: 1250.50,
            currency: "EUR",
            monthTotal: 450.00,
            recentExpenses: []
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (BalanceEntry) -> ()) {
        // Cargar datos desde App Groups
        let data = loadWidgetData()
        let entry = BalanceEntry(
            date: Date(),
            balance: data.balance,
            currency: data.currency,
            monthTotal: data.monthTotal,
            recentExpenses: data.expenses
        )
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let data = loadWidgetData()
        let entry = BalanceEntry(
            date: Date(),
            balance: data.balance,
            currency: data.currency,
            monthTotal: data.monthTotal,
            recentExpenses: data.expenses
        )
        
        // Actualizar cada 15 minutos
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// Vista Small Widget
struct BalanceWidgetSmallView: View {
    var entry: BalanceEntry
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "6366F1"), Color(hex: "8B5CF6")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Balance")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.8))
                
                Spacer()
                
                Text(formatCurrency(entry.balance, entry.currency))
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.white)
                
                Text("Este mes: \(formatCurrency(entry.monthTotal, entry.currency))")
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.7))
            }
            .padding()
        }
    }
}

// Vista Medium Widget
struct BalanceWidgetMediumView: View {
    var entry: BalanceEntry
    
    var body: some View {
        HStack(spacing: 12) {
            // Balance (lado izquierdo)
            VStack(alignment: .leading, spacing: 8) {
                Text("Balance")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(formatCurrency(entry.balance, entry.currency))
                    .font(.system(size: 28, weight: .bold))
                
                Text("Este mes")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Text(formatCurrency(entry.monthTotal, entry.currency))
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.blue)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.blue.opacity(0.1))
            )
            
            // Gastos recientes (lado derecho)
            VStack(alignment: .leading, spacing: 4) {
                Text("Recientes")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                ForEach(entry.recentExpenses.prefix(2)) { expense in
                    HStack {
                        Text(expense.description)
                            .font(.caption)
                            .lineLimit(1)
                        Spacer()
                        Text(formatCurrency(expense.amount, entry.currency))
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
            }
            .padding()
        }
    }
}

// Vista Large Widget
struct BalanceWidgetLargeView: View {
    var entry: BalanceEntry
    
    var body: some View {
        VStack(spacing: 12) {
            // Header con balance
            HStack {
                VStack(alignment: .leading) {
                    Text("Balance Total")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatCurrency(entry.balance, entry.currency))
                        .font(.system(size: 32, weight: .bold))
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Este mes")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatCurrency(entry.monthTotal, entry.currency))
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.blue.opacity(0.1))
            )
            
            // Últimos gastos
            VStack(alignment: .leading, spacing: 8) {
                Text("Últimos Gastos")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                ForEach(entry.recentExpenses.prefix(5)) { expense in
                    HStack {
                        Text(expense.description)
                            .font(.system(size: 14))
                            .lineLimit(1)
                        Spacer()
                        Text(formatCurrency(expense.amount, entry.currency))
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.red)
                    }
                    .padding(.vertical, 2)
                }
            }
            .padding()
        }
    }
}

// Helper para formato de moneda
func formatCurrency(_ amount: Double, _ currency: String) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = currency
    return formatter.string(from: NSNumber(value: amount)) ?? "€0.00"
}
```

### App Groups para compartir datos

En Xcode, habilitar App Groups:
1. Target principal → Signing & Capabilities → + App Groups
2. Crear grupo: `group.com.lessmo.app`
3. Repetir para el target del widget

Guardar datos compartidos:

```swift
// En la app principal (React Native bridge)
func saveWidgetData(balance: Double, monthTotal: Double, expenses: [Expense]) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.lessmo.app")
    
    let data: [String: Any] = [
        "balance": balance,
        "monthTotal": monthTotal,
        "currency": "EUR",
        "expenses": expenses.map { $0.toDictionary() },
        "lastUpdate": Date().timeIntervalSince1970
    ]
    
    sharedDefaults?.set(data, forKey: "widgetData")
    
    // Refrescar widgets
    WidgetCenter.shared.reloadAllTimelines()
}
```

## 📦 PASO A PASO: Implementación Rápida

### 1. Preparar el proyecto para widgets

```bash
cd ios
pod install
open LessMo.xcworkspace
```

### 2. Crear Widget Target en Xcode

1. File → New → Target
2. Seleccionar "Widget Extension"
3. Nombre: "LessMoWidget"
4. Bundle ID: `com.lessmo.app.LessMoWidget`
5. Desmarcar "Include Configuration Intent"

### 3. Agregar App Group

- Target principal: Signing & Capabilities → + App Groups → `group.com.lessmo.app`
- Widget target: Repetir el mismo paso

### 4. Copiar código Swift

Copiar los archivos `.swift` del código anterior al target del widget.

### 5. Agregar React Native bridge

Crear `src/modules/WidgetBridge.ts`:

```typescript
import { NativeModules, Platform } from 'react-native';

const { WidgetModule } = NativeModules;

export const WidgetBridge = {
  /**
   * Actualizar datos del widget
   */
  async updateWidgetData(data: {
    balance: number;
    monthTotal: number;
    currency: string;
    recentExpenses: Array<{
      description: string;
      amount: number;
      date: string;
    }>;
  }): Promise<void> {
    if (Platform.OS !== 'ios') return;
    
    try {
      await WidgetModule.updateWidgetData(data);
    } catch (error) {
      console.error('Error updating widget:', error);
    }
  },
  
  /**
   * Refrescar todos los widgets
   */
  async refreshWidgets(): Promise<void> {
    if (Platform.OS !== 'ios') return;
    
    try {
      await WidgetModule.refreshWidgets();
    } catch (error) {
      console.error('Error refreshing widgets:', error);
    }
  }
};
```

### 6. Integrar en la app

```typescript
// En useExpenses.ts o después de cada operación
import { WidgetBridge } from '../modules/WidgetBridge';

const addExpense = async (...) => {
  // ... código existente
  
  // Actualizar widget
  const balance = await getUserBalance(user.uid);
  const monthExpenses = await getMonthExpenses(user.uid);
  const recentExpenses = await getRecentExpenses(user.uid, 5);
  
  await WidgetBridge.updateWidgetData({
    balance: balance.total,
    monthTotal: monthExpenses.reduce((s, e) => s + e.amount, 0),
    currency: 'EUR',
    recentExpenses
  });
};
```

## 🎨 Diseño de los Widgets

### Colores
- Gradiente principal: `#6366F1` → `#8B5CF6`
- Texto primario: Blanco
- Texto secundario: Blanco 70% opacidad
- Background positivo: Verde `#10B981`
- Background negativo: Rojo `#EF4444`

### Tipografía
- Title: SF Pro Display Bold 32pt
- Balance: SF Pro Display Bold 28pt
- Subtitle: SF Pro Text Regular 14pt
- Caption: SF Pro Text Regular 12pt

## 🔄 Actualización de Widgets

Los widgets se actualizan:
1. **Automáticamente**: Cada 15-30 minutos (iOS decide)
2. **Manual**: Al abrir la app
3. **Después de acciones**: Al añadir/editar/eliminar gastos

```typescript
// En App.tsx o en el contexto principal
useEffect(() => {
  // Actualizar widgets al abrir la app
  WidgetBridge.refreshWidgets();
}, []);
```

## 📱 Testing

### En simulador
1. Build del target del widget
2. Cmd+Shift+I para instalar
3. Long press en pantalla de inicio
4. Agregar widget "Les$Mo"

### En dispositivo físico
1. Build a dispositivo
2. Long press en pantalla de inicio
3. Agregar widget

## 🚀 Deploy

```bash
# 1. Build con EAS
eas build --platform ios

# 2. El widget se incluirá automáticamente en el build
```

## 📝 Notas Importantes

- **App Groups**: Imprescindible para compartir datos
- **Timeline Policy**: iOS controla cuándo actualizar
- **Background Refresh**: Debe estar habilitado
- **Battery Optimization**: iOS puede limitar actualizaciones
- **Size Limits**: Widgets tienen límite de memoria (≈30MB)

## 🔗 Referencias

- [Apple - WidgetKit](https://developer.apple.com/documentation/widgetkit)
- [Expo - Home Screen Widgets](https://docs.expo.dev/guides/home-screen-widgets/)
- [React Native Widget Extension](https://github.com/octoxlabs/react-native-widget-extension)
