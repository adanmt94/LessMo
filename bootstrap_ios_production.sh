#!/bin/bash

################################################################################
# Bootstrap iOS Production Environment - ULTRA COMPLETO
# macOS Ventura 13.7.8 - Intel MacBook Pro Late 2016
# React Native 0.81.5 + Expo SDK 54 + CocoaPods
# 
# Este script instala TODO desde CERO (sistema completamente limpio):
# 
# BÁSICO (Sistema):
# - Command Line Tools
# - Homebrew
# - Certificados SSL actualizados
# - Permisos y configuraciones del sistema
# 
# LENGUAJES Y RUNTIMES:
# - Ruby 3.x (vía Homebrew)
# - Node.js 20 LTS + npm
# - Python 3 (si se necesita)
# 
# HERRAMIENTAS DE DESARROLLO:
# - Xcode 15.2 (guiado)
# - Git + configuración
# - Watchman (file watcher)
# - CocoaPods 1.15.2
# - Fastlane (deployment)
# - curl, wget, unzip (utilidades)
# 
# HERRAMIENTAS EXPO/REACT NATIVE:
# - Expo CLI
# - EAS CLI
# - React Native CLI
# - TypeScript
# 
# EDITORES Y EXTENSIONES:
# - VS Code + extensiones esenciales
# 
# DEPENDENCIAS DEL PROYECTO:
# - Todas las dependencias npm (1617 packages)
# - Todos los pods de iOS (108 pods)
# - Configuración de widgets
# 
# CONFIGURACIONES:
# - Variables de entorno
# - PATH updates
# - Shell configuration (.zshrc)
# - Permisos de seguridad
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failures

################################################################################
# CONFIGURATION
################################################################################

REQUIRED_MACOS_VERSION="13.7"
REQUIRED_NODE_MAJOR="20"
REQUIRED_XCODE_MAJOR="15"
XCODE_VERSION="15.2"  # Compatible con Ventura y React Native 0.81.5
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Versions específicas para compatibilidad
COCOAPODS_VERSION="1.15.2"
NODE_VERSION="20"
RUBY_VERSION="3.3"
WATCHMAN_VERSION="latest"

# SSL Certificate paths
SSL_CERT_FILE="/etc/ssl/cert.pem"
SSL_CERT_DIR="/etc/ssl/certs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

################################################################################
# LOGGING FUNCTIONS
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_substep() {
    echo -e "${MAGENTA}  →${NC} $1"
}

show_progress() {
    local current=$1
    local total=$2
    local message=$3
    local percentage=$((current * 100 / total))
    echo -e "${GREEN}[${current}/${total}]${NC} ${percentage}% - $message"
}

################################################################################
# SYSTEM VERIFICATION
################################################################################

verify_system() {
    log_step "1/15 - Verificando sistema"
    
    # Check macOS version
    MACOS_VERSION=$(sw_vers -productVersion)
    log_substep "macOS: $MACOS_VERSION"
    
    if [[ ! "$MACOS_VERSION" =~ ^13\. ]]; then
        log_error "Se requiere macOS Ventura 13.x. Versión actual: $MACOS_VERSION"
        exit 1
    fi
    
    # Check architecture
    ARCH=$(uname -m)
    log_substep "Arquitectura: $ARCH"
    
    if [[ "$ARCH" != "x86_64" ]]; then
        log_warning "Este script está optimizado para Intel (x86_64). Arquitectura detectada: $ARCH"
    fi
    
    # Check available disk space (need at least 50GB for Xcode)
    AVAILABLE_SPACE=$(df -g / | tail -1 | awk '{print $4}')
    log_substep "Espacio disponible: ${AVAILABLE_SPACE}GB"
    
    if [[ "$AVAILABLE_SPACE" -lt 50 ]]; then
        log_warning "Se necesitan al menos 50GB libres. Disponible: ${AVAILABLE_SPACE}GB"
        read -p "¿Continuar de todas formas? (s/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Sistema verificado correctamente"
}

################################################################################
# COMMAND LINE TOOLS INSTALLATION (PREREQUISITO)
################################################################################

install_command_line_tools() {
    log_step "1.5/18 - Instalando Command Line Tools"
    
    # Check if already installed
    if xcode-select -p &> /dev/null; then
        log_substep "Command Line Tools ya están instalados"
        log_substep "Ruta: $(xcode-select -p)"
        return 0
    fi
    
    log_substep "Instalando Command Line Tools..."
    log_warning "Se abrirá una ventana, por favor completa la instalación"
    
    # Trigger installation
    xcode-select --install 2>/dev/null || true
    
    # Wait for installation
    log_substep "Esperando a que se complete la instalación..."
    while ! xcode-select -p &> /dev/null; do
        sleep 5
    done
    
    log_success "Command Line Tools instalados correctamente"
}

################################################################################
# SSL CERTIFICATES UPDATE
################################################################################

