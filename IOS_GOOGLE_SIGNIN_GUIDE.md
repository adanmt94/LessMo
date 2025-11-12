# 📱 Guía Completa: Google Sign-In en iOS

## 🎯 Resumen

Esta guía te ayudará a configurar Google Sign-In para **iOS** en tu app LessMo.

---

## 📋 Prerequisitos

- ✅ Xcode instalado (solo macOS)
- ✅ Cuenta de Firebase activa
- ✅ Proyecto Firebase: **lessmo-9023f**
- ✅ Bundle ID: **com.lessmo.app**

---

## 🔧 Paso 1: Registrar App iOS en Firebase

### 1.1 Acceder a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: **lessmo-9023f**
3. Click en el ícono de **⚙️ Settings** (arriba a la izquierda)
4. Selecciona **Project Settings**

### 1.2 Agregar App iOS

En la sección **Your apps**:

```
1. Click en el botón "Add app"
2. Selecciona el ícono de iOS (🍎)
3. Llena el formulario:

   Apple bundle ID: com.lessmo.app
   App nickname (opcional): LessMo iOS
   App Store ID (opcional): dejar vacío

4. Click "Register app"
```

### 1.3 Descargar GoogleService-Info.plist

```
1. En la siguiente pantalla, verás un botón:
   "Download GoogleService-Info.plist"
   
2. Click para descargar el archivo

3. Mueve el archivo a la raíz de tu proyecto:
   /Users/adanmonterotorres/Projects/LessMo/LessMo/GoogleService-Info.plist

4. Click "Next" → "Next" → "Continue to console"
```

---

## ⚙️ Paso 2: Configurar app.config.js

Tu `app.config.js` ya está configurado correctamente:

```javascript
ios: {
  supportsTablet: true,
  bundleIdentifier: "com.lessmo.app",
  googleServicesFile: "./GoogleService-Info.plist", // ✅ Ya agregado
  config: {
    googleSignIn: {
      // REVERSED Client ID
      reservedClientId: "com.googleusercontent.apps.364537925711-9i60g88gd4jrnh1r24bdg80hn6ub90hb"
    }
  }
}
```

**¿De dónde sale el `reservedClientId`?**

Es el **REVERSED_CLIENT_ID** que se encuentra en tu `GoogleService-Info.plist`:

```xml
<key>CLIENT_ID</key>
<string>364537925711-9i60g88gd4jrnh1r24bdg80hn6ub90hb.apps.googleusercontent.com</string>

<key>REVERSED_CLIENT_ID</key>
<string>com.googleusercontent.apps.364537925711-9i60g88gd4jrnh1r24bdg80hn6ub90hb</string>
```

---

## 🔑 Paso 3: Verificar Client IDs en Google Cloud

### 3.1 Acceder a Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto: **lessmo-9023f**
3. Ve a **APIs & Services** → **Credentials**

### 3.2 Verificar iOS Client ID

Deberías ver un **OAuth 2.0 Client ID** de tipo **iOS**:

```
Name: iOS client (created by Firebase)
Type: iOS
Bundle ID: com.lessmo.app
Client ID: 364537925711-9i60g88gd4jrnh1r24bdg80hn6ub90hb.apps.googleusercontent.com
```

Si NO existe, créalo:

```
1. Click "CREATE CREDENTIALS" → "OAuth client ID"
2. Application type: iOS
3. Name: LessMo iOS
4. Bundle ID: com.lessmo.app
5. Click "Create"
6. Copia el Client ID generado
7. Actualiza GOOGLE_IOS_CLIENT_ID en tu .env
```

---

## 🔐 Paso 4: Configurar OAuth Consent Screen

### 4.1 Configurar Pantalla de Consentimiento

1. En Google Cloud Console, ve a **OAuth consent screen**
2. Verifica la configuración:

```
User Type: External (o Internal si es workspace)
App name: LessMo
User support email: tu_email@gmail.com
Developer contact: tu_email@gmail.com

Scopes:
✅ userinfo.email
✅ userinfo.profile
```

### 4.2 Agregar Test Users (si está en modo Testing)

Si tu app está en **Testing status**:

```
1. Scroll hasta "Test users"
2. Click "ADD USERS"
3. Agrega tu email de prueba
4. Click "Save"
```

⚠️ **Solo estos usuarios podrán iniciar sesión mientras esté en Testing mode**

---

## 🏗️ Paso 5: Build la App para iOS

### 5.1 Para Expo Go (Development)

```bash
# Limpia caché
npx expo start --clear

# Escanea QR con Expo Go en tu iPhone
```

⚠️ **Limitación**: Google Sign-In puede no funcionar 100% en Expo Go. Para testing completo, usa Development Build.

### 5.2 Para Development Build (Recomendado)

```bash
# Instala EAS CLI
npm install -g eas-cli

# Login en Expo
eas login

# Configura el proyecto
eas build:configure

# Build para iOS Simulator
eas build --platform ios --profile development-simulator

# O build para dispositivo físico
eas build --platform ios --profile development
```

### 5.3 Para Build Local (requiere macOS + Xcode)

```bash
# Crea el proyecto iOS nativo
npx expo prebuild --platform ios

# Instala pods
cd ios && pod install && cd ..

# Abre en Xcode
open ios/LessMo.xcworkspace

# En Xcode:
# 1. Selecciona tu equipo de desarrollo (Signing & Capabilities)
# 2. Conecta tu iPhone
# 3. Click en ▶️ Run
```

---

