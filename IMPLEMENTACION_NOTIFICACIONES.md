# Sistema de Notificaciones - LessMo ✅

## Resumen

Se ha implementado un sistema completo de notificaciones push utilizando `expo-notifications` para mantener a los usuarios informados sobre gastos y liquidaciones.

---

## 🔔 Funcionalidades Implementadas

### 1. **Servicio de Notificaciones**

**Archivo**: `src/services/notificationService.ts`

**Características:**
- ✅ Solicitud de permisos de notificaciones
- ✅ Configuración de canales de Android
- ✅ Generación de tokens push
- ✅ Notificaciones locales programables
- ✅ Persistencia de preferencias

**Funciones principales:**
```typescript
// Solicitar permisos
await requestNotificationPermissions();

// Habilitar/deshabilitar notificaciones
await setNotificationsEnabled(true);

// Notificar nuevo gasto
await scheduleExpenseReminder(eventName, amount, currency);

// Notificar liquidación pendiente
await scheduleSettlementReminder(eventName, owedBy, owedTo, amount, currency);

// Recordatorio diario de deudas
await scheduleDailyDebtReminder(totalDebt, currency, eventsWithDebt);

// Cancelar todas las notificaciones
await cancelAllNotifications();
```

---

### 2. **Hook de Notificaciones**

**Archivo**: `src/hooks/useNotifications.ts`

**Características:**
- ✅ Estado de notificaciones habilitadas/deshabilitadas
- ✅ Toggle de notificaciones con validación de permisos
- ✅ Listeners para notificaciones recibidas
- ✅ Manejo de interacciones del usuario
- ✅ Funciones helper para enviar notificaciones

**Uso:**
```typescript
const {
  notificationsEnabled,
  isLoading,
  toggleNotifications,
  notifyNewExpense,
  notifySettlement,
  notifyDailyDebts,
} = useNotifications();

// Cambiar estado
await toggleNotifications(true);

// Enviar notificación
await notifyNewExpense('Viaje a Madrid', 50, 'EUR');
```

---

### 3. **Integración en SettingsScreen**

**Actualizado**: `src/screens/SettingsScreen.tsx`

**Características:**
- ✅ Switch funcional para habilitar/deshabilitar notificaciones
- ✅ Solicita permisos al activar
- ✅ Cancela notificaciones al desactivar
- ✅ Indica estado de carga
- ✅ Mensajes informativos si se niegan permisos

**UI:**
```tsx
<SettingItem
  icon="🔔"
  title="Notificaciones"
  subtitle="Alertas de gastos y liquidaciones"
  rightElement={
    <Switch
      value={notificationsEnabled}
      onValueChange={toggleNotifications}
      disabled={isLoading}
    />
  }
/>
```

---

### 4. **Integración en AddExpenseScreen**

**Actualizado**: `src/screens/AddExpenseScreen.tsx`

**Características:**
- ✅ Notifica automáticamente al agregar un gasto nuevo
- ✅ No notifica en modo edición
- ✅ Respeta la preferencia del usuario
- ✅ Incluye información del evento y monto

**Flujo:**
1. Usuario agrega un gasto
2. Se guarda exitosamente en Firebase
3. Si las notificaciones están habilitadas:
   - Se envía notificación local
   - Incluye nombre del evento, monto y moneda
4. Usuario recibe notificación inmediata

---

## 📱 Tipos de Notificaciones

### 1. Nuevo Gasto
**Trigger**: Inmediato al agregar un gasto  
**Contenido**:
- Título: "💸 Nuevo gasto en [Evento]"
- Cuerpo: "Se agregó un gasto de [monto] [moneda]"
- Datos: Tipo "expense", nombre del evento

### 2. Liquidación Pendiente
**Trigger**: 24 horas después de crear el gasto  
**Contenido**:
- Título: "💰 Liquidación pendiente"
- Cuerpo: "[Persona] debe [monto] [moneda] a [Persona] en [Evento]"
- Datos: Tipo "settlement", nombre del evento

### 3. Recordatorio Diario
**Trigger**: Todos los días a las 20:00 (8 PM)  
**Contenido**:
- Título: "📊 Resumen de deudas"
- Cuerpo: "Tienes [monto] [moneda] pendientes en [n] evento(s)"
- Datos: Tipo "daily_reminder"

