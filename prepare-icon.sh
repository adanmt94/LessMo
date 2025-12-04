#!/bin/bash

# Script para preparar el nuevo icono de LessMo
# Este script toma el icono adjunto y lo prepara para la app

echo "🎨 Preparando nuevo icono para LessMo..."

# Colores del icono
echo "📊 Icono actual:"
echo "  - Fondo: Gradiente azul oscuro a azul (#0A1E54 → #2D5DA8)"
echo "  - Texto: Blanco"
echo "  - Diseño: 'Les\$Mo' con símbolo de dólar integrando S y M"

# Verificar que existe el icono adjunto
if [ ! -f "assets/icon-new.png" ]; then
    echo "❌ ERROR: No se encontró el archivo icon-new.png"
    echo ""
    echo "📝 PASOS MANUALES:"
    echo "1. Guarda la imagen adjunta del chat como: assets/icon-new.png"
    echo "2. Asegúrate que sea 1024x1024 píxeles"
    echo "3. Ejecuta este script de nuevo"
    exit 1
fi

# Verificar ImageMagick
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick no instalado. Instalando..."
    brew install imagemagick
fi

# Usar magick o convert según disponibilidad
if command -v magick &> /dev/null; then
    CONVERT="magick"
else
    CONVERT="convert"
fi

# Verificar tamaño de la imagen
echo "🔍 Verificando dimensiones..."
DIMS=$($CONVERT assets/icon-new.png -format "%wx%h" info:)
echo "  Tamaño actual: $DIMS"

if [ "$DIMS" != "1024x1024" ]; then
    echo "⚠️  El icono no es 1024x1024. Redimensionando..."
    $CONVERT assets/icon-new.png -resize 1024x1024\! assets/icon-new-resized.png
    mv assets/icon-new-resized.png assets/icon-new.png
    echo "✅ Redimensionado a 1024x1024"
fi

# Backup del icono anterior
echo "💾 Creando backup del icono anterior..."
if [ -f "assets/icon.png" ]; then
    cp assets/icon.png assets/icon-backup-$(date +%Y%m%d_%H%M%S).png
    echo "✅ Backup creado"
fi

# Reemplazar icono principal
echo "🔄 Reemplazando icono principal..."
cp assets/icon-new.png assets/icon.png
echo "✅ Icon.png actualizado"

# Crear icono adaptativo para Android (foreground)
echo "📱 Creando icono adaptativo para Android..."
# El adaptive icon necesita un foreground de 1024x1024 con padding
$CONVERT assets/icon-new.png -resize 768x768 -gravity center -background transparent -extent 1024x1024 assets/adaptive-icon.png
echo "✅ Adaptive-icon.png creado"

# Actualizar splash icon si existe
if [ -f "assets/splash-icon.png" ]; then
    echo "💦 Actualizando splash icon..."
    cp assets/icon-new.png assets/splash-icon.png
    echo "✅ Splash-icon.png actualizado"
fi

# Crear favicon para web
echo "🌐 Creando favicon..."
$CONVERT assets/icon-new.png -resize 48x48 assets/favicon.png
echo "✅ Favicon.png creado"

echo ""
echo "✅ ¡ICONO PREPARADO EXITOSAMENTE!"
echo ""
echo "📋 Archivos actualizados:"
echo "  ✓ assets/icon.png (1024x1024) - iOS/Android"
echo "  ✓ assets/adaptive-icon.png (1024x1024) - Android adaptive"
echo "  ✓ assets/favicon.png (48x48) - Web"
echo ""
echo "🚀 PRÓXIMO PASO:"
echo "  Cuando quieras crear la build con el nuevo icono, ejecuta:"
echo "  npm run build:ios"
echo "  o"
echo "  eas build --platform ios --profile production"
echo ""
echo "📝 NOTA: El icono se aplicará automáticamente en la próxima build"
