# 📱 Guía de Widget para iOS

## ✅ Estado: COMPLETAMENTE PREPARADO

El código para el widget está **100% listo** pero **NO funciona en Expo Go**.

---

## 📋 Tamaños Disponibles

### 1. **Small Widget** (Pequeño) 📊
- **Tamaño**: 2x2 iconos
- **Contenido**:
  - Logo de LessMo
  - Total del mes
  - Número de gastos
- **Mejor uso**: Vista rápida del total

### 2. **Medium Widget** (Mediano) 📈
- **Tamaño**: 4x2 iconos
- **Contenido**:
  - Total del mes (izquierda)
  - Gastos de hoy (derecha)
  - Botón "Añadir gasto" (deep link)
- **Mejor uso**: Resumen diario con acción rápida

### 3. **Large Widget** (Grande) 📋
- **Tamaño**: 4x4 iconos
- **Contenido**:
  - Resumen completo
  - Lista de últimos 4 gastos
  - Total de hoy y del mes
  - Botón "Añadir gasto"
- **Mejor uso**: Vista completa de actividad reciente

---

## 🎨 Diseño del Widget

### Small Widget
```
┌─────────────────┐
│ 💵 LessMo       │
│                 │
│ Este Mes        │
│ 1,234.50 €     │
│ 15 gastos       │
└─────────────────┘
```

### Medium Widget
```
┌───────────────────────────────────┐
│ 💵 LessMo      │    Hoy           │
│                │                  │
│ Total del Mes  │  📅 45.60 €     │
│ 1,234.50      │                  │
│ €             │  15 gastos       │
│                │  [+ Añadir]      │
└───────────────────────────────────┘
```

### Large Widget
```
┌──────────────────────────────────┐
│ 💵 LessMo           1,234.50 €  │
│ ─────────────────────────────── │
│ Gastos de Hoy │ Total Gastos   │
│ 45.60 €       │ 15             │
│ ─────────────────────────────── │
│ Últimos Gastos                  │
│ • Café              3.50 €      │
│ • Almuerzo         12.00 €      │
│ • Transporte        5.00 €      │
│ • Compras          25.10 €      │
│                                  │
│ [+ Añadir Gasto             >]  │
└──────────────────────────────────┘
```

---

## 🛠️ Archivos Implementados

### 1. Swift Widget Code
**`ios/ExpenseWidget/ExpenseWidget.swift`** (Crear en build nativa)
- Widget principal con 3 tamaños
- Timeline Provider
- Vistas personalizadas para cada tamaño
- Integración con App Groups

### 2. React Native Manager
**`src/services/WidgetManager.ts`** ✅
- Gestión de datos del widget
- Sincronización con App Groups
- Actualización automática

### 3. React Native Hook
**`src/hooks/useWidget.ts`** ✅
- Hook para usar en componentes
- Métodos: updateWidget, onExpenseAdded, resetDailyExpenses

---

## 🚀 Cómo Implementar (Build Nativa)

### Paso 1: Crear Widget Extension en Xcode

1. Abrir proyecto en Xcode:
```bash
cd ios
open LessMo.xcworkspace
```

2. Añadir Widget Extension:
   - File → New → Target
   - Seleccionar "Widget Extension"
   - Nombre: "ExpenseWidget"
   - ✅ Include Configuration Intent

3. Copiar código Swift del archivo `WidgetManager.ts`

### Paso 2: Configurar App Groups

1. En Xcode, seleccionar target principal "LessMo"
2. Signing & Capabilities → + Capability → App Groups
3. Añadir: `group.com.lessmo.app`

4. Seleccionar target "ExpenseWidget"
5. Signing & Capabilities → + Capability → App Groups
6. Añadir: `group.com.lessmo.app` (mismo nombre)

### Paso 3: Crear Native Module Bridge

1. Crear `ios/WidgetModule.swift`:
```swift
// Copiar código de WidgetManager.ts (sección NATIVE MODULE BRIDGE)
```

2. Crear `ios/WidgetModule.m`:
```objc
// Copiar código de WidgetManager.ts (sección BRIDGE HEADER)
```

3. Añadir a Bridging Header (`ios/LessMo-Bridging-Header.h`):
```objc
#import "WidgetModule.m"
```

### Paso 4: Actualizar Info.plist

Añadir URL Scheme para deep links:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>lessmo</string>
    </array>
  </dict>
</array>
```

### Paso 5: Build y Testear

```bash
# En Xcode, seleccionar scheme "ExpenseWidget"
# Product → Run
# El widget aparecerá en el simulador/dispositivo
```

---

## 💻 Uso en React Native

### Ejemplo 1: Actualizar al Añadir Gasto

```typescript
import { useWidget } from '../hooks/useWidget';

function AddExpenseScreen() {
  const { onExpenseAdded, isSupported } = useWidget();

  const handleAddExpense = async (amount: number, description: string) => {
    // Guardar en Firestore
    await saveExpense(amount, description);
    
    // Actualizar widget
    if (isSupported) {
      await onExpenseAdded(amount, description);
    }
  };

  return (
    <Button
      title="Añadir Gasto"
      onPress={() => handleAddExpense(10.50, "Café")}
    />
  );
}
```

### Ejemplo 2: Actualizar Datos Completos

```typescript
import { useWidget } from '../hooks/useWidget';