---

## ⚙️ Configuración

### app.json

```json
{
  "notification": {
    "icon": "./assets/icon.png",
    "color": "#6366F1",
    "androidMode": "default",
    "androidCollapsedTitle": "LessMo"
  },
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["remote-notification"]
    }
  },
  "android": {
    "permissions": [
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "POST_NOTIFICATIONS"
    ],
    "useNextNotificationsApi": true
  }
}
```

---

## 🔐 Permisos

### iOS
- Solicita permisos automáticamente al activar
- El usuario puede aceptar o denegar
- Si deniega, se muestra alerta informativa

### Android
- Android 13+: Requiere permiso POST_NOTIFICATIONS
- Crea canal de notificaciones con:
  - Importancia: MAX
  - Vibración: [0, 250, 250, 250]
  - Color: #6366F1 (Indigo)
  - Sonido: Activado

---

## 💾 Persistencia

**AsyncStorage Keys:**
- `@LessMo:notificationsEnabled` - Estado on/off
- `@LessMo:pushToken` - Token para notificaciones push

**Comportamiento:**
- Las preferencias persisten entre sesiones
- Al reinstalar, se solicitan permisos nuevamente
- Los tokens se regeneran si cambian

---

## 🎯 Casos de Uso

### Habilitar Notificaciones
1. Usuario va a ⚙️ Ajustes
2. Activa switch "Notificaciones"
3. Sistema solicita permisos
4. Usuario acepta
5. Se genera token push
6. Se guarda preferencia

### Agregar Gasto con Notificación
1. Usuario agrega gasto en evento
2. Gasto se guarda exitosamente
3. Si notificaciones están habilitadas:
   - Se envía notificación inmediata
   - Otros participantes (futura implementación push)

### Desactivar Notificaciones
1. Usuario desactiva switch
2. Se cancelan todas las notificaciones programadas
3. Se guarda preferencia como deshabilitado
4. No se envían más notificaciones

---

## 🚀 Mejoras Futuras (Opcionales)

### Notificaciones Push Remotas
- Configurar Firebase Cloud Messaging (FCM)
- Enviar notificaciones desde servidor
- Notificar a todos los participantes de un evento
- Sincronización en tiempo real

### Personalización
- Elegir tipos de notificaciones específicas
- Configurar horarios de recordatorios
- Silenciar notificaciones temporalmente
- Sonidos personalizados por tipo

### Acciones Rápidas
- "Ver detalle" desde notificación
- "Marcar como pagado" directamente
- "Responder" a una liquidación
- "Añadir nuevo gasto" con un toque

---

## 🐛 Debugging

### Las notificaciones no llegan
- Verificar permisos en configuración del dispositivo
- Confirmar que el switch está habilitado
- Revisar console.log para errores
- Verificar que Device.isDevice es true (no funciona en simulador)

### Token push no se genera
- Verificar conexión a internet
- Confirmar que la app tiene permisos
- Revisar configuración en app.json
- Verificar projectId en notificationService.ts

### Notificaciones duplicadas
- Verificar que no haya múltiples listeners
- Confirmar que se eliminan correctamente en cleanup
- Revisar que no haya múltiples instancias del hook

---

## 📚 Documentación de Referencia

- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Device](https://docs.expo.dev/versions/latest/sdk/device/)
- [Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [iOS Background Modes](https://developer.apple.com/documentation/usernotifications)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)

---

## ✅ Checklist de Implementación

- [x] Instalar expo-notifications y expo-device
- [x] Crear notificationService.ts
- [x] Crear useNotifications.ts hook
- [x] Configurar app.json con permisos
- [x] Integrar en SettingsScreen
- [x] Integrar en AddExpenseScreen
- [x] Solicitud de permisos funcional
- [x] Notificaciones locales funcionando
- [x] Persistencia de preferencias
- [x] Cancelación al desactivar
- [x] Manejo de errores y edge cases
- [ ] Notificaciones push remotas (futuro)
- [ ] Tests automatizados (futuro)

---

**Estado**: ✅ COMPLETADO Y FUNCIONAL  
**Fecha**: 13 de noviembre de 2025  
**Versión**: 1.1.0

¡El sistema de notificaciones está listo para usarse! 🎉
