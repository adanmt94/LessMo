# 🔧 Solución: iOS Client Blocked

## ❌ Error Actual:
```
auth/requests-from-this-ios-client-application-<empty>-are-blocked
```

Este error significa que Firebase está bloqueando las solicitudes porque no reconoce el Bundle ID de tu app iOS.

## ✅ Solución Paso a Paso

### **OPCIÓN 1: Verificar y Corregir en Firebase Console** (5 minutos)

1. **Abre Firebase Console:**
   - https://console.firebase.google.com/project/lessmo-9023f/settings/general

2. **Verifica la app iOS:**
   - Scroll hasta "Tus apps"
   - Busca la app iOS (ícono de Apple)
   - Verifica que el **Bundle ID** sea: `com.lessmo.app`

3. **Si el Bundle ID está mal o vacío:**
   - Click en ⚙️ (Configuración) de la app iOS
   - Click en **"Editar"**
   - Cambia el Bundle ID a: `com.lessmo.app`
   - Guarda cambios

4. **Descarga el nuevo GoogleService-Info.plist:**
   - Click en ⚙️ (Configuración) de la app iOS
   - Click en **"Descargar GoogleService-Info.plist"**
   - Reemplaza el archivo en tu proyecto:
     ```bash
     cp ~/Downloads/GoogleService-Info.plist /Users/adanmonterotorres/Projects/LessMo/LessMo/
     ```

5. **Reinicia Expo:**
   ```bash
   # En la terminal de Expo, presiona Ctrl+C
   npx expo start --clear
   ```

6. **Prueba nuevamente en el iPhone**

---

### **OPCIÓN 2: Crear Development Build** (15-20 minutos)

Si la Opción 1 no funciona, necesitas crear un development build en lugar de usar Expo Go:

#### Paso 1: Instalar EAS CLI
```bash
npm install -g eas-cli
eas login
```

#### Paso 2: Configurar EAS Build
```bash
cd /Users/adanmonterotorres/Projects/LessMo/LessMo
eas build:configure
```

#### Paso 3: Crear Development Build para iOS
```bash
eas build --profile development --platform ios
```

Esto tomará 10-15 minutos. Cuando termine:
1. Descarga el archivo `.ipa` que generó
2. Instálalo en tu iPhone usando Apple Configurator o Xcode
3. Abre la app y escanea el QR de Expo

#### Paso 4: Ejecutar con Development Build
```bash
npx expo start --dev-client
```

---

### **OPCIÓN 3: Temporal - Usar Web para Testing** (Inmediato)

Mientras solucionas el problema de iOS, puedes probar la app en web:

```bash
# En la terminal de Expo, presiona 'w'
# O ejecuta:
npx expo start --web
```

Esto abrirá la app en el navegador y el login funcionará correctamente.

---

## 🎯 Recomendación

**Prueba primero la OPCIÓN 1** (verificar Firebase Console). Es la más rápida y probablemente solucionará el problema.

Si no funciona, usa la **OPCIÓN 3** (web) para seguir desarrollando mientras preparas un development build (OPCIÓN 2).

---

## 📋 Checklist

- [ ] Verificar Bundle ID en Firebase Console
- [ ] Descargar nuevo GoogleService-Info.plist (si fue necesario)
- [ ] Reemplazar archivo en proyecto
- [ ] Limpiar caché: `npx expo start --clear`
- [ ] Probar login en iPhone
- [ ] Si falla, crear development build con EAS
- [ ] O usar web temporalmente para testing

---

## 🆘 Si Nada Funciona

Comparte screenshot de:
1. La configuración de la app iOS en Firebase Console
2. Los logs completos de la terminal cuando intentas hacer login
3. El contenido de `ios` en `app.json`

Y te ayudaré a crear una solución personalizada.
