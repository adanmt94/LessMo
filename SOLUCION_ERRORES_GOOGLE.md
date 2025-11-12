# 🔧 Solución: Errores de Google Sign-In

## 🚨 Error: "Acceso bloqueado"

Este error ocurre porque Google bloquea el acceso cuando la configuración OAuth no está completa. Sigue estos pasos:

---

## ✅ Paso 1: Habilitar Google Sign-In en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: **lessmo-9023f**
3. Ve a **Authentication** → **Sign-in method**
4. Busca **Google** en la lista de proveedores
5. Click en **Google** → **Enable** (Habilitar)
6. Verifica que el **Web Client ID** sea: `364537925711-f72ngqui0ncaoedmckhtd9rm5ndhcbt5.apps.googleusercontent.com`
7. Guarda los cambios

---

## ✅ Paso 2: Configurar Android (SHA-1 y SHA-256)

### 2.1 Obtener SHA-1 y SHA-256 de tu Debug Keystore

```bash
# En macOS/Linux:
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Busca en la salida:
# SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
# SHA256: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

### 2.2 Agregar SHA-1/SHA-256 a Firebase

1. En Firebase Console, ve a **Project Settings** (⚙️ arriba a la izquierda)
2. Scroll hasta **Your apps** → Selecciona tu app Android: `com.lessmo.app`
3. Click en **Add fingerprint** (Agregar huella digital)
4. Pega el **SHA-1** y click **Save**
5. Repite para el **SHA-256**

### 2.3 Descargar el nuevo google-services.json

1. En la misma pantalla, click en **Download google-services.json**
2. Reemplaza el archivo en: `android/app/google-services.json`

---

## ✅ Paso 3: Configurar iOS (URL Scheme y GoogleService-Info.plist)

### 3.1 Descargar GoogleService-Info.plist

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: **lessmo-9023f**
3. Ve a **Project Settings** (⚙️ arriba a la izquierda)
4. Scroll hasta **Your apps**
5. Si NO tienes una app iOS registrada:
   - Click en **Add app** → iOS (ícono de Apple)
   - Bundle ID: `com.lessmo.app`
   - App nickname: LessMo iOS (opcional)
   - Click **Register app**
6. Click en **Download GoogleService-Info.plist**
7. Guarda el archivo en la raíz de tu proyecto: `/GoogleService-Info.plist`

### 3.2 Obtener el iOS Client ID

Tu iOS Client ID es: `364537925711-9i60g88gd4jrnh1r24bdg80hn6ub90hb.apps.googleusercontent.com`

**REVERSED Client ID**: `com.googleusercontent.apps.364537925711-9i60g88gd4jrnh1r24bdg80hn6ub90hb`

### 3.3 Agregar URL Scheme al app.config.js

Ya está configurado en tu `app.config.js`:

```javascript
// app.config.js
ios: {
  supportsTablet: true,
  bundleIdentifier: "com.lessmo.app",
  googleServicesFile: "./GoogleService-Info.plist", // Agregar esta línea
  config: {
    googleSignIn: {
      reservedClientId: "com.googleusercontent.apps.364537925711-9i60g88gd4jrnh1r24bdg80hn6ub90hb"
    }
  }
}
```

### 3.4 Configurar info.plist (si usas bare workflow)

Si estás usando **bare workflow** (no Expo Go), necesitas editar `ios/LessMo/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <!-- REVERSED Client ID para Google Sign-In -->
      <string>com.googleusercontent.apps.364537925711-9i60g88gd4jrnh1r24bdg80hn6ub90hb</string>
    </array>
  </dict>
</array>
```

### 3.5 Instalar Pods (solo bare workflow)

```bash
cd ios
pod install
cd ..
```

---

## ✅ Paso 4: Verificar Configuración OAuth en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto: **lessmo-9023f**
3. Ve a **APIs & Services** → **Credentials**
4. Verifica que tengas 3 Client IDs:

   **Android Client ID:**
   - ID: `364537925711-8k9moeddmi8n3b56ipchr37j1l14vvff.apps.googleusercontent.com`
   - Package name: `com.lessmo.app`
   - SHA-1: (el que obtuviste en Paso 2.1)

   **iOS Client ID:**
   - ID: `364537925711-9i60g88gd4jrnh1r24bdg80hn6ub90hb.apps.googleusercontent.com`
   - Bundle ID: `com.lessmo.app`

   **Web Client ID:**
   - ID: `364537925711-f72ngqui0ncaoedmckhtd9rm5ndhcbt5.apps.googleusercontent.com`

---

## ✅ Paso 5: Configurar Pantalla de Consentimiento OAuth

1. En Google Cloud Console, ve a **APIs & Services** → **OAuth consent screen**
2. Verifica la configuración:
   - **App name**: LessMo
   - **User support email**: Tu email
   - **App logo**: (opcional)
   - **Developer contact**: Tu email
3. En **Scopes**, asegúrate de tener:
   - `userinfo.email`
   - `userinfo.profile`
4. En **Test users** (si está en modo Testing):
   - Agrega tu email de prueba
   - Agrega emails de otros usuarios que vayan a probar

---

## ✅ Paso 6: Actualizar app.config.js

Ya tienes la configuración, pero asegúrate de que esté correcta:

```javascript
// app.config.js
export default {
  expo: {
    // ... resto de configuración
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.lessmo.app",
      config: {
        googleSignIn: {
          reservedClientId: "com.googleusercontent.apps.364537925711-9i60g88gd4jrnh1r24bdg80hn6ub90hb"
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#6366F1"
      },
      package: "com.lessmo.app",
      googleServicesFile: "./google-services.json" // Asegúrate de tener este archivo
    },
    extra: {
      // ... tus variables de entorno
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID
    }
  }
};
```

---

## ✅ Paso 7: Rebuild y Reiniciar

```bash
# Limpiar caché
npx expo start --clear