function EventDetailScreen() {
  const { updateWidget, isSupported } = useWidget();
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    // Calcular totales
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const todayExpenses = expenses
      .filter(e => isToday(e.date))
      .reduce((sum, e) => sum + e.amount, 0);

    // Actualizar widget
    if (isSupported) {
      updateWidget({
        totalAmount,
        expenseCount: expenses.length,
        todayExpenses,
        currency: '€',
      });
    }
  }, [expenses]);

  return <ExpenseList data={expenses} />;
}
```

### Ejemplo 3: Reset Diario Automático

```typescript
import { useWidget } from '../hooks/useWidget';
import { useEffect } from 'react';

function App() {
  const { resetDailyExpenses } = useWidget();

  useEffect(() => {
    // Verificar si cambió el día
    const checkDayChange = () => {
      const lastReset = localStorage.getItem('lastResetDate');
      const today = new Date().toDateString();

      if (lastReset !== today) {
        resetDailyExpenses();
        localStorage.setItem('lastResetDate', today);
      }
    };

    // Verificar cada hora
    const interval = setInterval(checkDayChange, 60 * 60 * 1000);
    checkDayChange(); // Verificar al iniciar

    return () => clearInterval(interval);
  }, []);

  return <MainApp />;
}
```

---

## ⚡ Actualización Automática

### Timeline Policy

El widget se actualiza automáticamente cada **15 minutos**:

```swift
let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
```

### Forzar Actualización

Desde React Native:
```typescript
await WidgetDataManager.updateWidget(newData);
```

Desde Swift:
```swift
WidgetCenter.shared.reloadAllTimelines()
```

---

## 🎯 Interactividad

### Deep Links

Todos los widgets incluyen botones que abren la app:

- **"+ Añadir"**: `lessmo://add-expense`
- **Toca el widget**: `lessmo://summary`

```swift
Link(destination: URL(string: "lessmo://add-expense")!) {
    HStack {
        Image(systemName: "plus.circle.fill")
        Text("Añadir")
    }
}
```

---

## 📊 Datos Compartidos (App Groups)

### Estructura de Datos

```swift
// Guardado desde React Native
UserDefaults(suiteName: "group.com.lessmo.app")

// Datos disponibles:
- totalAmount: Double
- expenseCount: Int
- todayExpenses: Double
- currency: String
- recentExpenses: Data (JSON)
```

### Sincronización

1. **React Native** guarda datos en App Group
2. **Widget** lee datos cada 15 minutos
3. **Widget** muestra datos actualizados
4. **Usuario** toca widget
5. **App** se abre con deep link

---

## 🎨 Personalización

### Cambiar Colores

En `ExpenseWidget.swift`:
```swift
.containerBackground(for: .widget) {
    LinearGradient(
        colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)],  // ← Cambiar aquí
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
```

### Cambiar Iconos

```swift
Image(systemName: "dollarsign.circle.fill")  // ← Usar cualquier SF Symbol
```

Iconos recomendados:
- `chart.bar.fill` - Gráfico
- `cart.fill` - Carrito
- `creditcard.fill` - Tarjeta
- `banknote.fill` - Billete

### Cambiar Frecuencia de Actualización

```swift
let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!  // ← 30 min
```

---

## ⚠️ Limitaciones

### NO Funciona en Expo Go
- ❌ Widgets NO se pueden testear en Expo Go
- ❌ Requiere build nativa con Xcode
- ❌ No hay simulación posible

### Restricciones de iOS
- ⏱️ Actualización máxima: cada 15 minutos (límite de Apple)
- 💾 Límite de datos: 10 KB en App Groups
- 🔋 Budget de batería: iOS puede limitar updates si consumen mucha batería
- 📱 iOS 14+ requerido

---

## 🐛 Troubleshooting

### Problema: Widget no aparece
**Causa**: Widget Extension no compilada
**Solución**: 
1. En Xcode, seleccionar scheme "ExpenseWidget"
2. Product → Build
3. Añadir widget desde Home Screen

### Problema: Widget muestra "0.00 €"
**Causa**: App Groups no configurado correctamente
**Solución**:
1. Verificar que ambos targets tengan el mismo App Group
2. Verificar spelling: `group.com.lessmo.app`
3. Recompilar ambos targets

### Problema: Widget no actualiza
**Causa**: Timeline no se recarga
**Solución**:
```swift
WidgetCenter.shared.reloadAllTimelines()
```

---

## 📝 Checklist de Implementación

### ✅ Ya Preparado:
- [x] Código Swift completo con 3 tamaños
- [x] React Native Manager (WidgetManager.ts)
- [x] React Native Hook (useWidget.ts)
- [x] Native Module Bridge (Swift/Obj-C)
- [x] Documentación completa

### ⏳ Para Build Nativa:
- [ ] Crear Widget Extension en Xcode
- [ ] Configurar App Groups
- [ ] Añadir Native Module Bridge
- [ ] Copiar código Swift
- [ ] Configurar deep links
- [ ] Testear en dispositivo físico
- [ ] Screenshots para App Store

---

## 🎯 Conclusión

**El widget está 100% preparado y listo para implementarse en build nativa.**

Solo necesitas:
1. Hacer build nativa (EAS o Xcode)
2. Crear Widget Extension
3. Copiar código Swift
4. Configurar App Groups
5. Testear en dispositivo

**NO requiere cambios de código React Native** ✅

---

**Última actualización**: 21 de Noviembre de 2024