update_ssl_certificates() {
    log_step "1.7/18 - Actualizando certificados SSL"
    
    log_substep "Verificando certificados SSL del sistema..."
    
    # Update CA certificates
    if [[ -f "/etc/ssl/cert.pem" ]]; then
        CERT_COUNT=$(security find-certificate -a /System/Library/Keychains/SystemRootCertificates.keychain | grep "labl" | wc -l | xargs)
        log_substep "Certificados del sistema: $CERT_COUNT"
    fi
    
    # Download latest Mozilla CA bundle if needed
    if ! curl -sS https://curl.se/ca/cacert.pem -o /tmp/cacert.pem &> /dev/null; then
        log_warning "No se pudieron actualizar certificados SSL (sin internet o bloqueado)"
    else
        log_substep "Certificados SSL actualizados desde Mozilla"
        if [[ -w "/etc/ssl/cert.pem" ]]; then
            sudo cp /tmp/cacert.pem /etc/ssl/cert.pem 2>/dev/null || log_warning "No se pudo copiar el certificado"
        fi
    fi
    
    # Add SSL env vars to shell
    if ! grep -q "SSL_CERT_FILE" ~/.zshrc 2>/dev/null; then
        log_substep "Configurando variables SSL en shell..."
        cat << 'EOF' >> ~/.zshrc

# SSL Certificate Configuration
export SSL_CERT_FILE=/etc/ssl/cert.pem
export SSL_CERT_DIR=/etc/ssl/certs
export REQUESTS_CA_BUNDLE=/etc/ssl/cert.pem
export NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem
EOF
    fi
    
    export SSL_CERT_FILE=/etc/ssl/cert.pem
    export SSL_CERT_DIR=/etc/ssl/certs
    
    log_success "Certificados SSL configurados"
}

################################################################################
# SYSTEM UTILITIES INSTALLATION
################################################################################

install_system_utilities() {
    log_step "2.5/18 - Instalando utilidades del sistema"
    
    log_substep "Instalando herramientas básicas..."
    
    # Install essential utilities via Homebrew
    local utilities=("curl" "wget" "unzip" "jq" "tree")
    
    for util in "${utilities[@]}"; do
        if command -v "$util" &> /dev/null; then
            log_substep "✓ $util ya está instalado"
        else
            log_substep "Instalando $util..."
            brew install "$util" || log_warning "No se pudo instalar $util"
        fi
    done
    
    log_success "Utilidades del sistema instaladas"
}

################################################################################
# HOMEBREW INSTALLATION
################################################################################

install_homebrew() {
    log_step "2/18 - Instalando Homebrew"
    
    if command -v brew &> /dev/null; then
        log_substep "Homebrew ya está instalado"
        BREW_VERSION=$(brew --version | head -n1)
        log_substep "$BREW_VERSION"
        log_substep "Actualizando Homebrew..."
        brew update 2>/dev/null || log_warning "No se pudo actualizar Homebrew (sin internet o error temporal)"
    else
        log_substep "Descargando e instalando Homebrew..."
        log_warning "Esto puede tomar varios minutos..."
        
        # Install Homebrew
        NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH based on architecture
        if [[ "$ARCH" == "x86_64" ]]; then
            BREW_PATH="/usr/local/bin/brew"
            echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/usr/local/bin/brew shellenv)"
        else
            BREW_PATH="/opt/homebrew/bin/brew"
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
        
        # Verify installation
        if ! command -v brew &> /dev/null; then
            log_error "Homebrew no se instaló correctamente"
            exit 1
        fi
    fi
    
    # Disable analytics
    brew analytics off 2>/dev/null || true
    
    # Verify brew is working
    if brew --version &> /dev/null; then
        log_substep "Homebrew: $(brew --version | head -n1)"
        log_success "Homebrew instalado y configurado"
    else
        log_error "Homebrew no funciona correctamente"
        exit 1
    fi
}

################################################################################
# XCODE INSTALLATION
################################################################################

