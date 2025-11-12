# 🔐 Guía Completa: Agregar Test Users para Google Sign-In

## 🎯 ¿Por Qué Necesitas Test Users?

Cuando tu app OAuth está en modo **"Testing"** (no publicada), Google **solo permite** iniciar sesión a:
1. El propietario del proyecto
2. Usuarios agregados explícitamente como "Test Users"

Si intentas iniciar sesión con cualquier otra cuenta, verás:
❌ **"Acceso bloqueado: Error de autorización"**

---

## 📋 Paso a Paso: Agregar Test Users

### Paso 1: Acceder a Google Cloud Console

1. **Abre tu navegador**
2. **Ve a**: https://console.cloud.google.com
3. **Inicia sesión** con tu cuenta de Google
4. **Selecciona tu proyecto**: `lessmo-9023f`

---

### Paso 2: Ir a OAuth Consent Screen

En la barra lateral izquierda:

1. Click en **"APIs & Services"** (ícono de una llave 🔑)
2. Click en **"OAuth consent screen"**

O usa el link directo:
```
https://console.cloud.google.com/apis/credentials/consent?project=lessmo-9023f
```

---

### Paso 3: Verificar Publishing Status

En la parte superior verás:

```
┌─────────────────────────────────────────┐
│  Publishing status: [Testing] ⚠️         │
│                                         │
│  [PUBLISH APP]  [BACK TO TESTING]      │
└─────────────────────────────────────────┘
```

**Estados posibles:**
- **Testing** ⚠️ → Solo test users pueden iniciar sesión
- **In production** ✅ → Cualquier persona puede iniciar sesión

---

### Paso 4: Agregar Test Users

Scroll hacia abajo hasta la sección **"Test users"**:

```
┌─────────────────────────────────────────┐
│  Test users                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  You have 0 test users                  │
│                                         │
│  [+ ADD USERS]                          │
└─────────────────────────────────────────┘
```

1. **Click en "+ ADD USERS"**

2. Se abrirá un modal:
   ```
   ┌─────────────────────────────────────────┐
   │  Add test users                         │
   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
   │                                         │
   │  Enter email addresses, separated by   │
   │  commas or new lines                    │
   │                                         │
   │  ┌───────────────────────────────────┐ │
   │  │ tu@email.com                      │ │
   │  │ otro@email.com                    │ │
   │  └───────────────────────────────────┘ │
   │                                         │
   │         [CANCEL]        [SAVE]          │
   └─────────────────────────────────────────┘
   ```

3. **Escribe tus emails** (uno por línea o separados por comas):
   - El email que usas para iniciar sesión
   - Emails de otros usuarios que quieras que prueben la app

4. **Click en "SAVE"**

---

### Paso 5: Verificar Test Users Agregados

Ahora deberías ver:

```
┌─────────────────────────────────────────┐
│  Test users                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  You have 2 test users                  │
│                                         │
│  ✉️ tu@email.com                         │
│  ✉️ otro@email.com                       │
│                                         │
│  [+ ADD USERS]                          │
└─────────────────────────────────────────┘
```

✅ ¡Listo! Estos usuarios ya pueden iniciar sesión.

---

## 🚀 Publicar App a Producción (Opcional)

Si quieres que **cualquier persona** pueda iniciar sesión sin ser test user:

### Opción 1: Publicar tu App

1. En **OAuth consent screen**, scroll arriba
2. Click en **"PUBLISH APP"**
3. Confirma la publicación

⚠️ **Nota**: Una vez publicada, puede que Google requiera verificación si pides scopes sensibles.

### Opción 2: Mantener en Testing y agregar users según necesites

Más seguro para desarrollo. Puedes agregar hasta **100 test users**.

---

## 🧪 Probar que Funciona

### Antes de agregar test user:
```
❌ Acceso bloqueado: Error de autorización
```

### Después de agregar test user:
```
✅ Selecciona tu cuenta Google
✅ Acepta permisos
✅ Inicia sesión correctamente
```

---

## 📊 Checklist de Verificación

Antes de probar Google Sign-In, verifica:

- [ ] ✅ Google habilitado en Firebase Authentication
- [ ] ✅ SHA-1/SHA-256 agregados (Android)
- [ ] ✅ OAuth consent screen configurado
- [ ] ✅ **Tu email agregado como Test User** ← IMPORTANTE
- [ ] ✅ Publishing status en "Testing" o "In production"
- [ ] ✅ Client IDs correctos en `.env`
- [ ] ✅ App rebuildeada con `npx expo start --clear`

---

## 🐛 Troubleshooting

### Error: "This app is blocked"

**Causa**: Tu email NO está en test users y la app está en Testing mode.

**Solución**:
1. Ve a OAuth consent screen
2. Agrega tu email en Test users
3. Espera 1-2 minutos
4. Intenta de nuevo

---

### Error: "Access blocked: This app's request is invalid"

**Causa**: Problema con la configuración OAuth (Client IDs, Bundle ID, etc.)

**Solución**:
1. Verifica que los Client IDs en `.env` sean correctos
2. Verifica que el Bundle ID sea `com.lessmo.app` en Firebase y Google Cloud
3. Descarga archivos de configuración actualizados

---

### Error: "The developer hasn't given you access to this app"

**Causa**: Exactamente lo mismo que "This app is blocked" - no estás en test users.

**Solución**:
Agrégat como test user siguiendo los pasos arriba.

---

## 💡 Consejos

1. **Agrega múltiples emails** si trabajas en equipo
2. **Usa tu email personal** para testing (no un email temporal)
3. **Espera 1-2 minutos** después de agregar test users antes de probar
4. **Cierra sesión de Google** en el navegador y vuelve a intentar si sigue fallando
5. **Usa modo incógnito** para probar con diferentes cuentas

---

## 🎯 Estado Ideal para Desarrollo

```
✅ Publishing status: Testing
✅ Test users: 1-5 usuarios agregados
✅ User support email: Tu email
✅ App name: LessMo
✅ App logo: (opcional)
✅ Scopes: email, profile (básicos)
```

---

## 📸 Captura Visual

Tu OAuth consent screen debería verse así:

```
╔═══════════════════════════════════════════════╗
║  OAuth consent screen                         ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                               ║
║  Publishing status: Testing ⚠️                 ║
║  [PUBLISH APP]                                ║
║                                               ║
║  ──────────────────────────────────────────  ║
║                                               ║
║  App information                              ║
║  App name: LessMo                             ║
║  User support email: tu@email.com             ║
║  App logo: [Upload]                           ║
║                                               ║
║  ──────────────────────────────────────────  ║
║                                               ║
║  App domain                                   ║
║  Application home page: (optional)            ║
║  Privacy policy: (optional)                   ║
║                                               ║
║  ──────────────────────────────────────────  ║
║                                               ║
║  Authorized domains                           ║
║  • firebaseapp.com                            ║
║  • lessmo-9023f.firebaseapp.com               ║
║                                               ║
║  ──────────────────────────────────────────  ║
║                                               ║
║  Developer contact information                ║
║  Email: tu@email.com                          ║
║                                               ║
║  ──────────────────────────────────────────  ║
║                                               ║
║  Test users ← AQUÍ AGREGAR USUARIOS           ║
║  You have 1 test user                         ║
║  • tu@email.com                               ║
║  [+ ADD USERS]                                ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

---

¡Con esto ya puedes agregar test users! 🎉
