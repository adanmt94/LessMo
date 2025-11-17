# 🔧 GUÍA: Configurar Google Sign-In Correctamente

## Problema Reportado
**Error:** "acceso no permitido"

## Causas Posibles

### 1. OAuth Consent Screen no configurado
- El OAuth consent screen debe estar en modo "Testing" o "Published"
- Los usuarios de prueba deben estar agregados si está en modo "Testing"

### 2. Redirect URIs no configurados
Para Expo Go, necesitas agregar:
```
https://auth.expo.io/@YOUR_EXPO_USERNAME/LessMo
```

Para standalone builds, necesitas:
```
com.lessmo.app:/
```

### 3. Client IDs incorrectos o no autorizados
- Android Client ID debe coincidir con el SHA-1 del keystore
- iOS Client ID debe coincidir con el bundle identifier
- Web Client ID debe estar habilitado para aplicaciones móviles

## Cómo Verificar y Arreglar

### Paso 1: Verificar OAuth Consent Screen

1. Ir a: https://console.cloud.google.com/apis/credentials/consent
2. Verificar estado:
   - ✅ Status debe ser "Testing" o "In Production"
   - ✅ Agregar tu email como Test User si está en Testing

### Paso 2: Verificar Credenciales OAuth 2.0

1. Ir a: https://console.cloud.google.com/apis/credentials
2. Para cada Client ID:
   - **Android:**
     - Nombre del paquete: `com.lessmo.app`
     - SHA-1: Obtener con `cd android && ./gradlew signingReport`
   - **iOS:**
     - Bundle ID: `com.lessmo.app`
     - App Store ID: (dejar vacío para desarrollo)
   - **Web:**
     - Authorized redirect URIs debe incluir:
       - `https://auth.expo.io/@YOUR_USERNAME/LessMo`

### Paso 3: Verificar expo-auth-session Config

En `app.config.js`:
```javascript
scheme: "lessmo",  // ✅ Correcto
```

### Paso 4: Verificar .env

Los Client IDs deben estar correctos:
```
GOOGLE_ANDROID_CLIENT_ID=xxxx-xxxx.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=xxxx-xxxx.apps.googleusercontent.com  
GOOGLE_WEB_CLIENT_ID=xxxx-xxxx.apps.googleusercontent.com
```

## Solución Rápida Para Expo Go

1. **Agregar Redirect URI:**
   ```
   https://auth.expo.io/@adanmt94/lessmo
   ```

2. **Agregar Test User:**
   - Tu email en OAuth Consent Screen > Test users

3. **Verificar scopes:**
   - email
   - profile
   - openid

## Comandos Útiles

```bash
# Ver configuración actual
cat .env | grep GOOGLE

# Ver qué username de Expo usar
npx expo whoami

# Ver app.json scheme
cat app.json | grep scheme
```

## Error Específico: "acceso no permitido"

Este error significa:
1. El usuario NO está en la lista de Test Users (si en modo Testing)
2. El OAuth consent screen NO está published
3. Los scopes solicitados NO están autorizados

**Solución:**
1. Ir a Google Cloud Console
2. APIs & Services > OAuth consent screen
3. Agregar tu email a "Test users"
4. O cambiar a "In production" (requiere verificación)

## Testing

Después de configurar, prueba:
1. Abrir app en dispositivo
2. Presionar "Continuar con Google"
3. Debería abrir navegador
4. Seleccionar cuenta
5. Debería regresar a la app autenticado

Si sigue fallando, revisar logs del servidor Expo para ver el error exacto.
