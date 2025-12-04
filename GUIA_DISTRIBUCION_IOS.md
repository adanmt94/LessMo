# 📱 Guía Completa de Distribución iOS - LessMo

## 🎯 Objetivo
Distribuir la app LessMo a 7 dispositivos iOS específicos mediante Ad Hoc Distribution.

---

## 📋 FASE 1: Hacerse Apple Developer (1-2 días)

### Paso 1.1: Inscripción
1. Ve a: https://developer.apple.com/programs/
2. Clic en **"Enroll"**
3. Inicia sesión con tu Apple ID
4. **Costo: $99 USD/año**
5. Completa el formulario con:
   - Nombre completo
   - Dirección
   - Teléfono de contacto
   - Información de facturación

### Paso 1.2: Tipo de Cuenta
- **Individual**: Para ti como persona física (recomendado para empezar)
- **Organización**: Requiere DUNS y documentos de empresa

### Paso 1.3: Pago y Aprobación
1. Paga con tarjeta de crédito/débito
2. **Espera aprobación**: 24-48 horas
3. Recibirás email de confirmación
4. Una vez aprobado, tendrás acceso a:
   - https://developer.apple.com/account

---

## 🔑 FASE 2: Obtener UDIDs de los 7 Dispositivos

### Opción A: Desde el propio iPhone
```
1. Ajustes > General > Información
2. Busca "Identificador del dispositivo" o "UDID"
3. Mantén pulsado y copia (40 caracteres alfanuméricos)
4. Envíalo por WhatsApp/Email
```

### Opción B: Desde Mac con cable
```
1. Conecta el iPhone al Mac
2. Abre Finder (macOS Catalina+) o iTunes (versiones antiguas)
3. Selecciona el dispositivo
4. Haz clic en el número de serie hasta que aparezca "UDID"
5. Click derecho > Copiar UDID
```

### Opción C: Usando la app UDID Sender (más fácil)
```
1. Instala "UDID Sender" desde App Store (gratis)
2. Abre la app
3. Click "Send UDID"
4. Envía por email/mensaje
```

### Plantilla para recopilar info:
```
Dispositivo 1:
- Nombre: iPhone de Juan
- UDID: 00008030-001234567890ABCD
- Modelo: iPhone 13 Pro

Dispositivo 2:
- Nombre: iPhone de María
- UDID: 00008030-XXXXXXXXX
- Modelo: iPhone 14

... (repite para los 7)
```

---

## 🏗️ FASE 3: Configurar Apple Developer Portal

### Paso 3.1: Registrar Dispositivos
1. Ve a: https://developer.apple.com/account/resources/devices
2. Click el botón **"+"** (añadir dispositivo)
3. Para cada dispositivo:
   ```
   - Platform: iOS
   - Device Name: "iPhone de Juan"
   - Device ID (UDID): pega el UDID
   ```
4. Click **"Continue"** y **"Register"**
5. **Repite para los 7 dispositivos**

### Paso 3.2: Crear App ID (Bundle Identifier)
1. Ve a: https://developer.apple.com/account/resources/identifiers
2. Click **"+"**
3. Selecciona **"App IDs"** > Continue
4. Configuración:
   ```
   - Platform: iOS
   - Description: LessMo
   - Bundle ID: Explicit
   - Bundle ID: com.lessmo.app (ya configurado en app.json)
   ```
5. Capabilities (marca las que uses):
   - ✅ Push Notifications
   - ✅ Sign in with Apple (si aplica)
   - ✅ Associated Domains (si tienes deep links)
6. Click **"Continue"** y **"Register"**

### Paso 3.3: Crear Certificado de Distribución
1. Ve a: https://developer.apple.com/account/resources/certificates
2. Click **"+"**
3. Selecciona **"Apple Distribution"**
4. Click **"Continue"**

**Generar Certificate Signing Request (CSR) en Mac:**
```
1. Abre "Acceso a Llaveros" (Keychain Access)
2. Menú: Acceso a Llaveros > Asistente de Certificados > Solicitar un certificado de una autoridad de certificación
3. Información:
   - Correo: tu email de Apple Developer
   - Nombre: Tu Nombre
   - Solicitud: Guardado en disco
4. Click "Continuar"
5. Guarda el archivo "CertificateSigningRequest.certSigningRequest"
```

**Volver al navegador:**
```
1. Upload el archivo CSR generado
2. Click "Continue"
3. Descarga el certificado (.cer)
4. Haz doble clic para instalarlo en tu Keychain
```

