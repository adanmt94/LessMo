#!/bin/bash

# Script para verificar la configuración de Google Sign-In
# Ejecuta: chmod +x check-google-config.sh && ./check-google-config.sh

echo "🔍 Verificando configuración de Google Sign-In para LessMo..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar archivo .env
echo "1️⃣  Verificando archivo .env..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Archivo .env encontrado${NC}"
    
    if grep -q "GOOGLE_ANDROID_CLIENT_ID" .env; then
        echo -e "${GREEN}✅ GOOGLE_ANDROID_CLIENT_ID configurado${NC}"
    else
        echo -e "${RED}❌ GOOGLE_ANDROID_CLIENT_ID no encontrado${NC}"
    fi
    
    if grep -q "GOOGLE_IOS_CLIENT_ID" .env; then
        echo -e "${GREEN}✅ GOOGLE_IOS_CLIENT_ID configurado${NC}"
    else
        echo -e "${RED}❌ GOOGLE_IOS_CLIENT_ID no encontrado${NC}"
    fi
    
    if grep -q "GOOGLE_WEB_CLIENT_ID" .env; then
        echo -e "${GREEN}✅ GOOGLE_WEB_CLIENT_ID configurado${NC}"
    else
        echo -e "${RED}❌ GOOGLE_WEB_CLIENT_ID no encontrado${NC}"
    fi
else
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    echo "   Crea uno copiando .env.example"
fi

echo ""

# 2. Verificar app.config.js
echo "2️⃣  Verificando app.config.js..."
if [ -f "app.config.js" ]; then
    echo -e "${GREEN}✅ Archivo app.config.js encontrado${NC}"
    
    if grep -q "googleSignIn" app.config.js; then
        echo -e "${GREEN}✅ Configuración googleSignIn (iOS) encontrada${NC}"
    else
        echo -e "${YELLOW}⚠️  Configuración googleSignIn (iOS) no encontrada${NC}"
    fi
    
    if grep -q "googleServicesFile" app.config.js; then
        echo -e "${GREEN}✅ Configuración googleServicesFile (Android) encontrada${NC}"
    else
        echo -e "${YELLOW}⚠️  Configuración googleServicesFile (Android) no encontrada${NC}"
    fi
else
    echo -e "${RED}❌ Archivo app.config.js no encontrado${NC}"
fi

echo ""

# 3. Verificar google-services.json
echo "3️⃣  Verificando google-services.json (Android)..."
if [ -f "google-services.json" ]; then
    echo -e "${GREEN}✅ Archivo google-services.json encontrado en raíz${NC}"
elif [ -f "android/app/google-services.json" ]; then
    echo -e "${GREEN}✅ Archivo google-services.json encontrado en android/app/${NC}"
else
    echo -e "${RED}❌ Archivo google-services.json NO encontrado${NC}"
    echo "   Descárgalo desde Firebase Console → Project Settings → Your apps (Android)"
fi

echo ""

# 4. Verificar GoogleService-Info.plist (iOS)
echo "4️⃣  Verificando GoogleService-Info.plist (iOS)..."
if [ -f "GoogleService-Info.plist" ]; then
    echo -e "${GREEN}✅ Archivo GoogleService-Info.plist encontrado en raíz${NC}"
elif [ -f "ios/LessMo/GoogleService-Info.plist" ]; then
    echo -e "${GREEN}✅ Archivo GoogleService-Info.plist encontrado en ios/LessMo/${NC}"
else
    echo -e "${RED}❌ Archivo GoogleService-Info.plist NO encontrado${NC}"
    echo "   Descárgalo desde Firebase Console → Project Settings → Your apps (iOS)"
    echo "   Pasos:"
    echo "   1. Si no tienes app iOS registrada: Add app → iOS"
    echo "   2. Bundle ID: com.lessmo.app"
    echo "   3. Download GoogleService-Info.plist"
    echo "   4. Colócalo en la raíz del proyecto"
fi

echo ""

# 5. Verificar dependencias
echo "5️⃣  Verificando dependencias de npm..."
if [ -f "package.json" ]; then
    if grep -q "expo-auth-session" package.json; then
        echo -e "${GREEN}✅ expo-auth-session instalado${NC}"
    else
        echo -e "${RED}❌ expo-auth-session NO instalado${NC}"
        echo "   Ejecuta: npm install expo-auth-session"
    fi
    
    if grep -q "expo-web-browser" package.json; then
        echo -e "${GREEN}✅ expo-web-browser instalado${NC}"
    else
        echo -e "${RED}❌ expo-web-browser NO instalado${NC}"
        echo "   Ejecuta: npm install expo-web-browser"
    fi
fi

echo ""

# 6. Obtener SHA-1 y SHA-256
echo "6️⃣  Obteniendo SHA-1 y SHA-256 del keystore de debug..."
if [ -f "$HOME/.android/debug.keystore" ]; then
    echo -e "${GREEN}✅ Debug keystore encontrado${NC}"
    echo ""
    echo "Ejecuta este comando para ver tus SHA fingerprints:"
    echo -e "${YELLOW}keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android${NC}"
    echo ""
    echo "Luego agrega el SHA-1 y SHA-256 a Firebase Console:"
    echo "→ Project Settings → Your apps (Android) → Add fingerprint"
else
    echo -e "${RED}❌ Debug keystore NO encontrado${NC}"
    echo "   Crea uno con Android Studio o ejecutando una build de Android"
fi

echo ""

# 7. Resumen
echo "================================================"
echo "📋 RESUMEN DE PENDIENTES"
echo "================================================"
echo ""
echo "Para que Google Sign-In funcione, asegúrate de:"
echo ""
echo "1. ✅ Habilitar Google en Firebase Console:"
echo "   → Authentication → Sign-in method → Google (Enable)"
echo ""
echo "2. ✅ Agregar SHA-1 y SHA-256 a Firebase (Android):"
echo "   → Project Settings → Your apps (Android) → Add fingerprint"
echo ""
echo "3. ✅ Descargar archivos de configuración:"
echo ""
echo "   ANDROID:"
echo "   → Project Settings → Download google-services.json"
echo "   → Colocarlo en la raíz del proyecto: ./google-services.json"
echo ""
echo "   iOS:"
echo "   → Si no tienes app iOS: Add app → iOS (Bundle ID: com.lessmo.app)"
echo "   → Project Settings → Download GoogleService-Info.plist"
echo "   → Colocarlo en la raíz del proyecto: ./GoogleService-Info.plist"
echo ""
echo "4. ✅ Agregar test users en Google Cloud Console:"
echo "   → APIs & Services → OAuth consent screen → Test users"
echo "   → Agrega tu email de prueba"
echo ""
echo "5. ✅ Rebuild la app:"
echo "   → npx expo start --clear"
echo ""
echo "6. ✅ Probar en DISPOSITIVO REAL (no emulador)"
echo ""
echo "================================================"
echo "📚 Documentación: SOLUCION_ERRORES_GOOGLE.md"
echo "================================================"
