# ⚙️ Configuración de Producción - Checklist

Esta guía te ayuda a configurar LessMo para producción paso a paso.

## ✅ Checklist de Configuración

### 1. Firebase Storage Rules
- [x] Reglas desplegadas en Firebase Console
- [ ] Verificar en: https://console.firebase.google.com/project/lessmo-9023f/storage/rules

```bash
# Ya desplegadas automáticamente con:
firebase deploy --only storage
```

**Prueba**: Intenta subir una foto desde la app.

---

### 2. Permisos de Cámara y Galería
- [x] Configurados en `app.json`
- [ ] Probar en dispositivo físico (no funciona en simulador)

**Ubicación**: `app.json` → `expo.plugins`

**Prueba**: 
1. Crea un gasto
2. Toca "📷 Tomar Foto"
3. Verifica que pide permisos

---

### 3. Variables de Entorno para Pagos

Edita el archivo `.env` y configura:

#### PayPal
```bash
# Obtén tu username en: https://www.paypal.com/paypalme/my/profile
PAYPAL_ME_USERNAME=tu-usuario-paypal
```

#### Stripe (Opcional)
```bash
# Obtén en: https://dashboard.stripe.com/apikeys
# ⚠️ USA LA CLAVE PUBLICABLE (pk_), NO LA SECRETA
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXX
```

#### Transferencia Bancaria (Opcional)
```bash
BANK_ACCOUNT_NAME=Tu Nombre o Empresa
BANK_ACCOUNT_NUMBER=ES12 1234 5678 9012 3456 7890
BANK_NAME=Banco Santander
BANK_SWIFT_BIC=BSCHESMMXXX
```

**Ubicación**: `.env` (en la raíz del proyecto)

**⚠️ Importante**: 
- NO subas el archivo `.env` a Git
- Ya está en `.gitignore`
- Mantén las claves seguras

**Prueba**:
1. Reinicia el servidor: `npx expo start --clear`
2. Ve a Resumen → Liquidar deuda
3. Selecciona método de pago
4. Verifica que usa tus datos configurados

---

### 4. Configuración de Notificaciones

#### iOS (Requiere cuenta Apple Developer)
```json
// En app.json ya configurado:
"ios": {
  "infoPlist": {
    "UIBackgroundModes": ["remote-notification"]
  }
}
```

#### Android
```json
// En app.json ya configurado:
"android": {
  "permissions": [
    "RECEIVE_BOOT_COMPLETED",
    "VIBRATE",
    "POST_NOTIFICATIONS"
  ],
  "useNextNotificationsApi": true
}
```

**Prueba**:
1. Abre Ajustes en la app
2. Activa notificaciones
3. Crea un gasto
4. Verifica que recibes notificación

---

## 🚀 Pasos para Deploy

### Desarrollo Local
```bash
# Limpiar caché
npx expo start --clear

# Modo túnel (si tienes problemas de red)
npx expo start --tunnel
```

### Development Build (Recomendado)
```bash
# Instalar EAS CLI (primera vez)
npm install -g eas-cli

# Login
eas login

# Build para Android
eas build --profile development --platform android

# Build para iOS (requiere Apple Developer)
eas build --profile development --platform ios
```

### Production Build
```bash
# Android
eas build --profile production --platform android

# iOS
eas build --profile production --platform ios

# Ambas plataformas
eas build --profile production --platform all
```

---

## 🔐 Seguridad

### Variables Sensibles
✅ Mantén seguras:
- Firebase API Keys (ya en `.env`)
- Stripe Publishable Key (en `.env`)
- Datos bancarios (en `.env`)

❌ NUNCA compartas:
- Stripe Secret Key
- Firebase Service Account Keys
- Contraseñas de bases de datos

### Firebase Rules
✅ Ya configuradas:
- Firestore rules (lectura/escritura autenticada)
- Storage rules (fotos con límites de tamaño)

---

## 📊 Monitoreo

### Firebase Console
Revisa regularmente:
- **Authentication**: Usuarios registrados
- **Firestore**: Uso de base de datos
- **Storage**: Espacio usado por fotos
- **Analytics**: Uso de la app

**URL**: https://console.firebase.google.com/project/lessmo-9023f

### EAS Dashboard
- **Builds**: Estado de builds
- **Updates**: Actualizaciones OTA
- **Crashes**: Reportes de errores

**URL**: https://expo.dev/accounts/[tu-cuenta]/projects/lessmo

---

## 🐛 Debugging

### Ver logs en tiempo real
```bash
# Todos los logs
npx expo start

# Solo logs de errores
npx expo start --clear 2>&1 | grep -i error

# Logs específicos de dispositivo
npx react-native log-android   # Android
npx react-native log-ios        # iOS
```

### Herramientas de Debug
```bash
# En la terminal donde corre expo:
j  # Abrir debugger
m  # Toggle developer menu
r  # Reload app
```

---

## 📱 Testing Checklist

Antes de lanzar a producción, prueba:

### Funcionalidad Core
- [ ] Login con email/contraseña
- [ ] Login con Google
- [ ] Crear evento
- [ ] Agregar participantes
- [ ] Crear gasto
- [ ] Editar gasto
- [ ] Eliminar gasto
- [ ] Ver resumen
- [ ] Calcular liquidaciones

### Nuevas Funcionalidades
- [ ] **Fotos**: Subir foto de recibo (cámara y galería)
- [ ] **Fotos**: Ver miniatura en lista de gastos
- [ ] **Notificaciones**: Activar en ajustes
- [ ] **Notificaciones**: Recibir al crear gasto
- [ ] **Notificaciones**: Tocar notificación abre pantalla correcta
- [ ] **Pagos**: Probar Bizum (si tienes la app)
- [ ] **Pagos**: Probar PayPal (abre navegador)
- [ ] **Pagos**: Ver datos de transferencia
- [ ] **Estadísticas**: Ver gráfico de pastel
- [ ] **Estadísticas**: Ver top participantes
- [ ] **Estadísticas**: Ver tendencia temporal

### UI/UX
- [ ] Modo oscuro funciona correctamente
- [ ] Cambio de idioma (ES/EN)
- [ ] Cambio de moneda (EUR/USD/etc)
- [ ] Responsive en diferentes tamaños de pantalla
- [ ] Loading states
- [ ] Error handling

### Performance
- [ ] App carga en <3 segundos
- [ ] Navegación fluida (60 FPS)
- [ ] Imágenes cargan rápido
- [ ] Sin memory leaks

---

## 🎯 Métricas de Éxito

### Técnicas
- ✅ 0 errores de compilación
- ✅ <100MB tamaño de app
- ✅ <3s tiempo de carga inicial
- ✅ >95% crash-free users

### Funcionales
- ✅ 100% funcionalidades implementadas
- ✅ Todas las pantallas accesibles
- ✅ Todos los flujos de usuario completables

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs**: `npx expo start`
2. **Limpia caché**: `npx expo start --clear`
3. **Reinstala dependencias**: `rm -rf node_modules && npm install`
4. **Revisa documentación**: 
   - [Expo Docs](https://docs.expo.dev/)
   - [Firebase Docs](https://firebase.google.com/docs)
   - [React Navigation](https://reactnavigation.org/docs/getting-started)

---

## 🎉 ¡Listo para Producción!

Una vez completado este checklist, tu app está lista para:
- 📱 Subir a TestFlight (iOS)
- 🤖 Publicar en Play Store (Android)
- 🍎 Enviar a App Store (iOS)

**¡Felicidades! 🎊**
