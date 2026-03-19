# ✅ CHECKLIST DE PRUEBAS - LessMo Features Avanzadas

## 📱 PARA PROBAR **AHORA** EN EXPO GO

### 1. Atajos de Siri ✅

#### Instrucciones de Prueba:
```bash
# 1. Asegúrate de que la app esté corriendo
npm start

# 2. En tu iPhone con Expo Go, ve a:
Settings → Atajos de Siri → Ver instrucciones
```

#### Checklist:
- [ ] Abrir app en Expo Go
- [ ] Ir a Settings → Atajos de Siri
- [ ] Leer lista de atajos disponibles
- [ ] Cerrar app

**Crear atajo manualmente** (iOS):
- [ ] Abrir app "Atajos" nativa de iOS
- [ ] Tocar "+" para crear nuevo atajo
- [ ] Buscar y añadir "Abrir URL"
- [ ] Pegar URL: `lessmo://add-expense`
- [ ] Darle nombre: "Añadir gasto LessMo"
- [ ] Guardar atajo

**Probar atajo**:
- [ ] Decir: "Hey Siri, Añadir gasto LessMo"
- [ ] Verificar que abre la app
- [ ] Verificar que navega a Home

**Otros atajos para probar**:
- [ ] `lessmo://summary` → Ver resumen
- [ ] `lessmo://create-event` → Crear evento
- [ ] `lessmo://settings` → Abrir configuración

#### ✅ Resultado Esperado:
- App se abre automáticamente
- Navega a la pantalla correcta
- Funciona con "Hey Siri"

---

## 🏗️ PARA PROBAR EN **BUILD NATIVA** (Futuro)

### 2. Live Activities 📡

#### Requisitos:
- ✅ Apple Developer Account ($99/año)
- ✅ iPhone con iOS 16.1+
- ✅ Build nativa (EAS o Xcode)

#### Pasos de Implementación:
```bash
# 1. Hacer build
eas build --platform ios --profile development

# 2. Instalar en iPhone físico
# 3. Abrir Xcode
cd ios
open LessMo.xcworkspace

# 4. Crear ActivityKit Extension
# File → New → Target → Widget Extension
# Nombre: "ExpenseActivity"
# ✅ Include Configuration Intent

# 5. Copiar código Swift de:
# src/services/LiveActivities.ts (buscar sección SWIFT CODE)

# 6. Configurar App Groups:
# Target "LessMo" → Capabilities → + App Groups
# Añadir: group.com.lessmo.app
# 
# Target "ExpenseActivity" → Capabilities → + App Groups
# Añadir: group.com.lessmo.app

# 7. Build y Run
# Seleccionar scheme "ExpenseActivity"
# Product → Run
```

#### Checklist de Prueba:
- [ ] Implementar código Swift completo
- [ ] Configurar App Groups
- [ ] Build exitoso en Xcode
- [ ] Abrir app en iPhone físico
- [ ] Ir a un evento existente
- [ ] Iniciar tracking (botón en EventDetail)
- [ ] Verificar que aparece en Lock Screen
- [ ] Añadir un gasto
- [ ] Verificar que actualiza en tiempo real
- [ ] En iPhone 14 Pro+: Ver en Dynamic Island
- [ ] Detener tracking

#### ✅ Resultado Esperado:
- Live Activity visible en Lock Screen
- Actualización automática al añadir gastos
- Dynamic Island muestra resumen (iPhone 14 Pro+)
- Contador de gastos en tiempo real

---

### 3. Face ID / Touch ID 🔐

#### Requisitos:
- ✅ Build nativa (EAS o Xcode)
- ✅ iPhone con Face ID o Touch ID configurado

#### Checklist de Prueba:

**Activación**:
- [ ] Build nativa instalada en iPhone
- [ ] Abrir app
- [ ] Ir a Settings
- [ ] Buscar sección "Preferencias"
- [ ] Ver switch "Face ID" o "Touch ID"
- [ ] Activar switch
- [ ] Confirmar con Face ID/Touch ID
- [ ] Verificar mensaje de éxito

