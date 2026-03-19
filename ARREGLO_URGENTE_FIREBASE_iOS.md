# 🚨 ARREGLO URGENTE - Firebase iOS Bloqueado

## ❌ ERROR ACTUAL:
```
Firebase: Error (auth/requests-from-this-ios-client-application-<empty>-are-blocked.)
```

## 🔧 SOLUCIÓN INMEDIATA:

### 1. Habilitar Bundle ID en Firebase Console

**Ve a:** https://console.firebase.google.com/project/lessmo-9023f/settings/general

#### En la sección de "Tus apps":

1. **Click en tu app iOS**
2. Verás el **Bundle ID**: `com.lessmo.app`
3. Scroll hacia abajo hasta "API Key Restrictions"
4. **IMPORTANTE**: Asegúrate de que el Bundle ID esté autorizado

#### Si no aparece la app iOS o está mal configurada:

1. **Eliminar app iOS** (si existe con Bundle ID incorrecto)
2. Click **"Añadir app"** → iOS
3. **Bundle ID**: `com.lessmo.app` (EXACTO, sin espacios)
4. **Nickname**: LessMo iOS
5. Descargar el nuevo `GoogleService-Info.plist`
6. Reemplazar en la raíz del proyecto

### 2. Verificar API Key en Google Cloud Console

**Ve a:** https://console.cloud.google.com/apis/credentials?project=lessmo-9023f

1. Click en **iOS key (auto created by Firebase)**
2. En "Restricciones de aplicación":
   - ✅ **Apps para iOS**
   - Bundle ID: `com.lessmo.app`
3. **Guardar**

### 3. Habilitar Autenticación Anónima

**Ve a:** https://console.firebase.google.com/project/lessmo-9023f/authentication/providers

1. Click en **"Anonymous"**
2. **Habilitar** el toggle
3. **Guardar**

---

## 🔍 VERIFICACIÓN:

Después de hacer los cambios:

1. **Espera 5 minutos** (propagación de cambios)
2. **Reinicia la app** completamente
3. Prueba login anónimo nuevamente

---

## 📱 CAMBIOS EN EL CÓDIGO:

### ✅ Teclado arreglado:
- Simplificado `Input` component
- Removidos eventos complejos de keyboard
- Añadido `editable` prop condicional

### ✅ Firebase:
- Preparado para nuevas credenciales
- Error handling mejorado

---

## ⚠️ SI EL PROBLEMA PERSISTE:

1. **Rebuild completo**:
```bash
# iOS
cd ios
pod deintegrate
pod install
cd ..
npx expo run:ios
```

2. **Verificar GoogleService-Info.plist**:
```bash
cat GoogleService-Info.plist | grep BUNDLE_ID
# Debe mostrar: <string>com.lessmo.app</string>
```

3. **Verificar que el Bundle ID coincida en:**
   - Firebase Console
   - Google Cloud Console
   - app.json (ios.bundleIdentifier)
   - GoogleService-Info.plist (BUNDLE_ID)

---

## 📞 PASOS INMEDIATOS AHORA:

1. ✅ Abre Firebase Console (ya abierto arriba)
2. ✅ Verifica/añade app iOS con Bundle ID correcto
3. ✅ Habilita autenticación anónima
4. ✅ Verifica restricciones en Google Cloud
5. ✅ Reinicia app y prueba

