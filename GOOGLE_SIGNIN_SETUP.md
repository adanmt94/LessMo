# Configuración de Google Sign-In para LessMo

## 📋 Pasos para Configurar Google OAuth

### 1. Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto "lessmo-9023f"
3. Ve a **Authentication** > **Sign-in method**
4. Haz clic en **Google** y actívalo
5. Copia el **Web Client ID** que aparece

### 2. Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** > **Credentials**

#### Android Client ID:
4. Haz clic en **Create Credentials** > **OAuth 2.0 Client ID**
5. Tipo de aplicación: **Android**
6. Nombre: "LessMo Android"
7. Package name: `com.lessmo.app`
8. SHA-1: `57:2C:C8:AC:ED:B7:29:42:21:14:0D:32:75:76:37:6D:FE:67:A1:60`
9. Copia el **Client ID** generado

#### iOS Client ID (si vas a usar iOS):
10. Haz clic en **Create Credentials** > **OAuth 2.0 Client ID**
11. Tipo de aplicación: **iOS**
12. Nombre: "LessMo iOS"
13. Bundle ID: `com.lessmo.app`
14. Copia el **Client ID** generado

### 3. Actualizar .env

Agrega los Client IDs a tu archivo `.env`:

```bash
# Firebase
FIREBASE_API_KEY=AIzaSyD1NN6qPdBXgRFXiFBhPI8RbJfBQP3slmQ
FIREBASE_AUTH_DOMAIN=lessmo-9023f.firebaseapp.com
FIREBASE_PROJECT_ID=lessmo-9023f
FIREBASE_STORAGE_BUCKET=lessmo-9023f.appspot.com
FIREBASE_MESSAGING_SENDER_ID=364537925711
FIREBASE_APP_ID=1:364537925711:web:145b2f74d691c58b905a3a

# Google OAuth - REEMPLAZA CON TUS VALORES REALES
GOOGLE_ANDROID_CLIENT_ID=TU_ANDROID_CLIENT_ID_AQUI.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=TU_IOS_CLIENT_ID_AQUI.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=TU_WEB_CLIENT_ID_AQUI.apps.googleusercontent.com
```

### 4. Reiniciar Expo

```bash
# Detener expo si está corriendo (Ctrl+C)
# Limpiar caché y reiniciar
npx expo start --clear
```

### 5. Probar Google Sign-In

1. Abre la app en un emulador o dispositivo real
2. Ve a la pantalla de Login
3. Presiona "🔍 Continuar con Google"
4. Selecciona tu cuenta de Google
5. Deberías ver que te redirige al Home

## 🔧 Troubleshooting

### Error: "Developer Error"
**Causa**: SHA-1 no configurado correctamente o Client ID incorrecto.

**Solución**:
1. Verifica que el SHA-1 en Google Cloud Console sea exactamente:
   ```
   57:2C:C8:AC:ED:B7:29:42:21:14:0D:32:75:76:37:6D:FE:67:A1:60
   ```
2. Verifica que el package name sea: `com.lessmo.app`
3. Espera 5-10 minutos para que los cambios se propaguen

### Error: "Sign-in failed"
**Causa**: Variables de entorno no cargadas.

**Solución**:
1. Verifica que `.env` tenga los valores correctos
2. Reinicia Expo con `--clear`:
   ```bash
   npx expo start --clear
   ```

### Error: "Invalid client"
**Causa**: Client ID incorrecto en `.env`.

**Solución**:
1. Verifica que los Client IDs en `.env` coincidan con los de Google Cloud Console
2. Asegúrate de que no haya espacios extra al copiar

## 📱 Testing en Dispositivos Reales

### Android:
- El SHA-1 del debug keystore ya está configurado
- Debería funcionar directamente en emuladores y dispositivos en modo desarrollo

### iOS:
- Necesitas configurar el iOS Client ID
- Para producción, necesitarás configurar el Bundle ID en Xcode

## 🚀 Producción

Para builds de producción (APK/IPA):

### Android Release:
1. Genera un nuevo keystore para release:
   ```bash
   keytool -genkey -v -keystore lessmo-release.keystore -alias lessmo -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Obtén el SHA-1 del release keystore:
   ```bash
   keytool -list -v -keystore lessmo-release.keystore -alias lessmo
   ```
3. Agrega este SHA-1 a Google Cloud Console
4. Espera 5-10 minutos

### iOS Release:
1. Configura el Bundle ID correcto en Xcode
2. Asegúrate de que el iOS Client ID esté configurado para ese Bundle ID
3. Construye con Xcode o EAS Build

## 📚 Recursos

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google Sign-In](https://developers.google.com/identity)

## ✅ Checklist

- [ ] Google Sign-In activado en Firebase Console
- [ ] Android Client ID creado con SHA-1 correcto
- [ ] iOS Client ID creado (si aplica)
- [ ] Web Client ID copiado
- [ ] Variables en `.env` actualizadas
- [ ] Expo reiniciado con `--clear`
- [ ] Probado en emulador/dispositivo
