# 📱 GUÍA: CREAR BUILD PARA iPhone

**Objetivo:** Instalar LessMo en tu iPhone real con todas las funcionalidades, incluyendo Face ID/Touch ID.

---

## 🎯 PREREQUISITOS

1. **Cuenta de Apple Developer** (puedes usar cuenta gratuita)
2. **Cuenta de Expo** (gratis en expo.dev)
3. **Tu iPhone conectado a la misma cuenta de iCloud**
4. **EAS CLI instalado** ✅ (ya hecho)

---

## 📋 PASO 1: INICIAR SESIÓN EN EAS

```bash
eas login
```

Ingresa tu email y contraseña de Expo. Si no tienes cuenta, créala en [expo.dev](https://expo.dev).

---

## 📋 PASO 2: CREAR LA BUILD DE DESARROLLO

Este comando creará una build específica para tu iPhone que incluye el Dev Client (necesario para Face ID):

```bash
eas build --profile development --platform ios
```

### Durante el proceso te preguntará:

1. **"Would you like to automatically create an Apple App Identifier?"**
   - Respuesta: **Yes** ✅

2. **"Generate a new Apple Distribution Certificate?"**
   - Respuesta: **Yes** ✅

3. **"Generate a new Apple Provisioning Profile?"**
   - Respuesta: **Yes** ✅

4. **Inicio de sesión con Apple:**
   - Te pedirá usuario y contraseña de tu Apple ID
   - Si tienes 2FA, te pedirá el código

### ⏱️ Tiempo estimado:
- Primera vez: **15-20 minutos**
- Siguientes builds: **10-15 minutos**

---

## 📋 PASO 3: DESCARGAR E INSTALAR EN TU iPhone

### Opción A: Con Cable (Más Rápido)

1. Conecta tu iPhone por USB
2. Cuando la build termine, EAS te dará una URL
3. Escanea el QR code con la cámara de tu iPhone
4. Se abrirá Safari con un botón "Install"
5. Dale a "Install" y acepta el perfil de desarrollo

### Opción B: Sin Cable (Over-the-Air)

1. Cuando la build termine, recibirás un enlace por email
2. Abre el enlace en tu iPhone
3. Dale a "Install"
4. Ve a **Settings → General → VPN & Device Management**
5. Confía en el desarrollador (tu Apple ID)

---

## 🔐 PASO 4: PROBAR FACE ID

Una vez instalada la app:

1. Abre LessMo en tu iPhone
2. Inicia sesión o crea cuenta
3. Ve a **Settings**
4. Verás la opción **"Face ID"** (si tienes iPhone X o superior)
5. Activa el switch
6. Te pedirá autenticarte con Face ID
7. Cierra la app completamente
8. Vuelve a abrirla → **¡Te pedirá Face ID!** 🎉

---

## 🚀 COMANDOS ÚTILES

### Ver tus builds
```bash
eas build:list
```

### Crear nueva build de desarrollo
```bash
eas build --profile development --platform ios
```

### Crear build de preview (para compartir con otros)
```bash
eas build --profile preview --platform ios
```

### Crear build de producción (para App Store)
```bash
eas build --profile production --platform ios
```

---

## 📊 PERFILES DE BUILD

Tu proyecto tiene 3 perfiles configurados en `eas.json`:

### 1. **development** (Recomendado para ti ahora)
- Include Expo Dev Client
- Permite hot reload
- Face ID/Touch ID funciona
- No expira
- Solo para tu dispositivo registrado

### 2. **preview**
- Para compartir con beta testers
- Válida por 90 días
- Hasta 100 dispositivos
- Face ID/Touch ID funciona

### 3. **production**
- Para subir a App Store
- Build optimizada
- Requiere Apple Developer Program ($99/año)

---

## ⚠️ PROBLEMAS COMUNES

### "No se puede instalar la app"
**Solución:** Ve a Settings → General → VPN & Device Management → Confía en el desarrollador

### "El certificado expiró"
**Solución:** Crea una nueva build con `eas build --profile development --platform ios`

### "Face ID no funciona"
**Solución:** Face ID NO funciona en Expo Go. DEBES usar la build de desarrollo.

### "Build failed: No se encuentra el certificado"
**Solución:** 
```bash
eas credentials
# Selecciona iOS
# Selecciona "Add new credentials"
```

---

## 💡 CONSEJOS

1. **Primera build:** Puede tardar más porque EAS genera certificados y perfiles
2. **Builds siguientes:** Serán más rápidas (10-15 min)
3. **Actualizar la app:** Solo corre `eas build` de nuevo y reinstala
4. **Testing en varios iPhones:** Usa el perfil `preview` y registra los UDIDs
5. **Cuenta gratuita de Apple:** Te limita a 3 dispositivos y builds expiran en 7 días

---

## 📱 ALTERNATIVA: DESARROLLO LOCAL (Más Rápido)

Si tienes **Xcode** instalado en tu Mac, puedes crear builds locales más rápido:

```bash
# Crear build local
eas build --profile development --platform ios --local

# Instalar directamente en iPhone conectado por USB
npx expo run:ios --device
```

**Ventaja:** No esperas la cola de EAS (builds en 2-3 minutos)
**Desventaja:** Requiere Xcode (40+ GB) y Mac con suficiente espacio

---

## 🎯 RESUMEN: INSTALACIÓN RÁPIDA

```bash
# 1. Login
eas login

# 2. Crear build
eas build --profile development --platform ios

# 3. Esperar (~15 min)
# 4. Escanear QR con iPhone
# 5. Instalar
# 6. Confiar en Settings
# 7. ¡Disfrutar con Face ID! 🎉
```

---

## 📞 SOPORTE

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Troubleshooting:** https://docs.expo.dev/build-reference/troubleshooting/
- **Expo Discord:** https://chat.expo.dev/

---

**¿Listo para crear la build?** Ejecuta:

```bash
eas login
eas build --profile development --platform ios
```

🚀 **¡Tu app estará lista en ~15 minutos!**