### Paso 3.4: Crear Provisioning Profile Ad Hoc
1. Ve a: https://developer.apple.com/account/resources/profiles
2. Click **"+"**
3. Selecciona **"Ad Hoc"** (para distribución a dispositivos específicos)
4. Click **"Continue"**
5. Selecciona tu **App ID** (com.lessmo.app)
6. Selecciona tu **Certificado de Distribución**
7. **Selecciona los 7 dispositivos** registrados
8. Profile Name: "LessMo Ad Hoc Profile"
9. Click **"Generate"**
10. **Descarga el perfil** (.mobileprovision)

---

## 🛠️ FASE 4: Configurar Proyecto Local

### Paso 4.1: Instalar Herramientas
```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Verificar instalación
eas --version

# Login en Expo
eas login
# Ingresa tu email y contraseña de Expo
```

### Paso 4.2: Configurar EAS Build
```bash
# Desde la raíz del proyecto
cd /Users/adanmonterotorres/Projects/LessMo/LessMo

# Configurar EAS (si no está configurado)
eas build:configure

# Configurar credenciales Apple
eas credentials
```

**EAS te pedirá:**
```
1. Apple ID: tu email de Apple Developer
2. Password: Genera una contraseña específica de app:
   - Ve a: https://appleid.apple.com
   - Security > App-Specific Passwords
   - Genera una nueva
   - Usa esa contraseña en EAS

3. Team ID: 
   - Ve a: https://developer.apple.com/account/#/membership
   - Copia el "Team ID" (10 caracteres alfanuméricos)
```

---

## 🚀 FASE 5: Crear la Build Ad Hoc

### Opción A: Build Ad Hoc (Recomendado para 7 dispositivos)
```bash
# Crear build Ad Hoc
eas build --platform ios --profile adhoc

# EAS te preguntará:
# - ¿Generar credenciales? → Yes (primera vez)
# - ¿Usar credenciales existentes? → Yes (siguientes veces)
```

**El proceso tomará 15-30 minutos:**
```
✓ Subiendo código a EAS
✓ Instalando dependencias
✓ Building iOS app
✓ Firmando con certificado Ad Hoc
✓ Generando .ipa
```

### Opción B: TestFlight (Alternativa más profesional)
```bash
# Build para TestFlight (distribución más fácil)
eas build --platform ios --profile production

# Luego submit a TestFlight
eas submit --platform ios
```

**Ventajas TestFlight:**
- No necesitas UDIDs
- Hasta 100 testers externos
- Actualizaciones automáticas
- Beta testing más profesional

---

## 📦 FASE 6: Distribuir la App

### Si usaste Ad Hoc (.ipa):

#### Opción 1: TestFlight (más fácil)
```
1. Sube el .ipa a App Store Connect:
   - Ve a: https://appstoreconnect.apple.com
   - My Apps > LessMo > TestFlight
   - Upload build
   
2. Invita a los 7 usuarios:
   - TestFlight > Testers > Add Testers
   - Email de cada persona
   - Recibirán invitación por email
   
3. Los usuarios:
   - Instalan "TestFlight" desde App Store
   - Aceptan invitación
   - Instalan LessMo desde TestFlight
```

#### Opción 2: Distribución directa con Diawi (sin App Store Connect)
```bash
# Descarga el .ipa de EAS
eas build:list

# Sube a Diawi.com:
1. Ve a: https://www.diawi.com
2. Arrastra el archivo .ipa
3. Configura:
   - Title: LessMo
   - Find by UDID: ON (importante para Ad Hoc)
   - Password: (opcional)
4. Upload
5. Comparte el link QR con los 7 usuarios
6. Escanean QR y descargan desde Safari
```

#### Opción 3: Distribución por cable (Mac necesario)
```
1. Conecta cada iPhone al Mac
2. Abre Xcode > Window > Devices and Simulators
3. Arrastra el .ipa al dispositivo
4. Confía en el certificado en:
   Ajustes > General > VPN y gestión de dispositivos
```

---

## ⚙️ FASE 7: Instalación en los Dispositivos

### Para los 7 usuarios (con TestFlight):
```
1. Instala "TestFlight" desde App Store (gratis)
2. Revisa tu email de invitación
3. Click en "View in TestFlight"
4. Acepta la invitación
5. Click "Install" en LessMo
6. ¡Listo! La app se instalará
```

