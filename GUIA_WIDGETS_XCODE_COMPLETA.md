# Guía Completa: Implementar Widgets Nativos iOS en LessMo

## 📱 Resumen
Esta guía detalla cómo agregar Widget Extensions nativas a la app LessMo para mostrar el balance y gastos del evento actual directamente en la pantalla de inicio de iOS.

## 🎯 Lo que vas a crear
- **Widget Small**: Balance del usuario con icono de evento
- **Widget Medium**: Balance + total de gastos + participantes
- **Widget Large**: Información completa del evento con estadísticas

## 🏗️ Arquitectura
```
LessMo/
├── ios/                                    (generado por expo prebuild)
│   ├── LessMo/
│   │   ├── LessMo.entitlements            ← Agregar App Groups aquí
│   │   └── Info.plist
│   └── LessMo.xcworkspace
├── ios-widget-config/                      ← Archivos de referencia (ya creados)
│   ├── LessmoWidget.swift                 ← Código del widget (420 líneas)
│   ├── Info.plist                         ← Configuración de la extensión
│   ├── LessmoWidget.entitlements          ← Permisos del widget
│   ├── app.plugin.js                      ← Plugin de Expo (opcional)
│   └── Assets.xcassets/
└── src/
    └── services/
        └── widgetDataService.ts           ← Ya existe, actualiza datos del widget
```

---

## 📋 PASO 1: Generar proyecto nativo iOS (15 min)

### 1.1. Limpiar proyecto
```bash
cd /Users/adanmonterotorres/Projects/LessMo/LessMo
rm -rf ios/
rm -rf node_modules/.expo
```

### 1.2. Generar carpeta ios/
```bash
npx expo prebuild --platform ios --clean
```

**Resultado esperado:**
```
✔ Created native projects | /ios
✔ Updated package.json
```

### 1.3. Verificar estructura
```bash
ls -la ios/
# Debes ver:
# - LessMo/
# - LessMo.xcworkspace
# - LessMo.xcodeproj
# - Pods/
```

---

## 📋 PASO 2: Configurar App Groups (5 min)

### 2.1. Abrir Xcode
```bash
open ios/LessMo.xcworkspace
```

⚠️ **IMPORTANTE**: Abre `.xcworkspace`, NO `.xcodeproj`

### 2.2. Configurar App Group en la app principal

1. En Xcode, selecciona el proyecto **LessMo** en el navegador izquierdo
2. Selecciona el target **LessMo** (NO LessmoWidget todavía)
3. Ve a la pestaña **Signing & Capabilities**
4. Click en **+ Capability**
5. Busca y agrega **App Groups**
6. Click en **+** dentro de App Groups
7. Escribe: `group.com.lessmo.app.widgets`
8. Click en **OK**

**Captura de referencia:**
```
┌─────────────────────────────────────┐
│ Signing & Capabilities             │
├─────────────────────────────────────┤
│ App Groups                          │
│ ☑ group.com.lessmo.app.widgets     │
└─────────────────────────────────────┘
```

### 2.3. Verificar archivo de entitlements

Xcode debería haber actualizado automáticamente `ios/LessMo/LessMo.entitlements`:

```bash
cat ios/LessMo/LessMo.entitlements
```

Debes ver:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.com.lessmo.app.widgets</string>
    </array>
    <!-- otras keys existentes -->
</dict>
</plist>
```

---

## 📋 PASO 3: Crear Widget Extension en Xcode (20 min)

### 3.1. Crear nuevo target de Widget

1. En Xcode, ve a **File → New → Target...**
2. Busca **Widget Extension**
3. Click en **Next**
4. Configura:
   - **Product Name**: `LessmoWidget`
   - **Team**: Tu equipo de Apple Developer
   - **Language**: Swift
   - **Project**: LessMo
   - **Embed in Application**: LessMo
   - **Include Configuration Intent**: ❌ NO marcar (no necesitamos configuración)
5. Click en **Finish**
6. Cuando pregunte "Activate LessmoWidget scheme?", click en **Activate**

### 3.2. Configurar Bundle Identifier

1. Selecciona el target **LessmoWidget**
2. Ve a **General**
3. Verifica que **Bundle Identifier** sea: `com.lessmo.app.LessmoWidget`
4. Verifica que **Team** esté seleccionado

### 3.3. Configurar App Group del Widget

1. Con el target **LessmoWidget** seleccionado
2. Ve a **Signing & Capabilities**
3. Click en **+ Capability**
4. Agrega **App Groups**
5. Marca: `group.com.lessmo.app.widgets` (el mismo que en la app principal)

### 3.4. Reemplazar código del Widget

Xcode creó `LessmoWidget/LessmoWidget.swift` con código de ejemplo. Reemplázalo:

1. Abre `LessmoWidget/LessmoWidget.swift` en Xcode
2. **Borra todo el contenido**
3. Copia el contenido de `ios-widget-config/LessmoWidget.swift` (420 líneas)
4. Pégalo en `LessmoWidget/LessmoWidget.swift`
5. Guarda (⌘S)

### 3.5. Configurar Info.plist del Widget

Xcode ya creó `LessmoWidget/Info.plist`. Verifica que contenga:

```xml
<key>NSExtension</key>
<dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
</dict>
```

Si falta, agrégalo manualmente.

### 3.6. Configurar Assets del Widget

1. En el navegador de Xcode, busca `LessmoWidget/Assets.xcassets`
2. Abre `AppIcon`
3. Arrastra el icono de la app (`assets/icon.png`) a cada tamaño
4. O copia los assets desde `ios-widget-config/Assets.xcassets/` si los creaste

---

## 📋 PASO 4: Configurar widgetDataService.ts (5 min)

El servicio ya existe en `src/services/widgetDataService.ts`. Verifica que contenga:

```typescript
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP_ID = 'group.com.lessmo.app.widgets';

