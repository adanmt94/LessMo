# 🐛 Sentry Error Tracking - Configuración

Sentry está integrado en LessMo para tracking de errores y performance monitoring en producción.

## 📋 Requisitos

1. Cuenta en [Sentry.io](https://sentry.io)
2. Proyecto creado en Sentry
3. DSN del proyecto

## 🚀 Setup Rápido

### 1. Obtener DSN de Sentry

1. Ve a [https://sentry.io](https://sentry.io)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto:
   - Platform: React Native
   - Project name: LessMo
4. Copia el DSN que te muestra (formato: `https://xxx@xxx.ingest.sentry.io/xxx`)

### 2. Configurar Variable de Entorno

Opción A: Archivo `.env` (desarrollo):
```bash
# .env
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
```

Opción B: Variables de entorno del sistema:
```bash
export SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"
```

Opción C: En `src/services/sentryService.ts` (no recomendado para producción):
```typescript
const SENTRY_DSN = 'https://your-key@your-org.ingest.sentry.io/your-project-id';
```

### 3. Instalar Dependencias (ya hecho)

```bash
npm install @sentry/react-native
```

### 4. Verificar Integración

La integración ya está configurada en:
- ✅ `App.tsx` - Error boundary + inicialización
- ✅ `src/services/sentryService.ts` - Servicio completo

## 📊 Uso en Código

### Capturar Errores Manuales

```typescript
import { captureError } from '../services/sentryService';

try {
  // Código que puede fallar
  await riskyOperation();
} catch (error) {
  captureError(error as Error, {
    context: 'payment_processing',
    userId: user.id,
    amount: 150,
  });
}
```

### Logging de Mensajes

```typescript
import { captureMessage } from '../services/sentryService';

// Info
captureMessage('Usuario completó onboarding', 'info');

// Warning
captureMessage('Límite de presupuesto alcanzado', 'warning');

// Error
captureMessage('Falló sincronización con Firebase', 'error');
```

### Breadcrumbs (seguimiento de acciones)

```typescript
import { addBreadcrumb } from '../services/sentryService';

addBreadcrumb(
  'Usuario creó evento',
  'user_action',
  {
    eventId: event.id,
    eventName: event.name,
    participants: event.participantIds.length,
  }
);
```

### Contexto de Usuario

```typescript
import { setUserContext, clearUserContext } from '../services/sentryService';

// Al login
setUserContext({
  id: user.uid,
  email: user.email,
  username: user.displayName,
});

// Al logout
clearUserContext();
```

## 🎯 Features Integradas

### ✅ Automático

- **Crash Reporting**: Errores no manejados
- **Error Boundary**: Errores de React
- **Performance Tracking**: Tiempo de carga de pantallas
- **Breadcrumbs**: Navegación, clicks, requests HTTP
- **Session Tracking**: Duración de sesiones
- **Release Tracking**: Versión de la app

### 🔒 Privacidad

El servicio incluye filtros automáticos de datos sensibles:
- ❌ Passwords
- ❌ Tokens de autenticación
- ❌ API keys
- ❌ Emails (en breadcrumbs)

## 📱 Testing

### Desarrollo
Sentry está **deshabilitado** en modo desarrollo (`__DEV__`).

### Producción
Para probar en producción:

```typescript
import { captureError } from '../services/sentryService';

// En cualquier pantalla
const testSentry = () => {
  const error = new Error('Test error from LessMo');
  captureError(error, {
    test: true,
    timestamp: new Date().toISOString(),
  });
};
```

## 🔍 Ver Errores

1. Ve a [https://sentry.io](https://sentry.io)
2. Selecciona tu proyecto "LessMo"
3. Ve a **Issues** para ver todos los errores
4. Click en cualquier error para ver:
   - Stack trace completo
   - Breadcrumbs (últimas 100 acciones)
   - Contexto de usuario
   - Device info
   - Tags y contexto adicional

## 🏷️ Tags Personalizados

Los siguientes tags se añaden automáticamente:
- `platform`: iOS o Android
- `environment`: development o production

Añadir tags personalizados:

```typescript
import { setTag, setContext } from '../services/sentryService';

// Tag simple
setTag('payment_method', 'paypal');

// Contexto completo
setContext('event_details', {
  eventId: event.id,
  participants: participants.length,
  totalExpenses: totalAmount,
  currency: event.currency,
});
```

## 📈 Performance Monitoring

Tracking de operaciones lentas:

```typescript
import { startTransaction } from '../services/sentryService';

const fetchData = async () => {
  const transaction = startTransaction('fetch_event_data', 'http');
  
  try {
    const data = await getEventData(eventId);
    transaction?.setStatus('ok');
  } catch (error) {
    transaction?.setStatus('error');
    throw error;
  } finally {
    transaction?.finish();
  }
};
```

## 🔧 Troubleshooting

### Error: "DSN not configured"
- Verifica que `SENTRY_DSN` esté configurado correctamente
- Recompila la app después de agregar variables de entorno

### No veo errores en Sentry
- Verifica que no estés en modo desarrollo (`__DEV__`)
- Verifica que el DSN sea correcto
- Revisa la consola para mensajes de Sentry

### Demasiados errores reportados
Ajusta el sample rate en `src/services/sentryService.ts`:

```typescript
tracesSampleRate: 0.2, // 20% de eventos
```

## 📚 Recursos

- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Best Practices](https://docs.sentry.io/platforms/react-native/best-practices/)
- [Performance Monitoring](https://docs.sentry.io/platforms/react-native/performance/)

## 🚨 Importante

- **NO** commitear el DSN en el repositorio público
- Usar variables de entorno o secrets management
- Configurar rate limiting en Sentry para evitar costos altos
- Revisar errores semanalmente para identificar patterns