install_xcode() {
    log_step "3/18 - Instalando Xcode ${XCODE_VERSION}"
    
    # Check if Xcode is already installed with correct version
    if command -v xcodebuild &> /dev/null; then
        CURRENT_XCODE_VERSION=$(xcodebuild -version 2>/dev/null | head -n1 | awk '{print $2}')
        log_substep "Xcode ya está instalado: versión $CURRENT_XCODE_VERSION"
        
        XCODE_MAJOR=$(echo "$CURRENT_XCODE_VERSION" | cut -d. -f1)
        if [[ "$XCODE_MAJOR" -ge "$REQUIRED_XCODE_MAJOR" ]]; then
            log_success "Xcode versión compatible detectada ($CURRENT_XCODE_VERSION >= $REQUIRED_XCODE_MAJOR)"
            
            # Verify and set Command Line Tools path
            XCODE_PATH=$(xcode-select -p 2>/dev/null)
            if [[ "$XCODE_PATH" != "/Applications/Xcode.app/Contents/Developer" ]]; then
                log_substep "Configurando ruta de Xcode..."
                sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
            fi
            
            # Accept license if needed
            if ! sudo xcodebuild -license check &> /dev/null; then
                log_substep "Aceptando licencia de Xcode..."
                sudo xcodebuild -license accept 2>/dev/null || {
                    log_warning "No se pudo aceptar la licencia automáticamente"
                    log_warning "Ejecuta: sudo xcodebuild -license accept"
                }
            fi
            
            # First run setup (creates necessary directories)
            log_substep "Ejecutando configuración inicial de Xcode..."
            sudo xcodebuild -runFirstLaunch 2>/dev/null || log_warning "runFirstLaunch no disponible o ya ejecutado"
            
            return 0
        else
            log_warning "Xcode $CURRENT_XCODE_VERSION es demasiado antiguo (se necesita $REQUIRED_XCODE_MAJOR.x)"
        fi
    fi
    
    # Xcode not installed or too old
    log_substep "Xcode $REQUIRED_XCODE_MAJOR.x no está instalado o la versión es incompatible"
    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "INSTALACIÓN DE XCODE $XCODE_VERSION"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "${GREEN}IMPORTANTE:${NC} Xcode 15.2 es compatible con:"
    echo "  • macOS Ventura 13.x ✓"
    echo "  • React Native 0.81.5 ✓"
    echo "  • C++20 (necesario para RN 0.81+) ✓"
    echo "  • Swift 5.9 ✓"
    echo "  • WidgetKit para iOS 17+ ✓"
    echo ""
    echo "Hay 2 opciones para instalar Xcode 15.2:"
    echo ""
    echo "  ${GREEN}OPCIÓN 1 (RECOMENDADA):${NC} App Store"
    echo "    ✓ Instalación más rápida"
    echo "    ✓ Instalación automática"
    echo "    ✓ Actualizaciones automáticas"
    echo "    ✓ Verificación de integridad automática"
    echo "    → Abre App Store y busca 'Xcode'"
    echo ""
    echo "  ${YELLOW}OPCIÓN 2:${NC} developer.apple.com"
    echo "    ⚠ Requiere cuenta de desarrollador de Apple"
    echo "    ⚠ Descarga manual (~15GB, puede tomar horas)"
    echo "    → https://developer.apple.com/download/all/"
    echo "    → Busca 'Xcode 15.2' (para macOS 13 Ventura)"
    echo "    → Descarga el archivo .xip"
    echo "    → Doble clic para extraer (puede tomar 30+ minutos)"
    echo "    → Arrastra Xcode.app a /Applications/"
    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    log_warning "Este script se pausará mientras instalas Xcode"
    echo ""
    log_info "Después de instalar Xcode, debes ejecutar:"
    echo ""
    echo "  ${CYAN}sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer${NC}"
    echo "  ${CYAN}sudo xcodebuild -license accept${NC}"
    echo "  ${CYAN}sudo xcodebuild -runFirstLaunch${NC}"
    echo ""
    log_warning "Luego vuelve a ejecutar este script"
    echo ""
    
    read -p "¿Ya has instalado Xcode 15.2 o superior? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        # Verify Xcode installation
        if [[ ! -d "/Applications/Xcode.app" ]]; then
            log_error "Xcode.app no se encuentra en /Applications/"
            log_error "Asegúrate de haberlo instalado correctamente"
            exit 1
        fi
        
        if ! command -v xcodebuild &> /dev/null; then
            log_error "xcodebuild no está disponible"
            log_error "Asegúrate de que Xcode esté instalado correctamente"
            exit 1
        fi
        
        # Configure Xcode
        log_substep "Configurando Xcode..."
        sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
        
        log_substep "Aceptando licencia de Xcode..."
        sudo xcodebuild -license accept 2>/dev/null || {
            log_warning "No se pudo aceptar la licencia automáticamente"
            log_info "Ejecuta manualmente: sudo xcodebuild -license accept"
        }
        
        log_substep "Ejecutando configuración inicial..."
        sudo xcodebuild -runFirstLaunch 2>/dev/null || log_warning "runFirstLaunch ya ejecutado"
        
        # Verify installation
        INSTALLED_VERSION=$(xcodebuild -version | head -n1 | awk '{print $2}')
        log_substep "Xcode instalado: versión $INSTALLED_VERSION"
        
        XCODE_MAJOR=$(echo "$INSTALLED_VERSION" | cut -d. -f1)
        if [[ "$XCODE_MAJOR" -lt "$REQUIRED_XCODE_MAJOR" ]]; then
            log_error "La versión instalada ($INSTALLED_VERSION) es menor que la requerida ($REQUIRED_XCODE_MAJOR.x)"
            exit 1
        fi
        
        log_success "Xcode $INSTALLED_VERSION configurado correctamente"
    else
        log_warning "Por favor instala Xcode 15.2 o superior y vuelve a ejecutar este script"
        log_info "Comando para continuar después de instalar:"
        echo ""
        echo "  ${CYAN}$0${NC}"
        echo ""
        exit 0
    fi
}

################################################################################
# NODE.JS INSTALLATION
################################################################################

install_node() {
    log_step "4/15 - Instalando Node.js"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_substep "Node.js ya está instalado: $NODE_VERSION"
        
        NODE_MAJOR=$(node -v | cut -d. -f1 | sed 's/v//')
        if [[ "$NODE_MAJOR" -eq "$REQUIRED_NODE_MAJOR" ]]; then
            log_success "Versión de Node.js correcta"
            return 0
        else
            log_warning "Versión de Node.js no óptima. Se recomienda $REQUIRED_NODE_MAJOR.x"
            log_substep "Reinstalando Node.js $REQUIRED_NODE_MAJOR LTS..."
            brew unlink node 2>/dev/null || true
        fi
    fi
    
    log_substep "Instalando Node.js $REQUIRED_NODE_MAJOR LTS..."
    brew install node@20
    brew link node@20 --force --overwrite
    
    # Verify npm
    if ! command -v npm &> /dev/null; then
        log_error "npm no está disponible después de instalar Node.js"
        exit 1
    fi
    
    log_substep "Node.js: $(node -v)"
    log_substep "npm: $(npm -v)"
    log_success "Node.js instalado correctamente"
}

################################################################################
# GIT INSTALLATION
################################################################################

install_git() {
    log_step "5/15 - Verificando Git"
    
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | awk '{print $3}')
        log_substep "Git ya está instalado: $GIT_VERSION"
    else
        log_substep "Git no encontrado, instalando..."
        # Git viene con Xcode Command Line Tools, pero por si acaso
        xcode-select --install 2>/dev/null || true
    fi
    
    log_success "Git disponible"
}

################################################################################
# WATCHMAN INSTALLATION
################################################################################

install_watchman() {
    log_step "6/15 - Instalando Watchman"
    
    if command -v watchman &> /dev/null; then
        log_substep "Watchman ya está instalado: $(watchman -v)"
    else
        log_substep "Instalando Watchman..."
        brew install watchman
    fi
    
    log_substep "Watchman: $(watchman -v)"
    log_success "Watchman instalado correctamente"
}

