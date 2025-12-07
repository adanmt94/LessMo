# 🔐 Configuración de Firebase - API Keys

## ⚠️ IMPORTANTE: Archivos Sensibles

Los archivos `google-services.json` y `GoogleService-Info.plist` contienen **API keys privadas** y **NO deben subirse a GitHub**.

## 📋 Setup Inicial

### 1. **Descargar archivos de configuración**

Ve a [Firebase Console](https://console.firebase.google.com/project/lessmo-9023f/settings/general):

#### Para iOS:
1. Ve a tu app iOS en Firebase Console
2. Descarga `GoogleService-Info.plist`
3. Colócalo en la raíz del proyecto: `/GoogleService-Info.plist`

#### Para Android:
1. Ve a tu app Android en Firebase Console
2. Descarga `google-services.json`
3. Colócalo en la raíz del proyecto: `/google-services.json`

### 2. **Archivos de ejemplo**

Hemos incluido archivos de ejemplo:
- `GoogleService-Info.plist.example`
- `google-services.json.example`

Puedes copiarlos y rellenar con tus valores reales:

```bash
cp GoogleService-Info.plist.example GoogleService-Info.plist
cp google-services.json.example google-services.json
```

Luego edita los archivos y reemplaza los valores con los de Firebase Console.

### 3. **Variables de entorno (.env)**

El archivo `.env` también contiene claves sensibles. Copia el ejemplo:

```bash
cp .env.example .env
```

Y rellena con tus valores reales.

## 🛡️ Seguridad

### ✅ Archivos protegidos (en .gitignore):
- `.env`
- `google-services.json`
- `GoogleService-Info.plist`

### ⚠️ Si las claves se exponen:

1. **Rotar inmediatamente** en Google Cloud Console
2. **Añadir restricciones**:
   - iOS: Bundle ID `com.lessmo.app`
   - Android: Package `com.lessmo.app` + SHA-1
3. **Actualizar archivos locales** con las nuevas claves
4. **NO commitear** las nuevas claves

## 📚 Recursos

- [Firebase Console](https://console.firebase.google.com/project/lessmo-9023f)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=lessmo-9023f)
- [Documentación de seguridad](./SEGURIDAD_API_KEYS.md)
