# 💳 GUÍA DE CONFIGURACIÓN STRIPE + APPLE PAY + GOOGLE PAY

Esta guía te explica cómo configurar pagos reales en LessMo usando Stripe.

---

## 📋 TABLA DE CONTENIDOS

1. [Crear Cuenta Stripe](#1-crear-cuenta-stripe)
2. [Obtener API Keys](#2-obtener-api-keys)
3. [Configurar Variables de Entorno](#3-configurar-variables-de-entorno)
4. [Configurar Apple Pay](#4-configurar-apple-pay)
5. [Configurar Backend (Firebase Functions)](#5-configurar-backend)
6. [Probar en Modo Test](#6-probar-en-modo-test)
7. [Activar Modo Producción](#7-activar-modo-producción)
8. [Costes y Comisiones](#8-costes-y-comisiones)

---

## 1️⃣ CREAR CUENTA STRIPE

### Paso 1: Registro
1. Ve a [https://stripe.com](https://stripe.com)
2. Click en "Start now" o "Sign up"
3. Completa el formulario:
   - Email
   - Nombre completo
   - País: **España** (o tu país)
   - Contraseña

### Paso 2: Verificar Email
- Revisa tu correo y verifica la cuenta

### Paso 3: Completar Perfil
- Dashboard → Settings → Business settings
- Completa:
  - Nombre del negocio: **LessMo**
  - Tipo: Individual o Company
  - Información fiscal (NIE/NIF/CIF)

✅ **Ya tienes cuenta Stripe (GRATIS)**

---

## 2️⃣ OBTENER API KEYS

### Paso 1: Ir a API Keys
1. Dashboard de Stripe
2. Developers → [API keys](https://dashboard.stripe.com/test/apikeys)

### Paso 2: Copiar Keys
Verás dos keys:

**🧪 TEST MODE** (para desarrollo):
```
Publishable key: pk_test_51...
Secret key: sk_test_51...
```

**🚀 LIVE MODE** (para producción):
```
Publishable key: pk_live_51...
Secret key: sk_live_51...
```

> ⚠️ **NUNCA compartas tu Secret Key públicamente**

### Paso 3: Guardar Keys
- Copia la **Publishable key** de TEST
- La necesitarás en el siguiente paso

---

## 3️⃣ CONFIGURAR VARIABLES DE ENTORNO

### Opción A: Archivo .env (Desarrollo Local)

Crea o edita el archivo `.env` en la raíz del proyecto:

```bash
# Stripe Configuration (TEST MODE)
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Apple Pay (opcional, se puede usar el default)
APPLE_MERCHANT_ID=merchant.com.lessmo.app

# Otros métodos de pago existentes
PAYPAL_ME_USERNAME=tu-usuario-paypal
```

### Opción B: EAS Secrets (Expo Build)

Para builds con EAS:

```bash
# Agregar secrets a Expo
npx eas secret:create --scope project --name STRIPE_PUBLISHABLE_KEY --value pk_test_51...
npx eas secret:create --scope project --name STRIPE_SECRET_KEY --value sk_test_51...
npx eas secret:create --scope project --name APPLE_MERCHANT_ID --value merchant.com.lessmo.app
```

---

## 4️⃣ CONFIGURAR APPLE PAY

### Requisitos:
- ✅ Apple Developer Account ($99/año)
- ✅ Ya lo tienes

### Paso 1: Crear Merchant ID

1. Ve a [Apple Developer Portal](https://developer.apple.com/account)
2. Certificates, Identifiers & Profiles
3. Identifiers → **+** (crear nuevo)
4. Selecciona **Merchant IDs**
5. Completa:
   - Description: `LessMo Payments`
   - Identifier: `merchant.com.lessmo.app`
6. Click **Continue** y **Register**

### Paso 2: Crear Merchant ID Certificate (para Stripe)

1. Ve al Merchant ID recién creado
2. Click en **Create Certificate**
3. **NO** uses la opción normal, sigue estos pasos:

**Opción A: Dejar que Stripe lo gestione (Recomendado)**
- Stripe puede gestionar los certificados automáticamente
- Dashboard Stripe → Settings → Apple Pay → "Add domain"
- Sigue las instrucciones

**Opción B: Certificado manual**
1. Dashboard Stripe → Settings → Apple Pay
2. Download el CSR file de Stripe
3. Sube el CSR a Apple Developer
4. Descarga el certificado generado
5. Súbelo de vuelta a Stripe

### Paso 3: Registrar Bundle ID

1. Identifiers → App IDs
2. Busca tu app: `com.lessmo.app`
3. Edita → Capabilities
4. Activa **Apple Pay**
5. Selecciona tu Merchant ID: `merchant.com.lessmo.app`
6. Save

### Paso 4: Actualizar app.config.js

Ya está configurado en el código, pero verifica que esté así:

```javascript
ios: {
  bundleIdentifier: "com.lessmo.app",
  associatedDomains: ["applinks:lessmo.app"],
  // ... resto de config
}
```

✅ **Apple Pay configurado**

---

## 5️⃣ CONFIGURAR BACKEND (Firebase Functions)

Stripe requiere un backend para crear Payment Intents de forma segura.

### Paso 1: Crear Firebase Function

Crea `functions/src/stripe.ts`:

```typescript
import * as functions from 'firebase-functions';
import Stripe from 'stripe';

// Inicializar Stripe con tu Secret Key
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

/**
 * Crear Payment Intent
 * Endpoint: https://us-central1-lessmo-9023f.cloudfunctions.net/createPaymentIntent
 */
export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    // Validar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuario no autenticado'
      );
    }

    const { amount, currency, description, metadata } = data;

    // Validar datos
    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Monto inválido'
      );
    }

    // Crear Payment Intent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // en centavos
      currency: currency.toLowerCase(),
      description,
      metadata: {
        userId: context.auth.uid,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    };
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### Paso 2: Instalar Dependencias

```bash
cd functions
npm install stripe
```

### Paso 3: Configurar Secret Key en Firebase

```bash
firebase functions:config:set stripe.secret_key="sk_test_51..."
```

### Paso 4: Desplegar Function

```bash
firebase deploy --only functions
```

### Paso 5: Actualizar stripeService.ts

Reemplaza `YOUR_BACKEND_URL` con tu función:

```typescript
const backendUrl = 'https://us-central1-lessmo-9023f.cloudfunctions.net/createPaymentIntent';
```

✅ **Backend configurado**

---

## 6️⃣ PROBAR EN MODO TEST

### Tarjetas de Prueba

Usa estas tarjetas en modo test:

| Tarjeta | Número | CVV | Fecha | Resultado |
|---------|--------|-----|-------|-----------|
| Visa | 4242 4242 4242 4242 | 123 | 12/34 | ✅ Éxito |
| Mastercard | 5555 5555 5555 4444 | 123 | 12/34 | ✅ Éxito |
| Error | 4000 0000 0000 0002 | 123 | 12/34 | ❌ Declined |
| 3D Secure | 4000 0027 6000 3184 | 123 | 12/34 | 🔐 Requiere auth |

Más tarjetas: [Stripe Testing](https://stripe.com/docs/testing)

### Probar Apple Pay

1. Abre la app en un iPhone físico (no Simulator)
2. Ve a Wallet → Añade una tarjeta TEST
3. Intenta un pago con Apple Pay
4. Verifica en Dashboard Stripe → Payments

### Verificar en Dashboard

1. Dashboard Stripe (modo TEST)
2. Payments → verás todos los pagos test
3. Click en cada pago para ver detalles

✅ **Todo funciona? Continúa al paso 7**

---

## 7️⃣ ACTIVAR MODO PRODUCCIÓN

### ⚠️ IMPORTANTE: Antes de activar producción

1. **Verificación de cuenta Stripe:**
   - Dashboard → Complete your account
   - Sube documentos requeridos (DNI/NIE, datos bancarios)
   - Espera aprobación (1-2 días hábiles)

2. **Prueba exhaustiva en TEST:**
   - Prueba todos los flujos
   - Apple Pay, Google Pay, Tarjetas
   - Errores y rechazos
   - Reembolsos

### Paso 1: Cambiar a Live Keys

**En .env:**
```bash
# Cambiar de pk_test a pk_live
STRIPE_PUBLISHABLE_KEY=pk_live_51xxxx...
STRIPE_SECRET_KEY=sk_live_51xxxx...
```

**En Firebase Functions:**
```bash
firebase functions:config:set stripe.secret_key="sk_live_51..."
firebase deploy --only functions
```

**En EAS:**
```bash
npx eas secret:create --scope project --name STRIPE_PUBLISHABLE_KEY --value pk_live_51... --force
npx eas secret:create --scope project --name STRIPE_SECRET_KEY --value sk_live_51... --force
```

### Paso 2: Build Producción

```bash
# iOS
npx eas build --platform ios --profile production

# Android
npx eas build --platform android --profile production
```

### Paso 3: Activar Apple Pay en Producción

1. Dashboard Stripe → Settings → Apple Pay
2. Add domain: `lessmo.app` (tu dominio real)
3. Verifica el dominio

### Paso 4: Primer Pago Real

1. Instala build de producción
2. Haz un pago pequeño (€0.50)
3. Verifica en Dashboard Stripe (LIVE mode)
4. Confirma que el dinero llegó a tu cuenta

✅ **¡Producción activa!**

---

## 8️⃣ COSTES Y COMISIONES

### Stripe Europa (España)

**Comisiones estándar:**
- Tarjetas europeas: **1.5% + €0.25** por transacción
- Tarjetas internacionales: **2.9% + €0.25**
- Apple Pay: **1.5% + €0.25** (igual que tarjetas)
- Google Pay: **1.5% + €0.25**

**Sin costes fijos:**
- ❌ Sin cuota mensual
- ❌ Sin coste de setup
- ❌ Sin mínimos de transacciones
- ❌ Sin coste por cuenta inactiva

**Ejemplos:**

| Pago | Comisión Stripe | Recibes |
|------|----------------|---------|
| €10.00 | €0.40 | €9.60 |
| €50.00 | €1.00 | €49.00 |
| €100.00 | €1.75 | €98.25 |

### Comparación con otros métodos

| Método | Comisión | Ventajas |
|--------|----------|----------|
| Stripe | 1.5% + €0.25 | ✅ Integrado, Apple Pay, Google Pay |
| PayPal | 2.9% + €0.35 | 🔗 Solo enlaces externos |
| Bizum | €0.50-€1 | ❌ Requiere acuerdo bancario |
| Transferencia | €0 (gratis) | ⏰ Lento (1-2 días) |

---

## 🆘 SOPORTE Y AYUDA

### Problemas Comunes

**Error: "No publishable key provided"**
- Verifica que `.env` tiene `STRIPE_PUBLISHABLE_KEY`
- Reinicia metro bundler: `npx expo start --clear`

**Apple Pay no aparece**
- Solo funciona en dispositivos iOS reales (no Simulator)
- Verifica que hay tarjetas en Wallet
- Confirma que Merchant ID está configurado

**Payment Intent creation failed**
- Verifica que Firebase Function está desplegada
- Revisa logs: `firebase functions:log`
- Confirma que Secret Key está en config

**"Stripe account not verified"**
- Completa verificación en Dashboard
- Sube documentos requeridos
- Espera 1-2 días hábiles

### Recursos

- [Documentación Stripe](https://stripe.com/docs)
- [Stripe React Native](https://github.com/stripe/stripe-react-native)
- [Apple Pay Guide](https://stripe.com/docs/apple-pay)
- [Testing Cards](https://stripe.com/docs/testing)
- [Soporte Stripe](https://support.stripe.com/)

---

## ✅ CHECKLIST FINAL

Antes de lanzar a producción:

- [ ] Cuenta Stripe verificada
- [ ] Apple Merchant ID creado
- [ ] Firebase Function desplegada
- [ ] Probado en modo TEST (todas las tarjetas)
- [ ] Apple Pay probado en iPhone real
- [ ] Variables de entorno en producción
- [ ] Build de producción generado
- [ ] Primer pago real exitoso
- [ ] Dashboard Stripe monitoreado

---

## 🎉 ¡LISTO!

Ahora tienes pagos reales con:
- ✅ Apple Pay (iPhone con Face ID/Touch ID)
- ✅ Google Pay (Android)
- ✅ Tarjetas de crédito/débito
- ✅ Seguridad de Stripe
- ✅ Comisiones transparentes

**Solo pagas cuando la gente paga (1.5% + €0.25)**

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0