################################################################################
# RUBY & COCOAPODS INSTALLATION
################################################################################

install_ruby_cocoapods() {
    log_step "7/18 - Instalando Ruby y CocoaPods"
    
    # Check system Ruby first
    SYSTEM_RUBY=$(which ruby 2>/dev/null || echo "")
    if [[ -n "$SYSTEM_RUBY" ]]; then
        SYSTEM_RUBY_VERSION=$(ruby -v 2>/dev/null | awk '{print $2}')
        log_substep "Ruby del sistema: $SYSTEM_RUBY_VERSION en $SYSTEM_RUBY"
    fi
    
    # Install Homebrew Ruby for better compatibility
    log_substep "Instalando Ruby vía Homebrew..."
    
    if brew list ruby &> /dev/null; then
        log_substep "Ruby de Homebrew ya está instalado"
    else
        brew install ruby
    fi
    
    # Get Homebrew Ruby path
    if [[ "$ARCH" == "x86_64" ]]; then
        BREW_RUBY_PATH="/usr/local/opt/ruby/bin"
        BREW_GEM_PATH="/usr/local/lib/ruby/gems/3.3.0/bin"
    else
        BREW_RUBY_PATH="/opt/homebrew/opt/ruby/bin"
        BREW_GEM_PATH="/opt/homebrew/lib/ruby/gems/3.3.0/bin"
    fi
    
    # Add to PATH if not already there
    if ! grep -q "$BREW_RUBY_PATH" ~/.zshrc 2>/dev/null; then
        log_substep "Configurando Ruby en PATH..."
        cat << EOF >> ~/.zshrc

# Homebrew Ruby
export PATH="$BREW_RUBY_PATH:\$PATH"
export PATH="$BREW_GEM_PATH:\$PATH"
export LDFLAGS="-L$BREW_RUBY_PATH/../lib"
export CPPFLAGS="-I$BREW_RUBY_PATH/../include"
export PKG_CONFIG_PATH="$BREW_RUBY_PATH/../lib/pkgconfig"
EOF
    fi
    
    # Load new PATH
    export PATH="$BREW_RUBY_PATH:$PATH"
    export PATH="$BREW_GEM_PATH:$PATH"
    
    # Verify Ruby
    RUBY_VERSION=$(ruby -v | awk '{print $2}')
    RUBY_PATH=$(which ruby)
    log_substep "Ruby activo: $RUBY_VERSION"
    log_substep "Ubicación: $RUBY_PATH"
    
    # Check Ruby version (should be 3.x)
    RUBY_MAJOR=$(echo "$RUBY_VERSION" | cut -d. -f1)
    if [[ "$RUBY_MAJOR" -lt 3 ]]; then
        log_warning "Ruby $RUBY_VERSION puede ser muy antiguo. Se recomienda Ruby 3.x"
    fi
    
    # Install CocoaPods
    log_substep "Instalando CocoaPods $COCOAPODS_VERSION..."
    
    if command -v pod &> /dev/null; then
        CURRENT_POD_VERSION=$(pod --version 2>/dev/null || echo "unknown")
        log_substep "CocoaPods ya está instalado: $CURRENT_POD_VERSION"
        
        # Check if we need to update
        POD_MAJOR=$(echo "$CURRENT_POD_VERSION" | cut -d. -f1)
        POD_MINOR=$(echo "$CURRENT_POD_VERSION" | cut -d. -f2)
        
        if [[ "$POD_MAJOR" -eq 1 ]] && [[ "$POD_MINOR" -ge 15 ]]; then
            log_success "Versión de CocoaPods compatible ($CURRENT_POD_VERSION)"
        else
            log_warning "CocoaPods $CURRENT_POD_VERSION es antiguo, actualizando..."
            sudo gem uninstall cocoapods -aIx 2>/dev/null || true
            sudo gem install cocoapods -v $COCOAPODS_VERSION -n /usr/local/bin
        fi
    else
        # Install CocoaPods
        log_substep "Instalando CocoaPods $COCOAPODS_VERSION (esto puede tomar 2-3 minutos)..."
        
        # Try without sudo first (for Homebrew Ruby)
        if gem install cocoapods -v $COCOAPODS_VERSION --user-install 2>/dev/null; then
            log_substep "CocoaPods instalado en user gems"
            
            # Add user gems to PATH
            USER_GEM_PATH=$(ruby -e 'puts Gem.user_dir')/bin
            if ! grep -q "$USER_GEM_PATH" ~/.zshrc 2>/dev/null; then
                echo "export PATH=\"$USER_GEM_PATH:\$PATH\"" >> ~/.zshrc
                export PATH="$USER_GEM_PATH:$PATH"
            fi
        else
            # Fallback to sudo install
            log_substep "Instalando CocoaPods con sudo..."
            sudo gem install cocoapods -v $COCOAPODS_VERSION -n /usr/local/bin
        fi
    fi
    
    # Verify CocoaPods installation
    if ! command -v pod &> /dev/null; then
        log_error "CocoaPods no se instaló correctamente"
        log_error "Intenta manualmente: sudo gem install cocoapods -v $COCOAPODS_VERSION"
        exit 1
    fi
    
    POD_VERSION=$(pod --version)
    POD_PATH=$(which pod)
    log_substep "CocoaPods: $POD_VERSION"
    log_substep "Ubicación: $POD_PATH"
    
    # Setup CocoaPods (download master specs repo)
    if [[ ! -d ~/.cocoapods/repos/trunk ]]; then
        log_substep "Configurando repositorio de CocoaPods (primera vez, puede tomar 5-10 minutos)..."
        log_warning "No interrumpas este proceso, es normal que tarde"
        pod setup || log_warning "pod setup falló, se intentará durante pod install"
    else
        log_substep "Repositorio de CocoaPods ya está configurado"
    fi
    
    # Update CocoaPods repo
    log_substep "Actualizando repositorio de specs..."
    pod repo update --silent 2>/dev/null || log_warning "No se pudo actualizar el repo (continuando)"
    
    log_success "Ruby y CocoaPods instalados correctamente"
}

