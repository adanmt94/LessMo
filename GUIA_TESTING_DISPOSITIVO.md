# 🧪 Guía de Testing en Dispositivo Real

## ¿Por qué es necesario?

Las notificaciones push **NO funcionan en simuladores/emuladores**. Necesitas un dispositivo físico para:
- ✅ Probar notificaciones push
- ✅ Probar cámara para fotos de recibos
- ✅ Probar deep linking de pagos (Bizum, PayPal)

## Opción 1: Expo Go (Rápido, para desarrollo)

### Paso 1: Instala Expo Go en tu móvil
- **iOS**: [App Store - Expo Go](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Play Store - Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Paso 2: Ejecuta el servidor de desarrollo
```bash
npx expo start
```

### Paso 3: Escanea el QR
- **iOS**: Abre la cámara nativa y escanea el QR que aparece en la terminal
- **Android**: Abre Expo Go y escanea el QR desde la app

### Limitaciones de Expo Go:
⚠️ Las notificaciones push tienen limitaciones en Expo Go
⚠️ Algunos deep links pueden no funcionar correctamente

## Opción 2: Development Build (Recomendado)

Un development build es como una versión de producción pero con hot reload.

### Requisitos previos:
- Cuenta de Expo (gratis): https://expo.dev/signup
- EAS CLI instalado globalmente

### Paso 1: Instala EAS CLI
```bash
npm install -g eas-cli
```

### Paso 2: Inicia sesión en Expo
```bash
eas login
```

### Paso 3: Configura el proyecto
```bash
eas build:configure
```

### Paso 4: Construye para tu dispositivo

**Para Android:**
```bash
eas build --profile development --platform android
```

Esto creará un archivo `.apk` que podrás instalar en tu Android.

**Para iOS (requiere cuenta de Apple Developer - $99/año):**
```bash
eas build --profile development --platform ios
```

### Paso 5: Instala en tu dispositivo

**Android:**
1. Descarga el `.apk` desde el link que EAS te proporciona
2. Activa "Instalar apps de fuentes desconocidas" en tu Android
3. Instala el `.apk`

**iOS:**
1. EAS te guiará para registrar tu dispositivo
2. Instala el perfil de provisioning en tu iPhone
3. Descarga e instala la app desde el link de EAS

### Paso 6: Ejecuta el servidor de desarrollo
```bash
npx expo start --dev-client
```

### Paso 7: Abre la app en tu dispositivo
La app se conectará automáticamente al servidor de desarrollo.

## Opción 3: Build de Producción (Para testing final)

### Android (APK):
```bash
eas build --profile production --platform android
```

### iOS (IPA - requiere TestFlight):
```bash
eas build --profile production --platform ios
```

## Testing de Funcionalidades Específicas

### 📷 Fotos de Recibos
1. Ve a un evento
2. Toca "Agregar gasto"
3. Toca el botón "📷 Tomar Foto" o "🖼️ Galería"
4. Concede permisos si te los pide
5. Toma/selecciona una foto
6. Guarda el gasto
7. Verifica que la miniatura aparece en la lista

### 🔔 Notificaciones Push
1. Ve a Ajustes en la app
2. Activa las notificaciones
3. Concede permisos si te los pide
4. Realiza acciones que disparen notificaciones:
   - Crear un nuevo gasto
   - Recibir una invitación a un evento
   - Enviar un mensaje en el chat
5. Verifica que recibes las notificaciones

### 💳 Pagos
1. Ve a la pantalla de resumen de un evento
2. Toca en una deuda para liquidar
3. Selecciona un método de pago
4. Verifica que:
   - **Bizum**: Abre la app de Bizum (si está instalada)
   - **PayPal**: Abre el navegador con PayPal.Me
   - **Transferencia**: Muestra los datos bancarios

### 📊 Estadísticas
1. Ve a un evento con varios gastos
2. Toca el botón "📊" en la esquina superior
3. Verifica que se muestran:
   - Gráfico de pastel por categorías
   - Gráfico de barras de participantes
   - Gráfico de línea de tendencias
   - Estadísticas generales

## Debugging en Dispositivo Real

### Ver logs en tiempo real:

**iOS:**
```bash
npx react-native log-ios
```

**Android:**
```bash
npx react-native log-android
```

O usa el depurador integrado de Expo:
```bash
# En la terminal donde corre expo start, presiona:
j  # Abre el debugger
```

## Solución de Problemas Comunes

### "No puedo escanear el QR"
- Asegúrate de que tu móvil y computadora están en la misma red WiFi
- Intenta usar el modo tunnel: `npx expo start --tunnel`

### "Las notificaciones no funcionan"
- Verifica que concediste permisos en Ajustes del dispositivo
- Las notificaciones NO funcionan en Expo Go, necesitas un development build
- En iOS, las notificaciones solo funcionan en dispositivos físicos

### "La cámara no funciona"
- Verifica permisos en Ajustes del dispositivo
- En iOS, los permisos se piden automáticamente
- En Android, puede que necesites activarlos manualmente

### "Bizum no abre"
- Verifica que tienes la app de Bizum instalada
- El deep linking solo funciona con la app nativa instalada

## Métricas de Testing

Asegúrate de probar:
- ✅ Login y registro
- ✅ Crear evento
- ✅ Agregar participantes
- ✅ Crear gasto con foto
- ✅ Ver gasto con foto
- ✅ Recibir notificación
- ✅ Tocar notificación (debe abrir la pantalla correcta)
- ✅ Probar método de pago
- ✅ Ver estadísticas con datos reales
- ✅ Modo oscuro
- ✅ Cambio de idioma

## Recursos Adicionales

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Testing Notifications](https://docs.expo.dev/push-notifications/testing/)
- [TestFlight para iOS](https://developer.apple.com/testflight/)
