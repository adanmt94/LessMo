# Guía para Formatear Mac e Instalar con macOS Ventura 13.3.6

## ✅ Archivos Ya Guardados en Git (commit y push completados)
Todo el código fuente está seguro en GitHub.

---

## 🔐 ARCHIVOS CRÍTICOS - GUARDAR MANUALMENTE ANTES DE FORMATEAR

### 1. **Credenciales de Firebase** (¡MUY IMPORTANTE!)
Ubicación actual: **ESTOS ARCHIVOS ESTÁN EN GIT AHORA** pero deberían estar en .gitignore en producción:
```
/Users/adanmonterotorres/Projects/LessMo/LessMo/GoogleService-Info.plist
/Users/adanmonterotorres/Projects/LessMo/LessMo/google-services.json
```

**ACCIÓN**: 
- Haz una copia de seguridad en un USB o Dropbox
- Después del formateo, añádelos de nuevo al proyecto
- NUNCA los subas a GitHub en producción (están en .gitignore normalmente)

### 2. **Certificados y Perfiles de iOS**
Ubicación: `~/Library/MobileDevice/Provisioning Profiles/`
```bash
# Haz backup de estos:
cp -r ~/Library/MobileDevice/Provisioning\ Profiles ~/Desktop/iOS_Profiles_Backup
```

### 3. **Certificados de Keychain**
- Abre **Keychain Access** (Acceso a Llaveros)
- Busca certificados de **Apple Development** y **Apple Distribution**
- Exporta cada uno: Clic derecho → Exportar
- Guárdalos en un USB con contraseña segura
- Necesitarás la contraseña de tu cuenta de desarrollador de Apple

### 4. **Claves SSH y GPG**
```bash
# Backup de claves SSH
cp -r ~/.ssh ~/Desktop/ssh_backup

# Backup de claves GPG (si usas)
gpg --export-secret-keys > ~/Desktop/gpg_backup.asc
```

### 5. **Variables de Entorno Sensibles**
Revisa si tienes credenciales en:
```bash
~/.zshrc
~/.zprofile
~/.bashrc
~/.bash_profile
```

**En tu caso, tienes configuraciones de Ruby y SSL aquí:**
```bash
cat ~/.zshrc  # Revisa y guarda cualquier configuración importante
```

### 6. **Configuración de Git**
```bash
# Guarda tu configuración actual
git config --global --list > ~/Desktop/git_config_backup.txt

# Tu nombre y email de Git:
cat ~/.gitconfig > ~/Desktop/gitconfig_backup.txt
```

### 7. **Base de Datos Local (si aplica)**
Si tu app guarda datos localmente, haz backup de:
```bash
~/Library/Application Support/com.lessmo.app/
```

---

## 📦 Software a Instalar en macOS Ventura 13.3.6

### 1. **Xcode 15.0+** (Requisito para React Native 0.81.5)
- Descarga desde App Store o https://developer.apple.com/download/
- macOS Ventura 13.3.6 soporta hasta **Xcode 15.0**
- Después de instalar: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`

### 2. **Homebrew**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 3. **Node.js** (versión 20.x como tienes ahora)
```bash
brew install node@20
```

### 4. **Git**
```bash
brew install git
```

### 5. **Watchman** (para React Native)
```bash
brew install watchman
```

### 6. **CocoaPods**
```bash
sudo gem install cocoapods
```

### 7. **Expo CLI y EAS CLI**
```bash
npm install -g expo-cli eas-cli
```

### 8. **Ruby** (Homebrew version)
```bash
brew install ruby
```

---

## 🔄 Después del Formateo - Pasos de Restauración

### 1. Clonar el Repositorio
```bash
cd ~/Projects
git clone https://github.com/adanmt94/LessMo.git
cd LessMo
```

### 2. Restaurar Credenciales de Firebase
```bash
# Copiar desde tu backup
cp ~/path/to/backup/GoogleService-Info.plist ./
cp ~/path/to/backup/google-services.json ./
```

### 3. Instalar Dependencias
```bash
npm install
cd ios && pod install && cd ..
```

### 4. Restaurar Certificados iOS
- Importa los certificados .p12 que exportaste
- Copia los Provisioning Profiles a `~/Library/MobileDevice/Provisioning Profiles/`

### 5. Restaurar Claves SSH
```bash
cp -r ~/path/to/backup/ssh_backup ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

### 6. Configurar Git
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### 7. Iniciar Sesión en Apple Developer
```bash
xcrun notarytool store-credentials
```

### 8. Iniciar Sesión en EAS
```bash
eas login
```

---

## 🎯 Verificación Post-Instalación

### 1. Verificar Versiones
```bash
node --version          # Debe ser v20.x
npm --version          # Debe ser 10.x
xcodebuild -version    # Debe ser Xcode 15.0+
pod --version          # Debe ser 1.15.x
watchman --version     # Cualquier versión reciente
git --version          # Cualquier versión reciente
```

### 2. Verificar React Native
```bash
cd ~/Projects/LessMo
npx react-native --version
```

### 3. Probar Build iOS
```bash
cd ios
xcodebuild -workspace LessMo.xcworkspace -scheme LessMo -configuration Debug -sdk iphonesimulator
```

---

## ⚠️ IMPORTANTE - NO OLVIDAR

1. **Backup de credenciales de Firebase** (GoogleService-Info.plist y google-services.json)
2. **Exportar certificados de iOS desde Keychain**
3. **Guardar claves SSH**
4. **Anotar contraseñas de:**
   - Apple Developer Account
   - GitHub
   - Expo/EAS
   - Certificados exportados

---

## 📝 Ventajas de macOS Ventura 13.3.6

✅ Soporta Xcode 15.0+ (compatible con React Native 0.81.5)
✅ Soporta Swift 5.9+ (compatible con Stripe y otras dependencias modernas)
✅ C++20 totalmente funcional
✅ No más errores de `bit_cast`
✅ Compilación local de iOS funcionará perfectamente

---

## 🚀 Estado Actual del Proyecto

- ✅ Widget iOS implementado
- ✅ Console.logs limpiados
- ✅ Sentry removido (reactivar después si quieres monitoreo)
- ✅ Stripe en versión 0.19.0 (puedes actualizar después del formateo)
- ✅ Todo en GitHub

Con macOS Ventura podrás compilar localmente sin problemas.