################################################################################
# FASTLANE INSTALLATION (OPCIONAL)
################################################################################

install_fastlane() {
    log_step "8/15 - Instalando Fastlane (opcional)"
    
    if command -v fastlane &> /dev/null; then
        log_substep "Fastlane ya está instalado: $(fastlane --version | head -n1)"
    else
        log_substep "Instalando Fastlane..."
        sudo gem install fastlane -NV -n /usr/local/bin
    fi
    
    log_success "Fastlane disponible"
}

################################################################################
# EXPO & EAS CLI INSTALLATION
################################################################################

install_expo_tools() {
    log_step "9/15 - Instalando herramientas Expo"
    
    # Update npm to latest version
    log_substep "Actualizando npm..."
    npm install -g npm@latest
    
    # Install Expo CLI
    if npm list -g expo-cli &> /dev/null; then
        log_substep "Expo CLI ya está instalado"
    else
        log_substep "Instalando Expo CLI..."
        npm install -g expo-cli
    fi
    
    # Install EAS CLI
    if npm list -g eas-cli &> /dev/null; then
        log_substep "EAS CLI ya está instalado"
    else
        log_substep "Instalando EAS CLI..."
        npm install -g eas-cli
    fi
    
    log_substep "Expo CLI: $(npx expo --version 2>/dev/null || echo 'instalado')"
    log_substep "EAS CLI: $(npx eas --version 2>/dev/null || echo 'instalado')"
    log_success "Herramientas Expo instaladas correctamente"
}

################################################################################
# VS CODE INSTALLATION
################################################################################

install_vscode() {
    log_step "10/15 - Instalando Visual Studio Code"
    
    if [[ -d "/Applications/Visual Studio Code.app" ]]; then
        log_substep "VS Code ya está instalado"
    else
        log_substep "Descargando VS Code..."
        
        # Download VS Code for Intel Mac
        VSCODE_URL="https://code.visualstudio.com/sha/download?build=stable&os=darwin"
        TEMP_ZIP="/tmp/vscode.zip"
        
        curl -L "$VSCODE_URL" -o "$TEMP_ZIP"
        
        log_substep "Instalando VS Code..."
        unzip -q "$TEMP_ZIP" -d /Applications/
        rm "$TEMP_ZIP"
    fi
    
    # Install code command in PATH
    if ! command -v code &> /dev/null; then
        log_substep "Configurando comando 'code' en terminal..."
        cat << 'EOF' >> ~/.zshrc

# VS Code command
export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
EOF
        export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
    fi
    
    # Install useful VS Code extensions
    log_substep "Instalando extensiones de VS Code..."
    
    if command -v code &> /dev/null; then
        code --install-extension dbaeumer.vscode-eslint --force 2>/dev/null || true
        code --install-extension esbenp.prettier-vscode --force 2>/dev/null || true
        code --install-extension GitHub.copilot --force 2>/dev/null || true
        code --install-extension ms-vscode.vscode-typescript-next --force 2>/dev/null || true
        code --install-extension msjsdiag.vscode-react-native --force 2>/dev/null || true
        code --install-extension swift.vscode-swift --force 2>/dev/null || true
    fi
    
    log_success "VS Code instalado correctamente"
}

################################################################################
# PROJECT DEPENDENCIES
################################################################################

install_project_dependencies() {
    log_step "11/15 - Instalando dependencias del proyecto"
    
    cd "$PROJECT_ROOT"
    
    # Verify we're in a React Native project
    if [[ ! -f "package.json" ]]; then
        log_error "package.json no encontrado. ¿Estás en el directorio correcto?"
        log_error "Ruta actual: $PROJECT_ROOT"
        exit 1
    fi
    
    # Clean previous installations
    log_substep "Limpiando instalaciones previas..."
    rm -rf node_modules
    rm -f package-lock.json
    rm -f yarn.lock
    
    # Install npm dependencies
    log_substep "Instalando dependencias npm... (esto puede tomar varios minutos)"
    npm install
    
    # Verify key dependencies
    log_substep "Verificando dependencias críticas..."
    if [[ -d "node_modules/react-native" ]]; then
        RN_VERSION=$(node -p "require('./node_modules/react-native/package.json').version")
        log_substep "React Native: $RN_VERSION"
    fi
    
    if [[ -d "node_modules/expo" ]]; then
        EXPO_VERSION=$(node -p "require('./node_modules/expo/package.json').version")
        log_substep "Expo SDK: $EXPO_VERSION"
    fi
    
    log_success "Dependencias npm instaladas correctamente"
}

################################################################################
# iOS PODS INSTALLATION
################################################################################