**Uso**:
- [ ] Cerrar completamente la app
- [ ] Volver a abrir app
- [ ] Verificar pantalla de bloqueo aparece
- [ ] Autenticación se solicita automáticamente
- [ ] Face ID/Touch ID funciona correctamente
- [ ] App se desbloquea al autenticar

**Reintentos**:
- [ ] Cerrar y abrir app
- [ ] Fallar autenticación (voltear cara / dedo incorrecto)
- [ ] Tocar botón "Autenticar"
- [ ] Reintentar autenticación
- [ ] Verificar que funciona

**Desactivación**:
- [ ] En Settings, desactivar switch
- [ ] Cerrar y abrir app
- [ ] Verificar que NO pide autenticación
- [ ] App se abre directamente

#### ✅ Resultado Esperado:
- Face ID/Touch ID real funciona
- Pantalla de bloqueo aparece al abrir app
- Autenticación exitosa desbloquea app
- Se puede desactivar desde Settings

---

### 4. Widget iOS 📊

#### Requisitos:
- ✅ Apple Developer Account
- ✅ Build nativa con Xcode
- ✅ iOS 14+

#### Pasos de Implementación:
```bash
# 1. Abrir Xcode
cd ios
open LessMo.xcworkspace

# 2. Crear Widget Extension
# File → New → Target → Widget Extension
# Nombre: "ExpenseWidget"
# ✅ Include Configuration Intent

# 3. Copiar código Swift de:
# src/services/WidgetManager.ts (buscar sección SWIFT CODE)

# 4. Configurar App Groups (mismo proceso que Live Activities)

# 5. Build y Run
```

#### Checklist de Prueba:

**Añadir Widget**:
- [ ] Build nativa compilada
- [ ] En home screen, mantener presionado
- [ ] Tocar "+" en esquina superior
- [ ] Buscar "LessMo"
- [ ] Seleccionar "Gastos LessMo"
- [ ] Elegir tamaño: Small / Medium / Large
- [ ] Añadir a home screen

**Probar Small Widget**:
- [ ] Ver widget pequeño (2x2)
- [ ] Verificar logo "LessMo"
- [ ] Ver total del mes
- [ ] Ver número de gastos
- [ ] Verificar colores y diseño

**Probar Medium Widget**:
- [ ] Ver widget mediano (4x2)
- [ ] Ver total del mes (izquierda)
- [ ] Ver gastos de hoy (derecha)
- [ ] Ver botón "+ Añadir"
- [ ] Tocar botón → Verificar que abre app

**Probar Large Widget**:
- [ ] Ver widget grande (4x4)
- [ ] Ver resumen en header
- [ ] Ver "Gastos de Hoy" destacado
- [ ] Ver lista de últimos gastos
- [ ] Ver botón "Añadir Gasto"
- [ ] Tocar botón → Verificar deep link

**Actualización Automática**:
- [ ] Abrir app LessMo
- [ ] Añadir un gasto nuevo
- [ ] Esperar 1-2 minutos
- [ ] Verificar que widget actualiza
- [ ] Total incrementa correctamente
- [ ] Contador de gastos incrementa
- [ ] Gasto aparece en lista (Large)

**Reset Diario**:
- [ ] Verificar "Gastos de Hoy" al final del día
- [ ] Al día siguiente, verificar que resetea a 0
- [ ] Total del mes se mantiene

#### ✅ Resultado Esperado:
- Widget aparece en home screen
- 3 tamaños funcionan correctamente
- Actualización automática cada 15 min
- Deep links abren la app
- Diseño bonito con gradiente azul/morado

---

## 📊 RESUMEN DE COMPATIBILIDAD

| Feature | Expo Go | Build iOS | Build Android |
|---------|---------|-----------|---------------|
| **Atajos de Siri** | ✅ Sí | ✅ Sí | ❌ No |
| **Live Activities** | ❌ No | ✅ Sí (iOS 16.1+) | ❌ No |
| **Face ID/Touch ID** | 🟡 Simulado | ✅ Real | ✅ Real (Huella) |
| **Widget** | ❌ No | ✅ Sí (iOS 14+) | ❌ No |

