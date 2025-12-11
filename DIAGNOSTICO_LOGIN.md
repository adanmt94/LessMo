# 🔍 Diagnóstico de Problemas de Login

## ✅ Configuración Actualizada

### API Keys Nuevas (Generadas por Firebase):
- **iOS**: `AIzaSyDfqzWAP896weun6oafS1KraH4ZIdk_ll4`
- **Android**: `AIzaSyDrllVZr7qETFr3DpVWcssMxb1LexZ8Tus`

### Archivos Actualizados:
- ✅ `google-services.json` - API key Android actualizada
- ✅ `GoogleService-Info.plist` - API key iOS actualizada
- ✅ `.env` - Variables de entorno actualizadas
- ✅ `app.config.js` - Fallback actualizado

## 🐛 Error Actual

**Síntoma**: "Ocurrió un error inesperado" al intentar iniciar sesión

**Posibles Causas**:

### 1. 🕐 Propagación de API Keys (MÁS PROBABLE)
Las nuevas API keys de Firebase pueden tardar **5-10 minutos** en propagarse por todos los servidores de Google.

**Solución**: Esperar 10 minutos y volver a intentar.

### 2. 📱 Caché del Dispositivo
El dispositivo iOS puede tener en caché las configuraciones antiguas.

**Solución**:
```bash
# En el dispositivo iOS:
1. Cerrar la app completamente (deslizar hacia arriba)
2. Desinstalar la app
3. Reinstalar desde Expo Go
```

### 3. 🔑 Restricciones de API Key
Las API keys nuevas pueden tener restricciones que bloquean el uso desde desarrollo.

**Verificar en Google Cloud Console**:
1. Ir a: https://console.cloud.google.com/apis/credentials
2. Buscar la API key de iOS: `AIzaSyDfqzWAP896weun6oafS1KraH4ZIdk_ll4`
3. Verificar que **NO** tenga restricciones de referencia HTTP
4. Verificar que tenga habilitada: `Firebase Authentication API`

### 4. ⚙️ Configuración de Firebase Authentication
Verificar que Firebase Authentication tenga Email/Password habilitado.

**Verificar en Firebase Console**:
1. Ir a: https://console.firebase.google.com/project/lessmo-9023f/authentication/providers
2. Verificar que "Email/contraseña" esté HABILITADO
3. Verificar que el usuario adanmontero7@hotmail.com exista en "Usuarios"

## 🔧 Pasos de Solución Recomendados

### Paso 1: Limpiar Todo
```bash
# En terminal
cd /Users/adanmonterotorres/Projects/LessMo/LessMo
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

### Paso 2: Reinstalar en Dispositivo
```bash
# En dispositivo iOS:
1. Cerrar app completamente
2. Eliminar app
3. Escanear QR code nuevamente desde Expo Go
```

### Paso 3: Verificar Logs
Cuando intentes iniciar sesión, verifica los logs en la terminal de Expo:
- Busca mensajes de `[FIREBASE-INIT]`
- Busca errores específicos de Firebase Auth

### Paso 4: Probar con Cuenta Nueva
```bash
# Si no funciona el login, probar:
1. Click en "¿No tienes cuenta? Regístrate"
2. Intentar crear una cuenta nueva
3. Ver qué error específico aparece
```

### Paso 5: Usar Recuperación de Contraseña
```bash
# Si el usuario existe pero la contraseña no coincide:
1. Click en "¿Olvidaste tu contraseña?"
2. Ingresar: adanmontero7@hotmail.com
3. Revisar el correo para restablecer contraseña
4. Crear nueva contraseña
5. Intentar login con nueva contraseña
```

## 📊 Información Técnica

### Variables de Entorno Cargadas:
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDfqzWAP896weun6oafS1KraH4ZIdk_ll4
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=lessmo-9023f.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=lessmo-9023f
```

### Configuración Firebase (firebase.ts):
```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDfqzWAP896weun6oafS1KraH4ZIdk_ll4',
  authDomain: 'lessmo-9023f.firebaseapp.com',
  projectId: 'lessmo-9023f',
  storageBucket: 'lessmo-9023f.appspot.com',
  messagingSenderId: '364537925711',
  appId: '1:364537925711:web:145b2f74d691c58b905a3a'
};
```

## 🎯 Próximo Paso Inmediato

### ¡ESPERA 10 MINUTOS!

Las API keys de Firebase recién generadas necesitan propagarse por los servidores de Google. Después de 10 minutos:

1. **Cerrar la app en el iPhone**
2. **Eliminar la app del iPhone**
3. **En la terminal de tu Mac, presionar `r` para recargar**
4. **Escanear el QR code nuevamente**
5. **Intentar login con**: adanmontero7@hotmail.com

Si después de 10 minutos sigue sin funcionar, por favor comparte:
- El mensaje de error COMPLETO que aparece en la terminal
- El mensaje de error que aparece en el iPhone
- Screenshot de los logs de Expo

## 🆘 Si Nada Funciona

Como última opción, podemos:
1. Eliminar y recrear las apps en Firebase Console
2. Regenerar TODAS las API keys desde cero
3. Usar un proyecto Firebase completamente nuevo

Pero primero, **intenta esperar 10 minutos** y seguir los pasos de arriba.
