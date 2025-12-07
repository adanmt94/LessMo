# 🔐 GUÍA DE SEGURIDAD - API Keys Expuestas

## ⚠️ PROBLEMA DETECTADO

Google Cloud detectó que la API Key `AIzaSyC0Cnt9UQRNAp0S8ekwXw3x7ksHEo5nJBs` del proyecto **LessMo (lessmo-9023f)** fue expuesta públicamente en:
- URL: https://github.com/adanmt94/LessMo/blob/4d8922aa8bae38f212b2736db0296d96f70feee7/LessMo.ipa

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. Sistema de Variables de Entorno

Se implementó un sistema completo de variables de entorno:

**Archivos modificados**:
- `.env` - Variables de entorno locales (NO se sube a Git)
- `.env.example` - Plantilla con ejemplos
- `app.config.js` - Lee variables de entorno
- `src/services/firebase.ts` - Usa `process.env`
- `src/services/ocrService.ts` - Usa `process.env`

### 2. Protección en .gitignore

Ya configurado para NO subir:
```
.env
.env*.local
```

### 3. Uso de Variables

**Antes** (❌ Inseguro):
```typescript
const firebaseConfig = {
  apiKey: 'AIzaSyD1NN6qPdBXgRFXiFBhPI8RbJfBQP3slmQ',
  // ...
};
```

**Después** (✅ Seguro):
```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || Constants.expoConfig?.extra?.firebaseApiKey,
  // ...
};
```

## 🚨 ACCIONES URGENTES REQUERIDAS

### Paso 1: Regenerar API Keys Comprometidas

**Google Cloud Console**:
1. Ve a: https://console.cloud.google.com/apis/credentials?project=lessmo-9023f
2. Busca la clave `AIzaSyC0Cnt9UQRNAp0S8ekwXw3x7ksHEo5nJBs`
3. Click en "Regenerar clave" o "Eliminar" y crear una nueva
4. Copia la nueva clave

**Firebase API Key** (si está comprometida):
1. Ve a: https://console.firebase.google.com/project/lessmo-9023f/settings/general
2. En "Tus apps", selecciona la app web
3. Regenera la API key si es necesario

### Paso 2: Actualizar .env

Edita el archivo `.env` y reemplaza:
```bash
GOOGLE_VISION_API_KEY=TU_NUEVA_API_KEY_AQUI
```

### Paso 3: Eliminar Archivo IPA Expuesto

El archivo `LessMo.ipa` en GitHub contiene credenciales. Debes:

```bash
# 1. Eliminar del repositorio
git rm LessMo.ipa
git commit -m "🔒 SECURITY: Remove IPA with exposed credentials"

# 2. Eliminar del historial (opcional pero recomendado)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch LessMo.ipa' \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (CUIDADO: reescribe historial)
git push origin --force --all
```

### Paso 4: Agregar Restricciones a las API Keys

**En Google Cloud Console**:
1. Ve a cada API key
2. Click "Editar"
3. En "Restricciones de aplicación", selecciona:
   - **iOS apps**: Agrega bundle ID `com.lessmo.app`
   - **Android apps**: Agrega nombre de paquete `com.lessmo.app` y SHA-1
4. En "Restricciones de API", limita a las APIs necesarias:
   - Cloud Vision API
   - Firebase APIs

### Paso 5: Monitorear Uso

1. Ve a: https://console.cloud.google.com/apis/dashboard?project=lessmo-9023f
2. Revisa el uso de las últimas 24-48 horas
3. Verifica que no haya picos anormales
4. Configura alertas de facturación

## 📋 CHECKLIST DE SEGURIDAD

- [x] Variables de entorno configuradas
- [x] .gitignore actualizado
- [x] Código actualizado para usar variables de entorno
- [ ] **URGENTE**: Regenerar Google Vision API key
- [ ] **URGENTE**: Eliminar LessMo.ipa del repositorio
- [ ] **URGENTE**: Limpiar historial de Git (opcional)
- [ ] Agregar restricciones a las API keys
- [ ] Monitorear uso de APIs
- [ ] Configurar alertas de facturación

## 🔄 FLUJO DE DESARROLLO SEGURO

### Para Desarrollo Local:
1. Copia `.env.example` a `.env`
2. Rellena con tus valores reales
3. Nunca hagas commit de `.env`

### Para Producción (EAS Build):
```bash
# Configurar secrets en EAS
eas secret:create --scope project --name GOOGLE_VISION_API_KEY --value "tu-api-key"
eas secret:create --scope project --name FIREBASE_API_KEY --value "tu-api-key"
```

### Para CI/CD:
- Usa secrets de GitHub Actions
- Nunca pongas API keys en archivos de configuración

## 📚 RECURSOS

- [Google Cloud - Manejar credenciales comprometidas](https://cloud.google.com/docs/authentication/api-keys#securing_an_api_key)
- [Firebase - Seguridad de API Keys](https://firebase.google.com/docs/projects/api-keys)
- [Expo - Variables de entorno](https://docs.expo.dev/guides/environment-variables/)
- [EAS - Secrets](https://docs.expo.dev/build-reference/variables/)

## ⚠️ NUNCA SUBIR A GIT

- ✅ `.env` (protegido por .gitignore)
- ✅ `google-services.json` (ya ignorado)
- ✅ `GoogleService-Info.plist` (ya ignorado)
- ✅ `*.ipa` (archivos binarios compilados)
- ✅ `*.apk` / `*.aab` (archivos binarios compilados)

## 🎯 RESULTADO ESPERADO

Después de implementar estos cambios:
- ✅ Ninguna API key en el código fuente
- ✅ .env no se sube a Git
- ✅ Builds funcionan con variables de entorno
- ✅ API keys con restricciones activas
- ✅ Monitoreo de uso configurado
