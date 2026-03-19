# Tests Automatizados con Appium - LessMo

Este directorio contiene tests automatizados para LessMo usando Appium y WebDriverIO.

## 📋 Prerrequisitos

### 1. Instalar Node.js
Asegúrate de tener Node.js 16+ instalado.

### 2. Instalar Appium
```bash
npm install -g appium
```

### 3. Instalar Drivers de Appium

#### Para Android:
```bash
appium driver install uiautomator2
```

#### Para iOS:
```bash
appium driver install xcuitest
```

### 4. Configurar Entorno Android

#### Instalar Android Studio
- Descarga desde: https://developer.android.com/studio
- Instala Android SDK
- Configura variables de entorno:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### Crear Emulador Android
```bash
# Listar AVDs disponibles
emulator -list-avds

# O crear uno nuevo desde Android Studio:
# Tools > Device Manager > Create Device
```

### 5. Configurar Entorno iOS (Solo macOS)

#### Instalar Xcode
- Descarga desde App Store
- Instala Command Line Tools:
```bash
xcode-select --install
```

#### Instalar Simulador iOS
- Abre Xcode
- Window > Devices and Simulators
- Crea un simulador iOS

## 🏗️ Configuración del Proyecto

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Construir la App

#### Android:
```bash
# Desarrollo
npx expo run:android

# O construir APK para testing
cd android
./gradlew assembleDebug
```

#### iOS:
```bash
# Desarrollo
npx expo run:ios

# O construir para testing
cd ios
xcodebuild -workspace LessMo.xcworkspace -scheme LessMo -configuration Debug
```

## 🚀 Ejecutar Tests

### 1. Iniciar Appium Server
En una terminal separada:
```bash
appium
```

Deberías ver:
```
[Appium] Welcome to Appium v2.x.x
[Appium] Appium REST http interface listener started on http://0.0.0.0:4723
```

### 2. Iniciar Emulador/Simulador

#### Android:
```bash
# Listar emuladores
emulator -list-avds

# Iniciar emulador
emulator -avd Pixel_5_API_33
```

#### iOS:
```bash
# Listar simuladores
xcrun simctl list devices

# Iniciar simulador
open -a Simulator
```

### 3. Ejecutar Tests

#### Todos los tests:
```bash
npm test
```

#### Test específico:
```bash
# Login
npx wdio run wdio.conf.js --spec=./tests/appium/login.test.js

# Register
npx wdio run wdio.conf.js --spec=./tests/appium/register.test.js

# Create Event
npx wdio run wdio.conf.js --spec=./tests/appium/createEvent.test.js

# Add Expense
npx wdio run wdio.conf.js --spec=./tests/appium/addExpense.test.js

# Summary
npx wdio run wdio.conf.js --spec=./tests/appium/summary.test.js
```

## 📝 Estructura de Tests

```
tests/
└── appium/
    ├── login.test.js          # Tests de autenticación
    ├── register.test.js       # Tests de registro
    ├── createEvent.test.js    # Tests de creación de eventos
    ├── addExpense.test.js     # Tests de agregar gastos
    └── summary.test.js        # Tests de resumen y exportación
```

## 🔍 Debugging

### Ver logs de Appium:
```bash
appium --log-level debug
```

### Ver logs de la app en el dispositivo:

#### Android:
```bash
adb logcat | grep LessMo
```

#### iOS:
```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "LessMo"'
```

## 📊 Cobertura de Tests

- ✅ **Login**: Email/Password y Google Sign-In
- ✅ **Registro**: Validaciones y creación de cuenta
- ✅ **Crear Evento**: Formulario, participantes, validaciones
- ✅ **Agregar Gasto**: Categorías, beneficiarios, cálculos
- ✅ **Resumen**: Gráficos, liquidaciones, exportación

## 🛠️ Troubleshooting

### Problema: "Appium server not found"
**Solución**: Verifica que Appium esté corriendo en el puerto 4723

### Problema: "No device connected"
**Solución**: Verifica que el emulador/simulador esté iniciado:
```bash
adb devices  # Android
xcrun simctl list devices booted  # iOS
```

### Problema: "App not installed"
**Solución**: Construye la app primero:
```bash
npx expo run:android  # o run:ios
```

### Problema: "Element not found"
**Solución**: Verifica los testID en los componentes. Cada elemento debe tener un `testID`:
```jsx
<Button testID="login-button" title="Login" />
```

## 📚 Recursos

- [Appium Documentation](https://appium.io/docs/en/latest/)
- [WebDriverIO Documentation](https://webdriver.io/)
- [Expo Testing](https://docs.expo.dev/develop/unit-testing/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)

## 🎯 Mejores Prácticas

1. **Usar testID**: Siempre agrega `testID` a elementos interactivos
2. **Esperar elementos**: Usa `waitForDisplayed()` antes de interactuar
3. **Cleanup**: Cierra sesión entre tests para aislar casos
4. **Datos de prueba**: Usa timestamps para emails únicos
5. **Assertions claras**: Usa mensajes descriptivos en `expect()`

## 🚦 CI/CD

Para integrar en CI/CD (GitHub Actions, etc.):

```yaml
- name: Run Appium Tests
  run: |
    npm install
    appium &
    npm test
```