### Para los 7 usuarios (con Diawi/enlace directo):
```
1. Abre Safari (no Chrome)
2. Escanea el QR o abre el enlace
3. Click "Install"
4. Confirma la instalación
5. Ve a: Ajustes > General > VPN y gestión de dispositivos
6. Confía en el perfil de "Tú Nombre/Empresa"
7. Abre LessMo desde el Home
```

---

## 🔄 FASE 8: Actualizaciones Futuras

### Cuando hagas cambios:
```bash
# 1. Incrementa la versión en app.json:
"version": "1.0.1"  # antes: "1.0.0"

# 2. Crea nueva build
eas build --platform ios --profile adhoc

# 3. Los usuarios:
# - Con TestFlight: Reciben notificación automática
# - Con Diawi: Sube nuevo .ipa y envía nuevo link
```

---

## 📊 Resumen de Costos

| Concepto | Costo | Frecuencia |
|----------|-------|------------|
| Apple Developer Program | $99 USD | Anual |
| EAS Build (Expo) | Gratis (límite 30 builds/mes) | - |
| TestFlight | Gratis | - |
| Diawi | Gratis | - |
| **TOTAL AÑO 1** | **$99 USD** | - |

---

## ⏱️ Timeline Estimado

| Fase | Tiempo |
|------|--------|
| Inscripción Apple Developer | 24-48 horas |
| Configurar Developer Portal | 30-60 min |
| Obtener UDIDs de 7 dispositivos | 15-30 min |
| Configurar proyecto local | 15 min |
| Primera build con EAS | 20-30 min |
| Distribución a dispositivos | 10 min |
| **TOTAL** | **2-3 días** |

---

## 🆘 Solución de Problemas Comunes

### Problema: "No se puede instalar la app"
```
Solución:
1. Verifica que el UDID esté registrado correctamente
2. El Provisioning Profile debe incluir ese UDID
3. Regenera el profile si agregaste dispositivos nuevos
```

### Problema: "No se confía en el desarrollador"
```
Solución:
Ajustes > General > VPN y gestión de dispositivos > 
Confiar en "[Tu Nombre]"
```

### Problema: "Build falló en EAS"
```
Solución:
1. Revisa logs: eas build:list
2. Verifica credenciales: eas credentials
3. Asegúrate de tener certificado válido
```

### Problema: "Límite de 30 builds/mes alcanzado"
```
Solución:
- Upgrade a EAS Production plan: $29/mes
- O usa plan gratuito y espera al próximo mes
```

---

## 📱 Comandos Rápidos de Referencia

```bash
# Ver todas las builds
eas build:list

# Ver estado de una build específica
eas build:view [BUILD_ID]

# Cancelar una build en progreso
eas build:cancel

# Ver/configurar credenciales
eas credentials

# Limpiar caché y reconstruir
eas build --platform ios --profile adhoc --clear-cache

# Ver logs de una build
eas build:view --log [BUILD_ID]

# Login/Logout
eas login
eas logout

# Ver información del proyecto
eas project:info
```

---

## 🎓 Recursos Adicionales

- **Expo EAS Docs**: https://docs.expo.dev/build/introduction/
- **Apple Developer**: https://developer.apple.com
- **TestFlight**: https://developer.apple.com/testflight/
- **Diawi**: https://www.diawi.com
- **UDID Finder**: https://get.udid.io/

---

## ✅ Checklist Final

Antes de empezar, asegúrate de tener:

- [ ] Cuenta Apple Developer activa ($99/año pagados)
- [ ] Los 7 UDIDs de dispositivos iOS
- [ ] Mac con Xcode instalado (para certificados)
- [ ] Cuenta Expo configurada
- [ ] EAS CLI instalado globalmente
- [ ] Proyecto LessMo actualizado y sin errores
- [ ] Bundle Identifier configurado: `com.lessmo.app`
- [ ] Permisos de cámara/fotos en app.json

---

## 🚀 Inicio Rápido (Resumen)

```bash
# 1. Instalar herramientas
npm install -g eas-cli
eas login

# 2. Configurar credenciales
eas credentials

# 3. Crear build Ad Hoc
eas build --platform ios --profile adhoc

# 4. Esperar 15-30 minutos

# 5. Distribuir:
# - TestFlight: eas submit --platform ios
# - Diawi: Sube el .ipa descargado
# - Cable: Arrastra .ipa en Xcode

# 6. Los 7 usuarios instalan desde TestFlight o enlace
```

---

**¡Éxito con tu distribución! 🎉**

Si tienes problemas, revisa los logs de EAS y la documentación oficial de Apple Developer.
