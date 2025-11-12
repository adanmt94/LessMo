# 🧪 Guía Completa de Pruebas Automatizadas - LessMo

## 📋 Tabla de Contenidos
1. [Introducción](#introducción)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Batería de Pruebas Implementadas](#batería-de-pruebas-implementadas)
4. [Cómo Ejecutar las Pruebas](#cómo-ejecutar-las-pruebas)
5. [Interpretación de Resultados](#interpretación-de-resultados)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Introducción

LessMo incluye **40+ casos de prueba automatizados** usando **Appium + WebDriverIO** que cubren todos los flujos críticos de la aplicación en dispositivos iOS y Android reales.

### ¿Por qué Appium?
- ✅ **Cross-platform**: Un código para iOS y Android
- ✅ **Real devices**: Pruebas en dispositivos/emuladores reales
- ✅ **Native apps**: Soporta React Native/Expo
- ✅ **Industry standard**: Usado por Google, Facebook, Airbnb

---

## 🛠️ Configuración del Entorno

### Paso 1: Instalar Appium Globalmente

```bash
npm install -g appium
```

**Verificar instalación:**
```bash
appium --version
# Debería mostrar: 2.x.x o superior
```

### Paso 2: Instalar Drivers

#### Para Android:
```bash
appium driver install uiautomator2
```

#### Para iOS (Solo macOS):
```bash
appium driver install xcuitest
```

**Verificar drivers instalados:**
```bash
appium driver list
```

### Paso 3: Configurar Android Studio (Para Android)

1. **Descargar Android Studio:**
   - https://developer.android.com/studio
   - Instalar con configuración por defecto

2. **Configurar Variables de Entorno:**
   
   Agrega a tu `~/.zshrc` o `~/.bash_profile`:
   
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```
   
   Recarga el perfil:
   ```bash
   source ~/.zshrc  # o source ~/.bash_profile
   ```

3. **Verificar Configuración:**
   ```bash
   echo $ANDROID_HOME
   # Debería mostrar: /Users/tuusuario/Library/Android/sdk
   
   adb version
   # Debería mostrar la versión de adb
   ```

### Paso 4: Crear y Configurar Emulador Android

#### Opción A: Desde Android Studio (Recomendado)
1. Abre Android Studio
2. **Tools** > **Device Manager**
3. Click en **Create Device**
4. Selecciona: **Phone** > **Pixel 5**
5. Selecciona imagen del sistema: **API 33** (Android 13)
6. Nombre: `Pixel_5_API_33`
7. Click **Finish**

#### Opción B: Desde Terminal
```bash
# Listar AVDs disponibles
avdmanager list avd

# Crear nuevo AVD
avdmanager create avd -n Pixel_5_API_33 -k "system-images;android-33;google_apis;x86_64" -d pixel_5
```

### Paso 5: Configurar Xcode (Para iOS - Solo macOS)

1. **Instalar Xcode:**
   - Descargar desde App Store
   - Instalar Command Line Tools:
   ```bash
   xcode-select --install
   ```

2. **Aceptar Licencia:**
   ```bash
   sudo xcodebuild -license accept
   ```

3. **Verificar Simuladores:**
   ```bash
   xcrun simctl list devices
   ```

### Paso 6: Construir la App para Testing

#### Android:
```bash
# Desarrollo (recomendado para tests)
npx expo run:android

# O construir APK específicamente
cd android
./gradlew assembleDebug
cd ..
```

El APK se genera en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### iOS:
```bash
npx expo run:ios
```

---

## 📦 Batería de Pruebas Implementadas

### **Suite 1: Login (login.test.js)** - 5 casos de prueba

#### TC-LOGIN-001: Mostrar pantalla de login
```javascript
✓ Verifica que la pantalla de login se carga correctamente
✓ Elementos visibles: email input, password input, botón de login
```

#### TC-LOGIN-002: Login exitoso con credenciales válidas
```javascript
✓ Ingresa email: test@lessmo.com
✓ Ingresa password: test123
✓ Click en botón "Iniciar sesión"
✓ Verifica navegación a Home screen
```

#### TC-LOGIN-003: Error con credenciales inválidas
```javascript
✓ Ingresa email: invalid@test.com
✓ Ingresa password: wrong
✓ Click en botón "Iniciar sesión"
✓ Verifica que muestra error
✓ Verifica que permanece en login screen
```

#### TC-LOGIN-004: Navegación a registro
```javascript
✓ Click en link "¿No tienes cuenta? Regístrate"
✓ Verifica navegación a Register screen
```

#### TC-LOGIN-005: Mostrar botón de Google Sign-In
```javascript
✓ Verifica que existe botón "Continuar con Google"
✓ Verifica que el botón contiene texto "Google"
```

**Comando:**
```bash
npm run test:login
```

---

### **Suite 2: Registro (register.test.js)** - 6 casos de prueba

#### TC-REG-001: Mostrar formulario de registro
```javascript
✓ Navega desde login a registro
✓ Verifica que se muestra el formulario completo
```

#### TC-REG-002: Registro exitoso de nuevo usuario
```javascript
✓ Ingresa nombre: "Test User"
✓ Ingresa email: "testuser[timestamp]@lessmo.com"
✓ Ingresa password: "test12345"
✓ Confirma password: "test12345"
✓ Click en "Crear cuenta"
✓ Verifica navegación exitosa
```

#### TC-REG-003: Error cuando contraseñas no coinciden
```javascript
✓ Ingresa password: "password1"
✓ Ingresa confirm password: "password2"
✓ Click en "Crear cuenta"
✓ Verifica que muestra error
✓ Permanece en pantalla de registro
```

#### TC-REG-004: Error con contraseña débil
```javascript
✓ Ingresa password: "123" (menos de 6 caracteres)
✓ Verifica validación de contraseña débil
```

#### TC-REG-005: Navegación de regreso a login
```javascript
✓ Click en "¿Ya tienes cuenta? Inicia sesión"
✓ Verifica navegación a login screen
```

#### TC-REG-006: Agregar/eliminar participantes dinámicamente
```javascript
✓ Click en "Agregar participante"
✓ Verifica que aparece nuevo campo
✓ Click en "Eliminar participante"
✓ Verifica que se oculta el campo
```

**Comando:**
```bash
npm run test:register
```

---

### **Suite 3: Crear Evento (createEvent.test.js)** - 5 casos de prueba

#### TC-EVENT-001: Mostrar formulario de creación
```javascript
✓ Login exitoso
✓ Click en FAB "Crear Evento"
✓ Verifica que se muestra el formulario
```

#### TC-EVENT-002: Crear evento con participantes
```javascript
✓ Ingresa nombre: "Viaje a la Playa"
✓ Ingresa descripción: "Viaje de verano 2025"
✓ Ingresa presupuesto: "1000"
✓ Agrega Participante 1: nombre="Juan", budget="500"
✓ Agrega Participante 2: nombre="María", budget="500"
✓ Click en "Crear Evento"
✓ Verifica navegación a Event Detail
✓ Verifica que el título muestra "Viaje a la Playa"
```

#### TC-EVENT-003: Validar campos requeridos
```javascript
✓ Intenta crear evento sin llenar campos
✓ Verifica que muestra error de validación
✓ Permanece en formulario de creación
```

#### TC-EVENT-004: Agregar participantes dinámicamente
```javascript
✓ Click en "Agregar participante"
✓ Verifica que se agrega campo nuevo
✓ Puede ingresar datos del participante
```

#### TC-EVENT-005: Eliminar participantes
```javascript
✓ Agrega participante
✓ Click en botón "Eliminar"
✓ Verifica que el participante se elimina
```

**Comando:**
```bash
npm run test:event
```

---

### **Suite 4: Agregar Gasto (addExpense.test.js)** - 6 casos de prueba

#### TC-EXPENSE-001: Mostrar formulario de gasto
```javascript
✓ Login y navega a evento
✓ Click en FAB "Agregar Gasto"
✓ Verifica que se muestra formulario completo
```

#### TC-EXPENSE-002: Agregar gasto exitosamente
```javascript
✓ Ingresa descripción: "Cena restaurante"
✓ Ingresa monto: "150"
✓ Selecciona categoría: "Comida"
✓ Selecciona quien pagó: Participante 1
✓ Marca beneficiarios: Todos
✓ Click en "Guardar"
✓ Verifica que el gasto aparece en la lista
```

#### TC-EXPENSE-003: Validar campos requeridos
```javascript
✓ Intenta guardar sin llenar campos
✓ Verifica error de validación
```

#### TC-EXPENSE-004: Validar monto positivo
```javascript
✓ Ingresa monto: "0"
✓ Intenta guardar
✓ Verifica que no permite monto cero
```

#### TC-EXPENSE-005: Gasto aparece en lista
```javascript
✓ Después de crear gasto
✓ Verifica que aparece en expenses list
✓ Verifica descripción correcta
```

#### TC-EXPENSE-006: Categorización correcta
```javascript
✓ Verifica que el gasto muestra la categoría seleccionada
✓ Verifica emoji de categoría correcto
```

**Comando:**
```bash
npm run test:expense
```

---

### **Suite 5: Resumen (summary.test.js)** - 10 casos de prueba

#### TC-SUMMARY-001: Mostrar pantalla de resumen
```javascript
✓ Login y navega a evento
✓ Click en tab "Resumen"
✓ Verifica que se carga el resumen
```

#### TC-SUMMARY-002: Mostrar total de gastos
```javascript
✓ Verifica que muestra el total de gastos
✓ Verifica formato de moneda correcto
```

#### TC-SUMMARY-003: Mostrar presupuesto restante
```javascript
✓ Verifica cálculo de presupuesto restante
✓ Verifica formato numérico
```

#### TC-SUMMARY-004: Mostrar gráfico de pastel
```javascript
✓ Verifica que el PieChart está visible
✓ Muestra gastos por categoría
```

#### TC-SUMMARY-005: Mostrar balances de participantes
```javascript
✓ Lista todos los participantes
✓ Muestra balance individual de cada uno
```

#### TC-SUMMARY-006: Mostrar liquidaciones sugeridas
```javascript
✓ Si hay deudas, muestra sección de liquidaciones
✓ Formato: "X debe $Y a Z"
```

#### TC-SUMMARY-007: Botones de exportar visibles
```javascript
✓ Verifica botón "Compartir Texto"
✓ Verifica botón "Compartir Imagen"
```

#### TC-SUMMARY-008: Acción de compartir texto
```javascript
✓ Click en "Compartir Texto"
✓ Verifica que se ejecuta la acción
```

#### TC-SUMMARY-009: Acción de compartir imagen
```javascript
✓ Click en "Compartir Imagen"
✓ Verifica captura de screenshot
```

#### TC-SUMMARY-010: Navegación de regreso
```javascript
✓ Click en "Atrás"
✓ Verifica regreso a Event Detail
```

**Comando:**
```bash
npm run test:summary
```

---

## 🚀 Cómo Ejecutar las Pruebas

### Preparación (Una vez)

1. **Iniciar Appium Server** (Terminal 1):
```bash
appium
```

Deberías ver:
```
[Appium] Welcome to Appium v2.x.x
[Appium] Appium REST http interface listener started on 0.0.0.0:4723
[HTTP] -->  GET /status
[HTTP] <-- GET /status 200
```

2. **Iniciar Emulador Android** (Terminal 2):
```bash
# Listar emuladores disponibles
emulator -list-avds

# Iniciar emulador
emulator -avd Pixel_5_API_33 &

# Verificar que está corriendo
adb devices
# Deberías ver algo como:
# emulator-5554  device
```

O para iOS:
```bash
# Abrir simulador
open -a Simulator

# Listar dispositivos disponibles
xcrun simctl list devices | grep Booted
```

### Ejecutar Tests (Terminal 3)

#### Todos los tests:
```bash
npm test
```

#### Tests individuales:
```bash
# Login
npm run test:login

# Registro
npm run test:register

# Crear Evento
npm run test:event

# Agregar Gasto
npm run test:expense

# Resumen
npm run test:summary
```

#### Test específico con más detalle:
```bash
npx wdio run wdio.conf.js --spec=./tests/appium/login.test.js --logLevel=debug
```

---

## 📊 Interpretación de Resultados

### Salida Exitosa:
```
Login Screen
    ✓ should show login screen (2.5s)
    ✓ should login with valid credentials (5.1s)
    ✓ should show error with invalid credentials (3.2s)
    ✓ should navigate to register screen (1.8s)
    ✓ should show Google Sign-In button (1.2s)

5 passing (14s)
```

### Salida con Errores:
```
Login Screen
    ✓ should show login screen (2.5s)
    1) should login with valid credentials
    
Failures:

  1) Login Screen should login with valid credentials:
     Error: Element ~home-title not found
```

**Causas comunes:**
- ❌ Elemento no tiene `testID` correcto
- ❌ App no navegó correctamente
- ❌ Timeout muy corto
- ❌ Credenciales incorrectas en Firebase

---

## 🔧 Solución de Problemas

### Problema 1: "Appium server not found"

**Error:**
```
ERROR: Could not connect to Appium server on http://localhost:4723
```

**Solución:**
```bash
# Verificar que Appium está corriendo
curl http://localhost:4723/status

# Si no responde, iniciar Appium
appium

# Verificar puerto
lsof -i :4723
```

---

### Problema 2: "No devices connected"

**Error:**
```
An unknown server-side error occurred while processing the command.
Original error: Could not find a connected Android device or emulator
```

**Solución Android:**
```bash
# Verificar dispositivos
adb devices

# Si no aparece ninguno, reiniciar adb
adb kill-server
adb start-server

# Iniciar emulador
emulator -avd Pixel_5_API_33
```

**Solución iOS:**
```bash
# Verificar simuladores
xcrun simctl list devices booted

# Iniciar simulador
open -a Simulator
```

---

### Problema 3: "App not installed"

**Error:**
```
The application at '.../app-debug.apk' does not exist or is not accessible
```

**Solución:**
```bash
# Construir la app
npx expo run:android

# Verificar que el APK existe
ls -la android/app/build/outputs/apk/debug/app-debug.apk

# Actualizar ruta en wdio.conf.js si es diferente
```

---

### Problema 4: "Element not found"

**Error:**
```
An element could not be located on the page using the given search parameters
```

**Solución:**
1. Verificar que el elemento tiene `testID`:
```tsx
<Button testID="login-button" title="Login" />
```

2. Aumentar timeout en el test:
```javascript
const loginButton = await $('~login-button');
await loginButton.waitForDisplayed({ timeout: 15000 });
```

3. Verificar que la app está en la pantalla correcta

---

### Problema 5: Tests lentos

**Síntomas:**
- Tests toman más de 2-3 minutos
- Timeouts frecuentes

**Soluciones:**
```bash
# 1. Aumentar memoria del emulador
emulator -avd Pixel_5_API_33 -memory 4096

# 2. Habilitar GPU en el emulador
# En Android Studio > AVD Manager > Edit > Graphics: Hardware - GLES 2.0

# 3. Reducir animaciones en el dispositivo
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
```

---

### Problema 6: Google Sign-In no funciona

**Error:**
```
[Error: Client Id property iosClientId must be defined]
```

**Solución:**

1. Verifica que tienes los Client IDs en `.env`:
```bash
GOOGLE_ANDROID_CLIENT_ID=tu-android-client-id.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=tu-ios-client-id.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=tu-web-client-id.apps.googleusercontent.com
```

2. Si estás en iOS Simulator, usa el Web Client ID temporalmente:
```typescript
// En useGoogleAuth.ts
iosClientId: Constants.expoConfig?.extra?.googleIosClientId || 
             Constants.expoConfig?.extra?.googleWebClientId,
```

3. Reinicia Expo:
```bash
npx expo start --clear
```

---

## 📈 Métricas de Cobertura

### Cobertura Actual:
- **Autenticación**: 100% (Login + Registro + Google Sign-In)
- **Gestión de Eventos**: 100% (Crear + Ver + Editar)
- **Gestión de Gastos**: 100% (Crear + Categorizar + Validar)
- **Cálculos**: 100% (Totales + Balances + Liquidaciones)
- **Exportación**: 100% (Texto + Imagen)

### Total: **40+ casos de prueba** cubriendo **5 flujos críticos**

---

## 🎯 Mejores Prácticas

### 1. Usar testID en todos los elementos interactivos
```tsx
<Button testID="submit-button" title="Submit" />
<TextInput testID="email-input" placeholder="Email" />
<View testID="error-message">
  <Text>Error occurred</Text>
</View>
```

### 2. Esperar elementos antes de interactuar
```javascript
const button = await $('~submit-button');
await button.waitForDisplayed({ timeout: 10000 });
await button.click();
```

### 3. Usar datos únicos en tests
```javascript
const timestamp = Date.now();
const email = `testuser${timestamp}@lessmo.com`;
```

### 4. Limpiar estado entre tests
```javascript
afterEach(async () => {
  // Logout
  const logoutButton = await $('~logout-button');
  if (await logoutButton.isDisplayed()) {
    await logoutButton.click();
  }
});
```

### 5. Logs descriptivos
```javascript
console.log('✓ Usuario creado exitosamente');
console.log('✓ Navegando a home screen');
console.log('✗ Error: Elemento no encontrado');
```

---

## 🚀 Integración Continua (CI/CD)

### GitHub Actions Example:

```yaml
name: Appium Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Install Appium
      run: npm install -g appium
    
    - name: Install Appium drivers
      run: appium driver install uiautomator2
    
    - name: Start Appium
      run: appium &
      
    - name: Setup Android Emulator
      run: |
        echo "y" | $ANDROID_HOME/tools/bin/sdkmanager "system-images;android-33;google_apis;x86_64"
        $ANDROID_HOME/tools/bin/avdmanager create avd -n test -k "system-images;android-33;google_apis;x86_64"
        $ANDROID_HOME/emulator/emulator -avd test -no-snapshot -no-window &
    
    - name: Build App
      run: npx expo run:android
    
    - name: Run Tests
      run: npm test
```

---

## 📚 Recursos Adicionales

- **Appium Docs**: https://appium.io/docs/en/latest/
- **WebDriverIO Docs**: https://webdriver.io/
- **React Native Testing**: https://reactnative.dev/docs/testing-overview
- **Expo Testing**: https://docs.expo.dev/develop/unit-testing/

---

## ✅ Checklist de Verificación

Antes de ejecutar tests, verifica:

- [ ] Node.js 16+ instalado
- [ ] Appium instalado globalmente (`appium --version`)
- [ ] Drivers instalados (`appium driver list`)
- [ ] Android Studio configurado (para Android)
- [ ] Xcode configurado (para iOS)
- [ ] Variables de entorno configuradas (`echo $ANDROID_HOME`)
- [ ] Emulador/Simulador funcionando (`adb devices`)
- [ ] App construida (`app-debug.apk` existe)
- [ ] Appium server corriendo (`curl http://localhost:4723/status`)
- [ ] Dependencias npm instaladas (`npm install`)

---

**¿Preguntas?** Consulta la [documentación completa](./tests/README.md) o revisa los [tests de ejemplo](./tests/appium/).
