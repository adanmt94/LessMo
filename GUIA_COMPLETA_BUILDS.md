# Guía Completa de Builds, Compilación y Ejecución — LessMo

## Requisitos Previos

| Herramienta | Versión Mínima | Cómo verificar |
|-------------|---------------|----------------|
| Node.js | v20+ | `node -v` |
| npm | v10+ | `npm -v` |
| Xcode | 15.0+ | `xcodebuild -version` |
| CocoaPods | 1.14+ | `pod --version` |
| Expo CLI | (incluido vía npx) | `npx expo --version` |
| EAS CLI | (opcional, para cloud) | `npx eas-cli --version` |
| NVM (recomendado) | cualquier | `nvm --version` |

Si usas NVM, antes de cualquier comando:
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 20
```

---

## 1. Expo Go (Desarrollo Rápido — Sin Compilar)

**Qué es:** Usa la app Expo Go del App Store para ver tu app SIN compilar código nativo.

**Limitaciones:** NO funciona con módulos nativos como Stripe, Sentry, Widgets, etc.

```bash
# Iniciar servidor de desarrollo
npx expo start

# Se abre un QR. Escanéalo con la app Expo Go del iPhone.
# También puedes pulsar 'i' para abrir en simulador iOS.
```

**Cuándo usar:** Para cambios de UI rápidos, probar lógica, depurar estilos.

---

## 2. Build Local — Simulador iOS

**Qué es:** Compila la app nativa completa y la instala en el simulador de iOS de Xcode.

**Requisitos:** Xcode instalado con al menos un simulador iOS.

```bash
# Paso 1: Generar proyecto nativo (solo si hay cambios en plugins/config)
npx expo prebuild --clean

# Paso 2: Compilar e instalar en simulador
npx expo run:ios
```

El simulador se abre automáticamente con la app instalada.

**Cuándo usar:** Para probar funcionalidades nativas (Stripe, haptics, etc.) sin dispositivo físico.

---

## 3. Build Local — iPhone Físico por USB

**Qué es:** Compila e instala directamente en tu iPhone conectado por USB.

### Requisitos ANTES de compilar:

1. **Activar Developer Mode en el iPhone:**
   - Ve a **Ajustes → Privacidad y seguridad → Modo desarrollador**
   - Actívalo y reinicia el iPhone cuando te lo pida
   - Después del reinicio, confirma la activación

2. **Confiar en el ordenador:**
   - Conecta el iPhone por USB
   - Toca "Confiar" en la alerta que aparece en el iPhone

3. **Tener Apple ID configurado en Xcode:**
   - Abre Xcode → Preferences → Accounts → Añade tu Apple ID
   - El team `L8RJKZL3Y8` se usa para firma automática

```bash
# Paso 1: Generar proyecto nativo
npx expo prebuild --clean

# Paso 2: Compilar seleccionando dispositivo físico
npx expo run:ios --device
# Selecciona tu iPhone de la lista

# Alternativa: especificar dispositivo directamente
npx expo run:ios --device "iPhone de Adán"
```

### Si da error "Developer Mode disabled":
El error dice exactamente qué hacer:
```
error: Developer Mode disabled
To use iPhone de Adán for development, enable Developer Mode in Settings → Privacy & Security.
```
**Solución:** En tu iPhone → Ajustes → Privacidad y Seguridad → Modo de desarrollador → Activar → Reiniciar

### Si da error "Timed out waiting for destinations":
Significa que el iPhone no está listo. Asegúrate de:
- Developer Mode activado
- iPhone desbloqueado
- Confiado el ordenador
- Cable USB funcional

---

## 4. Build Local — Abrir con Xcode Directamente

**Qué es:** Abrir el proyecto en Xcode para más control sobre la build.

```bash
# Generar proyecto nativo primero
npx expo prebuild --clean

