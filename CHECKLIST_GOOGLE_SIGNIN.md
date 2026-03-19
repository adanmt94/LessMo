# ✅ Checklist: Verificación de Google Sign-In

## Paso 1: Verificar URIs de Redirección en Google Cloud Console

1. **Ir a:** https://console.cloud.google.com/apis/credentials?project=lessmo-9023f

2. **Buscar el Web Client** (ID termina en ...f72ngqui0ncaoedmckhtd9rm5ndhcbt5)

3. **Hacer clic en el Web Client para editarlo**

4. **Scroll hasta "URIs de redirección autorizados"**

5. **Verificar que estas 2 URIs estén presentes:**
   ```
   https://auth.expo.io/@adanmt94/lessmo
   https://lessmo-9023f.firebaseapp.com/__/auth/handler
   ```

6. **Si NO están, agregarlas:**
   - Click en "AGREGAR URI"
   - Pegar cada URI
   - Click en "GUARDAR"

7. **IMPORTANTE:** Esperar 5-10 minutos después de guardar para que Google propague los cambios

## Paso 2: Verificar Pantalla de Consentimiento OAuth

1. **Ir a:** APIs y servicios → Pantalla de consentimiento de OAuth

2. **Verificar configuración:**
   - ✅ Tipo de usuario: Externo (o Interno si es para G Suite)
   - ✅ Estado: EN PRODUCCIÓN (o "Prueba" si estás probando)
   
3. **Si está en "Prueba", agregar usuarios de prueba:**
   - Click en "EDITAR APLICACIÓN"
   - Scroll hasta "Usuarios de prueba"
   - Click en "+ AGREGAR USUARIOS"
   - Agregar: adanmt94@gmail.com y adanmonterotorres@gmail.com
   - Guardar

4. **Verificar dominios autorizados:**
   - App domain: (opcional, puede estar vacío)
   - Authorized domains: 
     - `firebaseapp.com`
     - `lessmo-9023f.firebaseapp.com`

## Paso 3: Verificar Client IDs en .env

Abre el archivo `.env` y confirma que estos valores son correctos:

```env
GOOGLE_WEB_CLIENT_ID=364537925711-f72ngqui0ncaoedmckhtd9rm5ndhcbt5.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=364537925711-vtgqi80bk7i7f3ioqo8gilafo7hjj0vc.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=364537925711-8k9moeddmi8n3b56ipchr37j1l14vvff.apps.googleusercontent.com
```

## Paso 4: Limpiar Caché y Probar

1. **Detener Expo:**
   ```bash
   Ctrl+C
   ```

2. **Limpiar caché y reiniciar:**
   ```bash
   npx expo start --clear
   ```

3. **Escanear QR** con tu dispositivo

4. **Esperar 5-10 minutos** si acabas de agregar las URIs

5. **Probar Google Sign-In**

## 🔴 Si sigue sin funcionar:

### Opción A: Usar Expo Development Build (RECOMENDADO)

```bash
# 1. Instalar expo-dev-client
npm install expo-dev-client

# 2. Compilar para iOS
npx expo run:ios

# 3. O para Android
npx expo run:android
```

**Ventaja:** Google Sign-In funciona al 100% con Development Build.

### Opción B: Verificar logs en tiempo real

Cuando presiones "Iniciar sesión con Google", dime exactamente qué mensaje aparece:
- ¿"Error 400: invalid_request"?
- ¿"Acceso bloqueado: error de autorización"?
- ¿Otro mensaje?

Y yo lo analizaré con los logs del terminal.

## 📱 Usuarios de Prueba Válidos

Si Google OAuth está en modo "Prueba", solo estos usuarios pueden autenticarse:
- adanmt94@gmail.com
- adanmonterotorres@gmail.com

Si intentas con otro email, verás "Acceso bloqueado".

## ⏰ Tiempo de Propagación

**CRÍTICO:** Los cambios en Google Cloud Console pueden tardar:
- **5-10 minutos** normalmente
- **Hasta 1 hora** en casos raros

Si acabas de hacer cambios, **espera 10 minutos** antes de probar.