## 🧪 Paso 6: Probar Google Sign-In

### 6.1 En Dispositivo Real (iPhone/iPad)

```bash
# Opción A: Con Expo Go
npx expo start
# Escanea QR con tu iPhone

# Opción B: Con Development Build
# Instala el .ipa que descargaste de EAS
# O corre directamente desde Xcode
```

### 6.2 Flujo de Testing

```
1. Abre la app en tu iPhone
2. Ve a la pantalla de Login
3. Click en "🔍 Continuar con Google"
4. Debería abrir Safari/Chrome
5. Selecciona tu cuenta de Google (debe estar en Test Users)
6. Acepta permisos
7. Debería redirigir a la app
8. Verificar que iniciaste sesión correctamente
```

---

## ❌ Troubleshooting iOS

### Error: "idpiframe_initialization_failed"

**Causa**: Problema con Web Client ID

**Solución**:
```bash
# Verifica que tu .env tenga:
GOOGLE_WEB_CLIENT_ID=364537925711-f72ngqui0ncaoedmckhtd9rm5ndhcbt5.apps.googleusercontent.com

# Limpia caché
npx expo start --clear
```

---

### Error: "The operation couldn't be completed"

**Causa**: URL Scheme no configurado correctamente

**Solución**:
```javascript
// Verifica app.config.js
ios: {
  config: {
    googleSignIn: {
      reservedClientId: "com.googleusercontent.apps.364537925711-9i60g88gd4jrnh1r24bdg80hn6ub90hb"
    }
  }
}
```

---

### Error: "User canceled the sign-in flow"

**Causa**: Usuario canceló o problema con OAuth consent

**Solución**:
1. Verifica que tu email esté en Test Users
2. Verifica que OAuth consent screen esté configurado
3. Intenta con otro usuario de prueba

---

### Error: "Access blocked: This app's request is invalid"

**Causa**: Bundle ID no coincide o falta configuración

**Solución**:
```
1. Verifica Bundle ID en Firebase: com.lessmo.app
2. Verifica Bundle ID en Xcode: com.lessmo.app
3. Verifica que GoogleService-Info.plist tenga el BUNDLE_ID correcto:
   <key>BUNDLE_ID</key>
   <string>com.lessmo.app</string>
```

---

### Google Sign-In no abre el navegador

**Causa**: Problema con expo-web-browser

**Solución**:
```bash
# Reinstala dependencias
npm install expo-auth-session expo-web-browser expo-constants

# Limpia caché
npx expo start --clear

# Si usas bare workflow, instala pods
cd ios && pod install && cd ..
```

---

## 📊 Verificar Configuración

### Ejecuta el script de verificación:

```bash
./check-google-config.sh
```

Deberías ver:

```
✅ Archivo .env encontrado
✅ GOOGLE_IOS_CLIENT_ID configurado
✅ Archivo app.config.js encontrado
✅ Configuración googleSignIn (iOS) encontrada
✅ Archivo GoogleService-Info.plist encontrado en raíz
✅ expo-auth-session instalado
✅ expo-web-browser instalado
```

---

## 📂 Estructura de Archivos

Después de configurar, deberías tener:

```
LessMo/
├── .env
│   └── GOOGLE_IOS_CLIENT_ID=364537925711-9i60...
├── app.config.js
│   └── ios.config.googleSignIn.reservedClientId
├── GoogleService-Info.plist  ← Archivo de Firebase
└── src/
    └── hooks/
        └── useGoogleAuth.ts   ← Hook de autenticación
```

---

## 🎯 Checklist Final para iOS

Antes de probar en iOS:

- [ ] ✅ App iOS registrada en Firebase Console
- [ ] ✅ `GoogleService-Info.plist` descargado y en raíz del proyecto
- [ ] ✅ `GOOGLE_IOS_CLIENT_ID` configurado en `.env`
- [ ] ✅ `googleServicesFile` en `app.config.js` apunta a `./GoogleService-Info.plist`
- [ ] ✅ `reservedClientId` configurado en `app.config.js`
- [ ] ✅ OAuth consent screen configurado en Google Cloud
- [ ] ✅ Tu email agregado como Test User
- [ ] ✅ Dependencias instaladas (`expo-auth-session`, `expo-web-browser`)
- [ ] ✅ Caché limpiado con `npx expo start --clear`
- [ ] ✅ Probando en **iPhone/iPad real** (no simulador para primera prueba)

---

## 🚀 Siguiente Paso

Una vez que funcione en modo Development:

### Publicar la App (Production)

```bash
# 1. Cambia OAuth consent screen a "Production"
#    Google Cloud Console → OAuth consent screen → PUBLISH APP

# 2. Build para producción
eas build --platform ios --profile production

# 3. Submit a App Store
eas submit --platform ios
```

---

## 📚 Recursos

- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Google Sign-In iOS](https://developers.google.com/identity/sign-in/ios/start)
- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [OAuth 2.0 para iOS](https://developers.google.com/identity/protocols/oauth2/native-app)

---

## 💡 Consejos

1. **Usa Development Build** en lugar de Expo Go para testing completo
2. **Prueba siempre en dispositivo real** primero
3. **Mantén Test Users actualizados** en Google Cloud Console
4. **Verifica los Bundle IDs** - deben coincidir exactamente en Firebase, Google Cloud y Xcode
5. **No edites manualmente** `GoogleService-Info.plist` - descárgalo siempre de Firebase

---

¡Listo para iOS! 🍎🚀