---

## 🐛 TROUBLESHOOTING

### Problema: "Deep link no funciona"
**Síntomas**: Atajo de Siri no abre la app
**Solución**:
1. Verificar que app.config.js tiene `scheme: "lessmo"`
2. Rebuild la app si cambió
3. Verificar URL: `lessmo://` (con //)

### Problema: "Widget no aparece en lista"
**Síntomas**: No encuentro widget de LessMo
**Solución**:
1. Verificar que Widget Extension compiló correctamente
2. En Xcode: Product → Build (scheme "ExpenseWidget")
3. Reinstalar app si es necesario

### Problema: "Widget muestra 0.00 €"
**Síntomas**: Widget no muestra datos reales
**Solución**:
1. Abrir app y añadir un gasto
2. Esperar 1-2 minutos para actualización
3. Verificar App Groups configurado correctamente

### Problema: "Live Activity no aparece"
**Síntomas**: No veo nada en Lock Screen
**Solución**:
1. Verificar iOS 16.1+ en Settings → General → About
2. Verificar que ActivityKit extension compiló
3. Verificar permisos de notificaciones habilitados

### Problema: "Face ID pide contraseña"
**Síntomas**: No reconoce mi cara
**Solución**:
1. Settings → Face ID y código → Reiniciar Face ID
2. En app, desactivar y reactivar Face ID
3. Asegurar buena iluminación

---

## ✅ CHECKLIST COMPLETO

### Expo Go (AHORA):
- [ ] ✅ Probar Atajos de Siri
  - [ ] Ver instrucciones en Settings
  - [ ] Crear atajo manual
  - [ ] Probar con "Hey Siri"
  - [ ] Verificar deep links

### Build Nativa (DESPUÉS):
- [ ] 🏗️ Obtener Apple Developer ($99/año)
- [ ] 🏗️ Hacer build con EAS o Xcode
- [ ] 📡 Implementar Live Activities
  - [ ] Copiar código Swift
  - [ ] Configurar App Groups
  - [ ] Compilar extension
  - [ ] Testear en iPhone físico
- [ ] 📊 Implementar Widget
  - [ ] Copiar código Swift
  - [ ] Configurar App Groups
  - [ ] Compilar extension
  - [ ] Testear 3 tamaños
- [ ] 🔐 Testear Face ID/Touch ID
  - [ ] Activar en Settings
  - [ ] Probar autenticación
  - [ ] Verificar bloqueo funciona

---

## 📝 NOTAS IMPORTANTES

### Permisos Necesarios (iOS):

**Face ID** - Info.plist:
```xml
<key>NSFaceIDUsageDescription</key>
<string>Necesitamos Face ID para proteger tu información financiera</string>
```

**Notificaciones** - Para Live Activities:
```xml
<key>NSUserNotificationsUsageDescription</key>
<string>Recibe actualizaciones en tiempo real de tus gastos</string>
```

### App Groups:
- IMPORTANTE: Usar mismo nombre en todos los targets
- Formato: `group.com.lessmo.app`
- Configurar en:
  - Target principal "LessMo"
  - Widget Extension
  - Live Activity Extension

### Deep Links:
- Esquema: `lessmo://`
- Rutas disponibles:
  - `/add-expense`
  - `/summary`
  - `/create-event`
  - `/settings`

---

## 🎯 PRÓXIMA ACCIÓN

### ¿Qué hacer AHORA?

1. **En Expo Go**:
```bash
# Iniciar app
npm start

# En iPhone, abrir Settings de la app
# Ir a "Atajos de Siri"
# Seguir instrucciones para crear atajo
# Probar con "Hey Siri"
```

2. **Cuando tengas Build Nativa**:
- Seguir esta guía paso por paso
- Implementar una feature a la vez
- Testear exhaustivamente cada una
- Ajustar según feedback

---

**¡Todo listo para probar!** 🚀

---

**Última actualización**: 21 de Noviembre de 2024