export const updateWidgetData = async (data: {
  eventName: string;
  totalExpenses: number;
  userBalance: number;
  participantsCount: number;
}) => {
  try {
    await SharedGroupPreferences.setItem(
      'widgetData',
      data,
      APP_GROUP_ID
    );
    console.log('✓ Widget data updated:', data);
  } catch (error) {
    console.error('Error updating widget data:', error);
  }
};
```

### 4.1. Instalar dependencia

```bash
npm install react-native-shared-group-preferences
npx pod-install ios
```

### 4.2. Integrar en EventDetailScreen

El código ya está integrado en `src/screens/EventDetailScreen.tsx` (líneas ~150-160). Verifica que se llame a `updateWidgetData()` cuando cambien los datos del evento.

Si no está, agrégalo en `useEffect`:

```typescript
import { updateWidgetData } from '../services/widgetDataService';

useEffect(() => {
  if (event) {
    updateWidgetData({
      eventName: event.name,
      totalExpenses: calculateTotalExpenses(),
      userBalance: calculateUserBalance(),
      participantsCount: event.participants?.length || 0,
    });
  }
}, [event]);
```

---

## 📋 PASO 5: Compilar y probar (10 min)

### 5.1. Limpiar build de Xcode

En Xcode:
1. Menú **Product → Clean Build Folder** (⌘⇧K)
2. Espera a que termine

### 5.2. Seleccionar dispositivo

1. En la barra superior de Xcode, click en el selector de dispositivos
2. Selecciona tu iPhone físico (el widget NO funciona en simulador)

### 5.3. Compilar y ejecutar la app

1. Asegúrate de que el scheme **LessMo** esté seleccionado (no LessmoWidget)
2. Click en el botón **Play** (▶️) o presiona ⌘R
3. Espera a que compile e instale en tu iPhone
4. Desbloquea el iPhone y acepta permisos si solicita

**Tiempo estimado de compilación:** 3-5 minutos en la primera vez

### 5.4. Agregar Widget a la pantalla de inicio

En tu iPhone:

1. Ve a la pantalla de inicio
2. Mantén presionado un espacio vacío hasta que los iconos tiemblen
3. Click en el botón **+** (arriba a la izquierda)
4. Busca **LessMo** en la lista de widgets
5. Selecciona el tamaño que quieras:
   - **Small** (2x2): Solo balance
   - **Medium** (4x2): Balance + gastos + participantes
   - **Large** (4x4): Información completa
6. Click en **Add Widget**
7. Posiciona el widget donde quieras
8. Click en **Done**

### 5.5. Verificar datos del widget

1. Abre la app LessMo
2. Ve a un evento activo
3. Verifica que los datos se muestren en el widget (puede tardar ~15 segundos)
4. Si no se actualiza, cierra y abre la app de nuevo

---

## 🎨 Personalización

### Cambiar colores

Edita `LessmoWidget.swift`:

```swift
// Línea ~50 - Color del icono
.foregroundColor(.blue)  // Cambia a .green, .orange, etc.

