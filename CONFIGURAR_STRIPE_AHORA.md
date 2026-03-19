# 🚀 CONFIGURAR STRIPE AHORA - Guía Rápida

**Tiempo estimado: 30 minutos**

---

## ✅ PASO 1: CREAR CUENTA STRIPE (5 minutos)

### 1.1 Registro
1. Abre: [https://stripe.com](https://stripe.com)
2. Click en **"Start now"** o **"Sign up"**
3. Rellena el formulario:
   - Email: [tu email]
   - Nombre completo
   - País: **España**
   - Contraseña segura

### 1.2 Verificar Email
- Revisa tu bandeja de entrada
- Click en el link de verificación

### 1.3 Acceder al Dashboard
- Login en: [https://dashboard.stripe.com](https://dashboard.stripe.com)
- Verás el dashboard en **modo TEST** (perfecto para empezar)

✅ **Cuenta creada (GRATIS)**

---

## 🔑 PASO 2: OBTENER API KEYS (2 minutos)

### 2.1 Ir a API Keys
1. En el Dashboard de Stripe
2. Click en **Developers** (arriba a la derecha)
3. Click en **API keys**
4. Verás dos claves en **modo TEST**:

```
Publishable key (empieza con pk_test_XXXXX...)
Secret key (empieza con sk_test_XXXXX...) [mostrar/ocultar]
```

### 2.2 Copiar las Keys
- **Publishable key**: Click en el icono de copiar 📋
- **Secret key**: Click en "Reveal test key" → Copiar 📋

⚠️ **IMPORTANTE:** Guarda las keys en un lugar seguro temporalmente (las usarás ahora)

---

## 📝 PASO 3: CONFIGURAR .ENV (1 minuto)

### 3.1 Crear/Editar archivo .env

En la raíz de tu proyecto (`/Users/adanmonterotorres/Projects/LessMo/LessMo/`), crea o edita `.env`:

```bash
# ========================================
# STRIPE CONFIGURATION (TEST MODE)
# ========================================
STRIPE_PUBLISHABLE_KEY=pk_test_REEMPLAZA_CON_TU_CLAVE
STRIPE_SECRET_KEY=sk_test_REEMPLAZA_CON_TU_CLAVE_SECRETA

# Apple Pay Configuration
APPLE_MERCHANT_ID=merchant.com.lessmo.app

# ========================================
# EXISTING CONFIGURATION (mantener)
# ========================================
FIREBASE_API_KEY=AIzaSyDfqzWAP896weun6oafS1KraH4ZIdk_ll4
FIREBASE_AUTH_DOMAIN=lessmo-9023f.firebaseapp.com
FIREBASE_PROJECT_ID=lessmo-9023f
FIREBASE_STORAGE_BUCKET=lessmo-9023f.appspot.com
FIREBASE_MESSAGING_SENDER_ID=364537925711
FIREBASE_APP_ID=1:364537925711:web:145b2f74d691c58b905a3a

GOOGLE_ANDROID_CLIENT_ID=364537925711-8k9moeddmi8n3b56ipchr37j1l14vvff.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=364537925711-vtgqi80bk7i7f3ioqo8gilafo7hjj0vc.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=364537925711-vtgqi80bk7i7f3ioqo8gilafo7hjj0vc.apps.googleusercontent.com

PAYPAL_ME_USERNAME=tu-usuario-paypal
```

### 3.2 Reemplazar con tus Keys
- Reemplaza `pk_test_51xxx...` con tu Publishable Key real
- Reemplaza `sk_test_51xxx...` con tu Secret Key real

### 3.3 Guardar archivo
- Guarda el archivo `.env`
- **NO lo subas a Git** (ya está en .gitignore)

---

## 🍎 PASO 4: CREAR APPLE MERCHANT ID (10 minutos)

### 4.1 Acceder a Apple Developer
1. Ve a: [https://developer.apple.com/account](https://developer.apple.com/account)
2. Login con tu Apple ID de desarrollador

### 4.2 Crear Merchant ID
1. Click en **Certificates, Identifiers & Profiles**
2. En el menú izquierdo: **Identifiers**
3. Click en el botón **+** (arriba a la izquierda)
4. Selecciona **Merchant IDs**
5. Click **Continue**

### 4.3 Configurar Merchant ID
- **Description**: `LessMo Payments`
- **Identifier**: `merchant.com.lessmo.app`
- Click **Continue**
- Click **Register**

### 4.4 Habilitar en tu App ID
1. Vuelve a **Identifiers**
2. Busca tu App ID: `com.lessmo.app`
3. Click en él para editarlo
4. Busca **Apple Pay Payment Processing**
5. Marca el checkbox ✅
6. Click **Edit**
7. Selecciona tu Merchant ID: `merchant.com.lessmo.app`
8. Click **Continue** → **Save**

✅ **Apple Pay configurado**

---

## 🔥 PASO 5: CONFIGURAR FIREBASE FUNCTIONS (10 minutos)

### 5.1 Instalar Stripe en Functions
```bash
cd functions
npm install stripe
cd ..
```

### 5.2 Configurar Secret Key en Firebase
```bash
firebase functions:config:set stripe.secret_key="TU_SECRET_KEY_AQUI"
```
(Reemplaza TU_SECRET_KEY_AQUI con tu Secret Key real de Stripe)

### 5.3 Agregar código a functions/src/index.ts

Si `functions/src/index.ts` existe, añade al final:

```typescript
// Importar funciones de Stripe
export { createPaymentIntent, stripeWebhook, createRefund, getPaymentStatus } from './stripe';
```

Si NO existe, créalo:

```typescript
import * as functions from 'firebase-functions';

// Exportar funciones de Stripe
export { createPaymentIntent, stripeWebhook, createRefund, getPaymentStatus } from './stripe';
```

### 5.4 Desplegar Functions
```bash
firebase deploy --only functions
```

Espera 2-3 minutos. Verás:
```
✔  functions[createPaymentIntent(us-central1)]: Successful create operation.
✔  Deploy complete!
```

### 5.5 Copiar URL de la función
La URL será algo como:
```
https://us-central1-lessmo-9023f.cloudfunctions.net/createPaymentIntent
```

### 5.6 Actualizar stripeService.ts

Abre: `src/services/stripeService.ts`

Busca la línea 127:
```typescript
const backendUrl = 'YOUR_BACKEND_URL/create-payment-intent';
```

Reemplaza con:
```typescript
const backendUrl = 'https://us-central1-lessmo-9023f.cloudfunctions.net/createPaymentIntent';
```

Guarda el archivo.

---

## 🧪 PASO 6: PROBAR EN TU APP (5 minutos)

### 6.1 Reiniciar Metro Bundler
```bash
npx expo start --clear
```

### 6.2 Abrir en dispositivo
- iOS: Escanea QR con Expo Go
- Android: Escanea QR con Expo Go

### 6.3 Probar Pago con Tarjeta Test

En la app:
1. Ve a un evento con gastos
2. Haz clic en "Pagar"
3. Selecciona **"Stripe"** como método
4. Introduce tarjeta de prueba:
   - Número: `4242 4242 4242 4242`
   - Fecha: `12/34` (cualquier fecha futura)
   - CVV: `123`
   - Código postal: `12345`
5. Click en **"Pagar"**

### 6.4 Verificar en Stripe Dashboard
1. Ve a: [https://dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments)
2. Deberías ver el pago que acabas de hacer
3. Status: **Succeeded** ✅

---

## ✅ CHECKLIST - ¿TODO FUNCIONA?

- [ ] Cuenta Stripe creada
- [ ] API Keys copiadas
- [ ] Archivo .env configurado
- [ ] Apple Merchant ID creado
- [ ] Apple Pay habilitado en App ID
- [ ] Stripe instalado en functions
- [ ] Firebase Functions desplegadas
- [ ] stripeService.ts actualizado con URL
- [ ] Metro bundler reiniciado
- [ ] Pago de prueba exitoso
- [ ] Pago visible en Dashboard Stripe

---

## 🎯 ¿QUÉ PUEDES HACER AHORA?

### Puedes probar:
✅ **Tarjetas de crédito/débito** (entrada manual)
✅ **Dashboard de Stripe** (ver todos los pagos)
✅ **Diferentes montos** (cualquier cantidad)

### Aún NO puedes probar:
❌ **Apple Pay** - Requiere build nativa de iOS (no funciona en Expo Go)
❌ **Google Pay** - Requiere build nativa de Android (no funciona en Expo Go)

### Para probar Apple Pay/Google Pay:
Necesitas crear un build:
```bash
# iOS
npx eas build --platform ios --profile development

# Android  
npx eas build --platform android --profile development
```
Luego instala el build en tu dispositivo físico.

---

## 🚨 PROBLEMAS COMUNES

### Error: "No publishable key provided"
- Verifica que `.env` existe en la raíz
- Verifica que las keys están bien copiadas
- Reinicia Metro: `npx expo start --clear`

### Error: "Failed to create payment intent"
- Verifica que Firebase Function está desplegada
- Revisa logs: `firebase functions:log`
- Confirma que Secret Key está en Firebase config

### Error: "Merchant ID not configured"
- Ve a Apple Developer → Identifiers
- Verifica que `merchant.com.lessmo.app` existe
- Verifica que está asociado a tu App ID

### Pago no aparece en Dashboard
- Asegúrate de estar en modo **TEST** (toggle arriba)
- Refresh la página del Dashboard
- Espera 10-20 segundos

---

## 📚 DOCUMENTACIÓN COMPLETA

Para más detalles, consulta:
- **`STRIPE_SETUP_GUIDE.md`** - Guía completa paso a paso
- **Stripe Docs**: [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Testing**: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## 💰 RECUERDA

### Modo TEST (actual):
- ✅ GRATIS - Uso ilimitado
- ✅ No cobra dinero real
- ✅ Usa tarjetas de prueba
- ✅ Perfecto para desarrollo

### Modo LIVE (producción):
- ❌ Necesita verificar cuenta (documentos)
- ❌ Cobra dinero REAL
- ✅ Comisión: **1.5% + €0.25** por pago
- ✅ Sin cuotas mensuales

**No cambies a LIVE hasta que todo funcione en TEST**

---

## ✨ ¡LISTO!

Si completaste todos los pasos, ya tienes:
- ✅ Stripe funcionando en modo TEST
- ✅ Puedes procesar pagos con tarjeta
- ✅ €0 de coste (todo gratis en TEST)

**Próximo paso:** Crear build nativa para probar Apple Pay/Google Pay

¿Algún problema? Revisa la sección de **PROBLEMAS COMUNES** arriba.

---

**Última actualización:** 11 de diciembre de 2025