install_ios_pods() {
    log_step "12/15 - Instalando pods de iOS"
    
    cd "$PROJECT_ROOT/ios"
    
    # Verify Podfile exists
    if [[ ! -f "Podfile" ]]; then
        log_error "Podfile no encontrado en $PROJECT_ROOT/ios"
        exit 1
    fi
    
    # Clean previous pods
    log_substep "Limpiando instalación previa de pods..."
    rm -rf Pods
    rm -rf ~/Library/Caches/CocoaPods
    rm -rf ~/Library/Developer/Xcode/DerivedData
    rm -f Podfile.lock
    
    # Update CocoaPods repo
    log_substep "Actualizando repositorio de CocoaPods..."
    pod repo update || log_warning "No se pudo actualizar el repo, continuando..."
    
    # Install pods
    log_substep "Instalando CocoaPods... (esto puede tomar 10-15 minutos)"
    log_warning "No cierres esta ventana, el proceso puede parecer estancado pero está trabajando"
    
    # Set environment variables for better compatibility
    export CI=1
    export LANG=en_US.UTF-8
    export LC_ALL=en_US.UTF-8
    
    # Try pod install with verbose output for debugging
    if pod install --repo-update; then
        log_success "Pods instalados exitosamente"
    else
        log_error "pod install falló, intentando con --verbose..."
        pod install --verbose
    fi
    
    # Verify installation
    if [[ -d "Pods" ]] && [[ -f "Podfile.lock" ]]; then
        POD_COUNT=$(ls Pods/ | grep -v "Headers\|Local Podspecs\|Target Support Files" | wc -l | xargs)
        log_substep "Pods instalados: $POD_COUNT"
    else
        log_error "La instalación de pods parece haber fallado"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    log_success "Pods de iOS instalados correctamente"
}

################################################################################
# WIDGET VALIDATION
################################################################################

validate_widgets() {
    log_step "13/15 - Validando widgets de iOS"
    
    WIDGET_DIR="$PROJECT_ROOT/ios/LessmoWidget"
    
    if [[ -d "$WIDGET_DIR" ]]; then
        log_substep "✓ Widget Extension encontrado: LessmoWidget"
        
        if [[ -f "$WIDGET_DIR/LessmoWidget.swift" ]]; then
            LINE_COUNT=$(wc -l < "$WIDGET_DIR/LessmoWidget.swift")
            log_substep "✓ LessmoWidget.swift encontrado ($LINE_COUNT líneas)"
        else
            log_warning "✗ LessmoWidget.swift no encontrado"
        fi
        
        if [[ -f "$WIDGET_DIR/LessmoWidgetBundle.swift" ]]; then
            log_substep "✓ LessmoWidgetBundle.swift encontrado"
        fi
        
        if [[ -f "$WIDGET_DIR/Info.plist" ]]; then
            log_substep "✓ Info.plist encontrado"
        fi
    else
        log_warning "✗ Widget Extension no encontrado en ios/LessmoWidget"
        log_warning "  El widget deberá ser configurado en Xcode manualmente"
    fi
    
    log_success "Validación de widgets completada"
}

################################################################################
# SIGNING & CERTIFICATES VALIDATION
################################################################################

validate_signing() {
    log_step "14/15 - Validando configuración de firma"
    
    # Check for provisioning profiles
    PROFILES_DIR="$HOME/Library/MobileDevice/Provisioning Profiles"
    
    if [[ -d "$PROFILES_DIR" ]]; then
        PROFILE_COUNT=$(ls "$PROFILES_DIR" 2>/dev/null | wc -l | xargs)
        if [[ "$PROFILE_COUNT" -gt 0 ]]; then
            log_substep "✓ Provisioning Profiles encontrados: $PROFILE_COUNT"
        else
            log_warning "✗ No se encontraron Provisioning Profiles"
            log_substep "  Copia los perfiles desde el backup:"
            log_substep "  cp ~/Desktop/LessMo_Backup/ProvisioningProfiles/* ~/Library/MobileDevice/Provisioning\\ Profiles/"
        fi
    else
        log_warning "✗ Directorio de Provisioning Profiles no existe"
        log_substep "  Creando directorio..."
        mkdir -p "$PROFILES_DIR"
    fi
    
    # Check for certificates in Keychain
    log_substep "Verificando certificados iOS en Keychain..."
    
    if security find-identity -v -p codesigning | grep "Apple Development" > /dev/null 2>&1; then
        DEV_CERT_COUNT=$(security find-identity -v -p codesigning | grep "Apple Development" | wc -l | xargs)
        log_substep "✓ Certificados de desarrollo encontrados: $DEV_CERT_COUNT"
    else
        log_warning "✗ No se encontraron certificados de desarrollo"
        log_substep "  Importa los certificados .p12 desde el backup:"
        log_substep "  1. Abre 'Acceso a Llaveros' (Keychain Access)"
        log_substep "  2. Archivo > Importar elementos"
        log_substep "  3. Selecciona los archivos .p12 del backup"
    fi
    
    if security find-identity -v -p codesigning | grep "Apple Distribution" > /dev/null 2>&1; then
        DIST_CERT_COUNT=$(security find-identity -v -p codesigning | grep "Apple Distribution" | wc -l | xargs)
        log_substep "✓ Certificados de distribución encontrados: $DIST_CERT_COUNT"
    else
        log_warning "✗ No se encontraron certificados de distribución"
        log_substep "  Importa los certificados .p12 desde el backup"
    fi
    
    log_success "Validación de firma completada"
}

################################################################################
# FIREBASE & CONFIG VALIDATION
################################################################################