// Línea ~75 - Color del balance positivo
.foregroundColor(entry.userBalance >= 0 ? .green : .red)
```

### Cambiar frecuencia de actualización

Edita `LessmoWidget.swift`, línea ~65:

```swift
// De 15 minutos a 5 minutos
let nextUpdate = Calendar.current.date(byAdding: .minute, value: 5, to: currentDate)!
```

⚠️ Menos tiempo = más consumo de batería

### Agregar más información

Edita `SimpleEntry` struct para incluir más campos:

```swift
struct SimpleEntry: TimelineEntry {
    let date: Date
    let eventName: String
    let totalExpenses: Double
    let userBalance: Double
    let participantsCount: Int
    let lastExpenseDate: Date  // ← Nuevo campo
}
```

Y actualiza `widgetDataService.ts` para enviar ese dato.

---

## 🐛 Solución de problemas

### Problema 1: "No such module WidgetKit"

**Causa:** Xcode no encuentra el framework
**Solución:**
1. Selecciona target **LessmoWidget**
2. Ve a **Build Phases → Link Binary With Libraries**
3. Click en **+**
4. Busca **WidgetKit.framework**
5. Agrégalo
6. Repite con **SwiftUI.framework**

### Problema 2: Widget muestra "No hay eventos" siempre

**Causa:** App Group no está compartiendo datos
**Solución:**
1. Verifica que ambos targets (LessMo y LessmoWidget) tengan el mismo App Group
2. Asegúrate de que `react-native-shared-group-preferences` esté instalado
3. Ejecuta: `npx pod-install ios`
4. Limpia y recompila en Xcode

### Problema 3: Widget no aparece en la lista

**Causa:** El widget no se instaló correctamente
**Solución:**
1. Desinstala la app del iPhone
2. En Xcode, limpia: **Product → Clean Build Folder**
3. Recompila y ejecuta
4. Reinicia el iPhone

### Problema 4: Error de firma de código

**Causa:** Certificado o provisioning profile incorrecto
**Solución:**
1. Ve a **Signing & Capabilities** en ambos targets
2. Selecciona **Automatically manage signing**
3. Selecciona tu Team
4. Espera a que Xcode descargue los perfiles

### Problema 5: Widget se actualiza muy lento

**Causa:** iOS controla la frecuencia de actualización para ahorrar batería
**Solución:**
- iOS actualiza widgets de apps usadas frecuentemente con más regularidad
- En desarrollo, fuerza la actualización abriendo y cerrando la app
- Reduce el intervalo de actualización en el código (línea ~65 de LessmoWidget.swift)

---

## 📊 Verificación final

Checklist para confirmar que todo funciona:

- [ ] `npx expo prebuild` completado sin errores
- [ ] Carpeta `ios/` existe con `.xcworkspace`
- [ ] App Group `group.com.lessmo.app.widgets` configurado en ambos targets
- [ ] Widget Extension creado y código Swift reemplazado (420 líneas)
- [ ] `react-native-shared-group-preferences` instalado
- [ ] App compila en Xcode sin errores
- [ ] Widget aparece en la lista de widgets del iPhone
- [ ] Widget muestra datos reales del evento actual
- [ ] Datos se actualizan al cambiar de evento en la app
- [ ] Los 3 tamaños (Small, Medium, Large) funcionan correctamente

---

## 🚀 Siguientes pasos

### Opción A: Publicar en App Store con widget

1. Incrementa versión en `app.config.js`:
   ```js
   version: "1.1.0",
   ios: {
     buildNumber: "2",
   }
   ```

2. Compila con EAS Build:
   ```bash
   eas build --platform ios --profile production
   ```

3. El widget se incluirá automáticamente en el build

### Opción B: Agregar más widgets

Puedes crear múltiples widgets en el mismo proyecto:

1. En Xcode, agrega otro Widget Extension (ej: `LessmoStatsWidget`)
2. Usa un Provider diferente para mostrar estadísticas globales
3. Comparte el mismo App Group

### Opción C: Configurar Live Activities

Las Live Activities son similares a los widgets pero más dinámicas:

- Ya existe `src/services/LiveActivities.ts` con implementación completa
- Requiere iOS 16.1+
- Se muestra en Lock Screen y Dynamic Island
- Ideal para eventos en tiempo real

---

## 📚 Recursos adicionales

- [Documentación de WidgetKit](https://developer.apple.com/documentation/widgetkit)
- [Tutorial de SwiftUI](https://developer.apple.com/tutorials/swiftui)
- [App Groups en iOS](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_security_application-groups)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)

---

## 💡 Notas importantes

1. **Los widgets NO funcionan en Expo Go** - Requieren compilación nativa
2. **iOS controla la frecuencia** - No puedes forzar actualizaciones cada segundo
3. **Batería** - Actualizaciones muy frecuentes consumen batería
4. **Tamaño de datos** - Limita los datos compartidos a lo esencial
5. **Testing** - Siempre prueba en dispositivo físico, no simulador
6. **App Groups** - Deben ser idénticos en app principal y widget
7. **Bundle ID** - El widget debe usar `.NombreDelWidget` al final del bundle ID de la app

---

## ✅ ¡Listo!

Ahora tienes widgets nativos completamente funcionales en tu app LessMo. Los usuarios pueden ver su balance y gastos directamente desde la pantalla de inicio sin abrir la app.

**Tiempo total estimado:** 55 minutos
- Paso 1: 15 min (generar proyecto nativo)
- Paso 2: 5 min (configurar App Groups)
- Paso 3: 20 min (crear Widget Extension)
- Paso 4: 5 min (configurar servicio de datos)
- Paso 5: 10 min (compilar y probar)
