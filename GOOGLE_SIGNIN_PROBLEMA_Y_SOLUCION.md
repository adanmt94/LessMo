# 🔴 Problema de Google Sign-In y Solución

## Problema Actual

El error "Error 400: invalid_request" persiste al intentar usar Google Sign-In en la app.

### Causa raíz

**Expo Go tiene limitaciones con Google Sign-In nativo**. La autenticación con Google usando `expo-auth-session` en Expo Go presenta problemas de configuración de URIs de redirección que son difíciles de resolver.

## ✅ Soluciones Disponibles

### Opción 1: Usar Expo Development Build (RECOMENDADO)

Esta es la solución más robusta y profesional:

```bash
# 1. Instalar expo-dev-client
npm install expo-dev-client

# 2. Crear un desarrollo build para iOS
npx expo run:ios

# 3. O para Android
npx expo run:android
```

**Ventajas:**
- ✅ Google Sign-In funciona correctamente
- ✅ Mejor experiencia de desarrollo
- ✅ Más parecido a la app de producción
- ✅ Soporte completo para módulos nativos

**Desventajas:**
- ⏱️ Requiere compilar la app (5-10 minutos primera vez)
- 💻 Necesitas Xcode (iOS) o Android Studio (Android)

### Opción 2: Verificar Configuración de URIs (PARCIAL)

Si prefieres seguir usando Expo Go, asegúrate de:

1. **Google Cloud Console → APIs y Servicios → Credenciales → Web Client**
   
   Agregar estas URIs de redirección:
   ```
   https://auth.expo.io/@adanmt94/lessmo
   https://lessmo-9023f.firebaseapp.com/__/auth/handler
   ```

2. **Esperar 5-10 minutos** para que Google propague los cambios

3. **Limpiar caché y reiniciar:**
   ```bash
   npx expo start --clear
   ```

**Nota:** Esta opción puede seguir presentando problemas debido a las limitaciones de Expo Go.

### Opción 3: Autenticación con Email/Password (TEMPORAL)

Mientras se resuelve Google Sign-In, los usuarios pueden:
- ✅ Registrarse con email y contraseña
- ✅ Iniciar sesión normalmente
- ✅ Todas las funcionalidades de la app funcionan correctamente

## 📝 Estado Actual de la App

### ✅ Funcionando correctamente:
- Registro con email/password
- Login con email/password
- Crear eventos
- Agregar gastos
- Ver resúmenes
- Exportar/compartir
- Sistema multilenguaje
- Navegación entre pantallas

### ⚠️ En proceso:
- Google Sign-In (requiere Expo Development Build o más tiempo de propagación de cambios)

## 🎯 Recomendación

Para una solución definitiva, te recomiendo migrar a **Expo Development Build**:

```bash
# Paso 1: Instalar dependencia
npm install expo-dev-client

# Paso 2: Compilar para iOS
npx expo run:ios

# Esto creará un build de desarrollo que tendrás que instalar
# en tu dispositivo físico o simulador una sola vez
```

Una vez instalado el Development Build:
- Google Sign-In funcionará correctamente
- No tendrás que recompilarlo cada vez (solo cuando agregues nuevas dependencias nativas)
- Seguirás teniendo hot-reload y todas las ventajas de Expo

## 📚 Más información

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Google Sign-In with Expo](https://docs.expo.dev/guides/google-authentication/)
- [OAuth 2.0 Error 400](https://developers.google.com/identity/protocols/oauth2/web-server#handlingresponse)