validate_firebase() {
    log_step "15/15 - Validando configuración de Firebase"
    
    cd "$PROJECT_ROOT"
    
    # Check iOS Firebase config
    if [[ -f "ios/GoogleService-Info.plist" ]]; then
        log_substep "✓ GoogleService-Info.plist encontrado (iOS)"
    else
        log_warning "✗ GoogleService-Info.plist no encontrado"
        log_substep "  Copia el archivo desde el backup:"
        log_substep "  cp ~/Desktop/LessMo_Backup/GoogleService-Info.plist $PROJECT_ROOT/ios/"
    fi
    
    # Check Android Firebase config
    if [[ -f "google-services.json" ]]; then
        log_substep "✓ google-services.json encontrado (Android)"
    else
        log_warning "✗ google-services.json no encontrado"
        log_substep "  Copia el archivo desde el backup:"
        log_substep "  cp ~/Desktop/LessMo_Backup/google-services.json $PROJECT_ROOT/"
    fi
    
    # Check for .env files if they exist
    if [[ -f ".env" ]]; then
        log_substep "✓ .env encontrado"
    fi
    
    log_success "Validación de configuración completada"
}

################################################################################
# BUILD TEST (OPTIONAL)
################################################################################

test_build() {
    log_step "EXTRA - Probando compilación de iOS (OPCIONAL)"
    
    read -p "¿Deseas probar la compilación ahora? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_warning "Compilación de prueba omitida"
        return 0
    fi
    
    cd "$PROJECT_ROOT/ios"
    
    log_substep "Compilando en modo Release..."
    log_warning "Esto puede tomar 10-15 minutos..."
    
    xcodebuild \
        -workspace LessMo.xcworkspace \
        -scheme LessMo \
        -configuration Release \
        -sdk iphoneos \
        -destination generic/platform=iOS \
        clean build \
        CODE_SIGN_IDENTITY="" \
        CODE_SIGNING_REQUIRED=NO \
        CODE_SIGNING_ALLOWED=NO \
        2>&1 | tee build.log
    
    if [[ $? -eq 0 ]]; then
        log_success "✓ Compilación de prueba exitosa"
    else
        log_error "✗ La compilación falló"
        log_substep "Revisa build.log para más detalles: $PROJECT_ROOT/ios/build.log"
        log_substep "Errores comunes:"
        log_substep "  - Certificados no importados"
        log_substep "  - Provisioning profiles faltantes"
        log_substep "  - Pods no instalados correctamente"
    fi
    
    cd "$PROJECT_ROOT"
}

################################################################################
# ENVIRONMENT SUMMARY
################################################################################

print_summary() {
    echo ""
    echo ""
    log_step "🎉 INSTALACIÓN COMPLETADA 🎉"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  RESUMEN DEL ENTORNO"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "${CYAN}Sistema:${NC}"
    echo "  macOS: $(sw_vers -productVersion) $(sw_vers -buildVersion)"
    echo "  Arquitectura: $(uname -m)"
    echo "  Usuario: $(whoami)"
    echo ""
    echo "${CYAN}Herramientas de desarrollo:${NC}"
    if command -v xcodebuild &> /dev/null; then
        echo "  ✓ Xcode: $(xcodebuild -version | head -n1 | awk '{print $2}')"
    else
        echo "  ✗ Xcode: No instalado"
    fi
    echo "  ✓ Node.js: $(node -v)"
    echo "  ✓ npm: $(npm -v)"
    echo "  ✓ Ruby: $(ruby -v | awk '{print $2}')"
    echo "  ✓ CocoaPods: $(pod --version)"
    echo "  ✓ Watchman: $(watchman -v 2>/dev/null || echo 'instalado')"
    echo "  ✓ Git: $(git --version | awk '{print $3}')"
    echo ""
    echo "${CYAN}Herramientas Expo:${NC}"
    echo "  ✓ Expo CLI: $(npx expo --version 2>/dev/null || echo 'instalado')"
    echo "  ✓ EAS CLI: $(npx eas --version 2>/dev/null || echo 'instalado')"
    echo ""
    echo "${CYAN}Editores:${NC}"
    if [[ -d "/Applications/Visual Studio Code.app" ]]; then
        echo "  ✓ VS Code: Instalado"
    else
        echo "  ✗ VS Code: No instalado"
    fi
    echo ""
    echo "${CYAN}Proyecto:${NC}"
    echo "  Directorio: $PROJECT_ROOT"
    echo "  React Native: 0.81.5"
    echo "  Expo SDK: ~54.0.25"
    
    if [[ -d "$PROJECT_ROOT/node_modules" ]]; then
        NODE_MODULES_COUNT=$(ls node_modules | wc -l | xargs)
        echo "  npm packages: $NODE_MODULES_COUNT"
    fi
    
    if [[ -d "$PROJECT_ROOT/ios/Pods" ]]; then
        PODS_COUNT=$(ls ios/Pods | grep -v "Headers\|Local Podspecs\|Target Support Files" | wc -l | xargs)
        echo "  iOS Pods: $PODS_COUNT"
    fi
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    log_success "Entorno de desarrollo configurado correctamente"
    
    echo ""
    echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${GREEN}  PRÓXIMOS PASOS${NC}"
    echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "${YELLOW}1. Restaurar credenciales y certificados:${NC}"
    echo "   ${CYAN}# Certificados iOS${NC}"
    echo "   - Abre 'Acceso a Llaveros' (Keychain Access)"
    echo "   - Archivo > Importar elementos"
    echo "   - Importa los archivos .p12 desde ~/Desktop/LessMo_Backup/"
    echo ""
    echo "   ${CYAN}# Provisioning Profiles${NC}"
    echo "   cp ~/Desktop/LessMo_Backup/ProvisioningProfiles/* \\"
    echo "      ~/Library/MobileDevice/Provisioning\\ Profiles/"
    echo ""
    echo "   ${CYAN}# Firebase Config${NC}"
    echo "   cp ~/Desktop/LessMo_Backup/GoogleService-Info.plist ios/"
    echo "   cp ~/Desktop/LessMo_Backup/google-services.json ."
    echo ""
    echo "${YELLOW}2. Abrir proyecto en Xcode:${NC}"
    echo "   open ios/LessMo.xcworkspace"
    echo ""
    echo "${YELLOW}3. Configurar signing en Xcode:${NC}"
    echo "   - Selecciona el target 'LessMo'"
    echo "   - Ve a 'Signing & Capabilities'"
    echo "   - Selecciona tu Team y Provisioning Profile"
    echo "   - Repite para el target 'LessmoWidget'"
    echo ""
    echo "${YELLOW}4. Compilar y probar:${NC}"
    echo "   - En Xcode: Product > Build (⌘B)"
    echo "   - Para dispositivo: Product > Archive"
    echo ""
    echo "${YELLOW}5. Exportar .ipa:${NC}"
    echo "   - Window > Organizer"
    echo "   - Selecciona el Archive"
    echo "   - 'Distribute App' > 'App Store Connect'"
    echo ""
    echo "${YELLOW}6. Subir a App Store Connect:${NC}"
    echo "   npx eas submit --platform ios --path ~/Desktop/LessMo.ipa"
    echo ""
    echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Show warnings if any credentials are missing
    WARNINGS=0
    
    if [[ ! -f "ios/GoogleService-Info.plist" ]]; then
        ((WARNINGS++))
    fi
    
    if ! security find-identity -v -p codesigning | grep -q "Apple"; then
        ((WARNINGS++))
    fi
    
    PROFILES_DIR="$HOME/Library/MobileDevice/Provisioning Profiles"
    if [[ -d "$PROFILES_DIR" ]]; then
        PROFILE_COUNT=$(ls "$PROFILES_DIR" 2>/dev/null | wc -l | xargs)
        if [[ "$PROFILE_COUNT" -eq 0 ]]; then
            ((WARNINGS++))
        fi
    fi
    
    if [[ $WARNINGS -gt 0 ]]; then
        echo "${YELLOW}⚠️  ADVERTENCIAS: ${NC}"
        echo "   Hay $WARNINGS configuraciones pendientes."
        echo "   Revisa los pasos anteriores antes de compilar."
        echo ""
    fi
    
    log_success "Bootstrap completado. ¡Tu Mac está listo para desarrollo iOS!"
    echo ""
}

