#!/bin/bash

# Script para convertir SVG a PNG
# Requiere: librsvg (instalable con: brew install librsvg)

ASSETS_DIR="/Users/adanmonterotorres/Projects/LessMo/LessMo/assets/payment-methods"

echo "🎨 Convirtiendo SVGs a PNG..."

cd "$ASSETS_DIR"

# Verificar si rsvg-convert está instalado
if ! command -v rsvg-convert &> /dev/null; then
    echo "❌ rsvg-convert no está instalado"
    echo "📦 Instalando librsvg con Homebrew..."
    brew install librsvg
fi

# Convertir cada SVG a PNG
for svg in *.svg; do
    if [ -f "$svg" ]; then
        png="${svg%.svg}.png"
        echo "  📄 $svg → $png"
        rsvg-convert -w 200 -h 200 "$svg" -o "$png"
    fi
done

echo "✅ Conversión completada!"
echo ""
echo "📁 Archivos PNG generados en:"
echo "   $ASSETS_DIR"