# Abrir en Xcode
open ios/LessMo.xcworkspace
```

En Xcode:
1. Selecciona tu dispositivo/simulador en la barra superior
2. Pulsa ▶ (Run) o Cmd+R
3. Los errores y warnings aparecen en el panel izquierdo

**Cuándo usar:** Cuando necesitas ver logs detallados de Xcode, depurar crashes nativos, o cuando `expo run:ios` falla.

---

## 5. EAS Build — Compilación en la Nube

**Qué es:** Expo Application Services compila tu app en servidores remotos. No necesitas Xcode.

### Perfiles disponibles (en `eas.json`):

| Perfil | Uso | Comando |
|--------|-----|---------|
| `development` | Build de desarrollo con dev-client | `npx eas build --platform ios --profile development` |
| `preview` | Build para testing (ad-hoc) | `npx eas build --platform ios --profile preview` |
| `production` | Build para App Store | `npx eas build --platform ios --profile production` |

```bash
# Instalar EAS CLI (primera vez)
npm install -g eas-cli

# Login en Expo
npx eas login

# Build de preview (para instalar en dispositivos registrados)
npx eas build --platform ios --profile preview

# Al terminar, te da un enlace QR para instalar en el iPhone
```

**Cuándo usar:** Cuando no tienes Mac, cuando quieres compartir builds con testers, o para subir al App Store.

---

## 6. Subir al App Store (Producción)

```bash
# Build de producción
npx eas build --platform ios --profile production

# Subir a App Store Connect
npx eas submit --platform ios
```

También puedes subir manualmente:
1. Descarga el `.ipa` del build de EAS
2. Abre Transporter (app gratuita de Apple)
3. Arrastra el `.ipa` y súbelo

---

## 7. Comandos Útiles de Desarrollo

| Acción | Comando |
|--------|---------|
| Iniciar servidor | `npx expo start` |
| Limpiar caché | `npx expo start -c` |
| Verificar TypeScript | `npx tsc --noEmit` |
| Ejecutar tests | `npm test` |
| Tests con cobertura | `npm run test:coverage` |
| Verificar dependencias | `npx expo install --check` |
| Diagnóstico completo | `npx expo-doctor` |
| Regenerar nativo | `npx expo prebuild --clean` |
| Deploy Firestore rules | `npx firebase-tools deploy --only firestore:rules --project lessmo-9023f` |
| Ver logs del simulador | Terminal donde ejecutaste `npx expo run:ios` |

---

## 8. Solución de Problemas Comunes

| Problema | Solución |
|----------|----------|
| `command not found: npx` | Cargar NVM: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20` |
| `Developer Mode disabled` | iPhone → Ajustes → Privacidad y Seguridad → Modo desarrollador → Activar |
| `Timed out waiting for destinations` | Activar Developer Mode + desbloquear iPhone + confiar ordenador |
| CocoaPods error | `cd ios && pod install --repo-update && cd ..` |
| Build cache corrupted | `npx expo prebuild --clean` (regenera todo) |
| Metro bundler crash | `npx expo start -c` (limpia caché) |
| Firma de código falla | Abrir Xcode → Signing → Seleccionar team correcto |
| `node_modules` corrupto | `rm -rf node_modules && npm install` |
| iOS folder corrupto | `rm -rf ios && npx expo prebuild` |

---

## 9. Flujo Recomendado para Desarrollo Diario

```
1. Hacer cambios en código
2. Probar rápido → npx expo start (Expo Go)
3. Probar funciones nativas → npx expo run:ios (simulador)
4. Probar en iPhone real → npx expo run:ios --device
5. Compartir con testers → npx eas build --profile preview
6. Publicar → npx eas build --profile production + eas submit
```

---

## 10. Variables de Entorno

El archivo `.env` debe contener las claves de Firebase, Stripe, Google, etc. Revisa `.env.example` como referencia.
Las variables con prefijo `EXPO_PUBLIC_` están disponibles en el código del cliente.