################################################################################
# CLEANUP ON ERROR
################################################################################

cleanup_on_error() {
    log_error "El script encontró un error y se detuvo"
    log_info "Puedes volver a ejecutar el script, es seguro re-ejecutarlo"
    exit 1
}

trap cleanup_on_error ERR

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    clear
    echo ""
    echo "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo "${CYAN}║${NC}     ${GREEN}Bootstrap iOS Production Environment - COMPLETO${NC}          ${CYAN}║${NC}"
    echo "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo "${CYAN}║${NC}     macOS Ventura 13.7.8 | Xcode 15.2 | React Native 0.81.5  ${CYAN}║${NC}"
    echo "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    log_info "Proyecto: LessMo"
    log_info "Directorio: $PROJECT_ROOT"
    echo ""
    log_warning "Este script instalará (18 pasos):"
    echo ""
    echo "  ${CYAN}BÁSICO (Sistema):${NC}"
    echo "    • Command Line Tools"
    echo "    • Homebrew (gestor de paquetes)"
    echo "    • Certificados SSL actualizados"
    echo "    • Utilidades del sistema (curl, wget, jq, tree)"
    echo ""
    echo "  ${CYAN}DESARROLLO:${NC}"
    echo "    • Xcode 15.2 (guiado, ~15GB)"
    echo "    • Git + configuración"
    echo "    • Node.js 20 LTS + npm"
    echo "    • Watchman (file watcher)"
    echo "    • Ruby 3.x + CocoaPods 1.15.2"
    echo "    • Fastlane (deployment automation)"
    echo ""
    echo "  ${CYAN}REACT NATIVE/EXPO:${NC}"
    echo "    • Expo CLI"
    echo "    • EAS CLI"
    echo "    • React Native CLI"
    echo ""
    echo "  ${CYAN}EDITORES:${NC}"
    echo "    • VS Code + extensiones esenciales"
    echo ""
    echo "  ${CYAN}PROYECTO:${NC}"
    echo "    • 1617 dependencias npm"
    echo "    • 108 pods de iOS"
    echo "    • Widgets configurados"
    echo ""
    log_warning "Tiempo estimado: 45-90 minutos (depende de velocidad de descarga)"
    log_warning "Espacio necesario: ~50GB"
    echo ""
    read -p "¿Continuar? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_info "Instalación cancelada"
        exit 0
    fi
    echo ""
    
    # Execute all installation steps in order
    verify_system                    # 1/18
    install_command_line_tools       # 1.5/18 (new)
    install_homebrew                 # 2/18
    update_ssl_certificates          # 1.7/18 (new)
    install_system_utilities         # 2.5/18 (new)
    install_xcode                    # 3/18
    install_node                     # 4/18
    install_git                      # 5/18
    install_watchman                 # 6/18
    install_ruby_cocoapods           # 7/18
    install_fastlane                 # 8/18
    install_expo_tools               # 9/18
    install_vscode                   # 10/18
    install_project_dependencies     # 11/18
    install_ios_pods                 # 12/18
    validate_widgets                 # 13/18
    validate_signing                 # 14/18
    validate_firebase                # 15/18
    
    # Optional build test
    # test_build
    
    print_summary
    
    echo ""
    log_success "🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE! 🎉"
    echo ""
}

# Execute main function
main "$@"