# En otra terminal, rebuild
# Para Android:
cd android && ./gradlew clean && cd ..

# Para iOS (solo macOS):
cd ios && pod install && cd ..
```

---

## 🧪 Paso 8: Probar en Dispositivo Real

⚠️ **IMPORTANTE**: Google Sign-In **NO funciona en emuladores** la primera vez. Debes probar en:

### Android:
```bash
# Conecta tu dispositivo Android con USB
# Habilita "Depuración USB" en opciones de desarrollador
npx expo run:android --device
```

### iOS:
```bash
# Conecta tu iPhone/iPad
npx expo run:ios --device
```

---

## 🐛 Troubleshooting

### Error: "Acceso bloqueado: Este dominio de la app no está autorizado"

**Solución:**
1. Ve a Google Cloud Console → OAuth consent screen
2. En **Authorized domains**, agrega:
   - `firebaseapp.com`
   - `lessmo-9023f.firebaseapp.com`

### Error: "idpiframe_initialization_failed"

**Solución:**
1. Verifica que el Web Client ID esté correcto
2. Asegúrate de que Firebase Authentication esté habilitado

### Error: "DEVELOPER_ERROR" en Android

**Solución:**
1. Verifica que el SHA-1 esté registrado en Firebase
2. Verifica que el package name sea exactamente: `com.lessmo.app`
3. Descarga el nuevo `google-services.json` después de agregar SHA-1

### Error: "Error 10" en Android

**Solución:**
1. Verifica que el Android Client ID en `.env` sea correcto
2. Asegúrate de que coincida con el Client ID que tiene el SHA-1 registrado

### Google Sign-In no abre el navegador

**Solución:**
```bash
# Reinstala dependencias
npm install expo-auth-session expo-web-browser
npx expo start --clear
```

---

## � Checklist Final

### Para Android:
- [ ] ✅ Google habilitado en Firebase Authentication
- [ ] ✅ SHA-1 y SHA-256 agregados a Firebase
- [ ] ✅ `google-services.json` descargado y colocado en raíz del proyecto
- [ ] ✅ Los 3 Client IDs correctos en `.env`
- [ ] ✅ Pantalla de consentimiento OAuth configurada
- [ ] ✅ Tu email agregado como test user (si la app está en Testing mode)

### Para iOS:
- [ ] ✅ App iOS registrada en Firebase Console
- [ ] ✅ `GoogleService-Info.plist` descargado y colocado en raíz del proyecto
- [ ] ✅ URL Scheme configurado en `app.config.js`
- [ ] ✅ `googleServicesFile` configurado en `app.config.js`
- [ ] ✅ Los 3 Client IDs correctos en `.env`
- [ ] ✅ Pantalla de consentimiento OAuth configurada
- [ ] ✅ Tu email agregado como test user

### Para ambas plataformas:
- [ ] ✅ Caché limpiado con `npx expo start --clear`
- [ ] ✅ Probando en **dispositivo real**, no emulador

---

## 📞 Si Sigue Fallando

1. **Verifica los logs del terminal** al hacer click en el botón de Google
2. **Revisa Firebase Console** → Authentication → Users para ver si se crea algo
3. **Comparte el error exacto** que aparece en el Alert o en la consola

---

## 🎯 Siguiente Paso

Una vez que funcione Google Sign-In, puedes publicar la app en modo Testing:

1. Firebase Console → Authentication → Sign-in method → Google → **Advanced** → Production
2. Google Cloud Console → OAuth consent screen → **PUBLISH APP**

Esto permitirá que cualquier usuario con cuenta de Google pueda iniciar sesión (no solo test users).
