#!/usr/bin/env python3
"""
Script AGRESIVO para eliminar fondos blancos de iconos
- Elimina TODOS los colores claros (no solo blancos)
- Hace fondos 100% transparentes
- Agranda el contenido al 90% del canvas
- Mantiene máxima calidad
"""

from PIL import Image
import os

def remove_light_background_aggressive(img):
    """Elimina fondos blancos/grises/claros de forma AGRESIVA"""
    # Convertir a RGBA
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    data = img.getdata()
    new_data = []
    
    # UMBRAL MÁS AGRESIVO: cualquier color con R,G,B > 200 se considera fondo
    threshold = 200
    
    for item in data:
        r, g, b, a = item
        
        # Si es un color claro (blanco, gris claro, beige, etc.) → transparente
        if r > threshold and g > threshold and b > threshold:
            new_data.append((255, 255, 255, 0))
        # Si ya era semi-transparente, hacerlo más transparente
        elif a < 50:
            new_data.append((r, g, b, 0))
        else:
            # Mantener píxeles de color
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def process_icon_aggressive(input_path, output_path, canvas_size=(600, 600)):
    """Procesa icono: elimina fondo claro y lo hace MÁS GRANDE"""
    print(f"🔥 Procesando AGRESIVO: {os.path.basename(input_path)}")
    
    # Abrir imagen
    img = Image.open(input_path)
    original_size = img.size
    
    # 1. Eliminar fondo claro PRIMERO
    img = remove_light_background_aggressive(img)
    
    # 2. Recortar partes transparentes (auto-crop)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        print(f"   ✂️  Recortado de {original_size} a {img.size}")
    
    # 3. Calcular nuevo tamaño: usar el 90% del canvas (MÁS GRANDE)
    target_size = int(canvas_size[0] * 0.9), int(canvas_size[1] * 0.9)
    
    # Calcular proporción para mantener aspect ratio
    ratio = min(target_size[0] / img.width, target_size[1] / img.height)
    new_size = int(img.width * ratio), int(img.height * ratio)
    
    # 4. Redimensionar con máxima calidad
    img = img.resize(new_size, Image.Resampling.LANCZOS)
    print(f"   📏 Redimensionado a {new_size} (90% del canvas)")
    
    # 5. Crear canvas transparente 600x600
    canvas = Image.new('RGBA', canvas_size, (0, 0, 0, 0))
    
    # 6. Centrar imagen en canvas
    offset_x = (canvas_size[0] - img.width) // 2
    offset_y = (canvas_size[1] - img.height) // 2
    canvas.paste(img, (offset_x, offset_y), img)
    
    # 7. Guardar con máxima calidad
    canvas.save(output_path, 'PNG', optimize=True, quality=100)
    
    size_kb = os.path.getsize(output_path) / 1024
    print(f"   ✅ Guardado: {os.path.basename(output_path)} ({size_kb:.1f} KB)\n")

def main():
    icons_dir = '/Users/adanmonterotorres/Projects/LessMo/LessMo/assets/payment-methods'
    
    icons = [
        'paypal.png',
        'bizum.png',
        'venmo.png',
        'apple-pay.png',
        'google-pay.png',
        'card.png',
        'cash.png',
        'bank_transfer.png',
        'other.png'
    ]
    
    print("🔥 PROCESAMIENTO AGRESIVO DE ICONOS")
    print("=" * 50)
    print(f"📁 Directorio: {icons_dir}")
    print(f"🎯 Canvas: 600x600px")
    print(f"📐 Iconos al 90% del canvas")
    print(f"🧹 Eliminando TODOS los fondos claros (RGB > 200)")
    print("=" * 50 + "\n")
    
    processed = 0
    for icon in icons:
        input_path = os.path.join(icons_dir, icon)
        
        if os.path.exists(input_path):
            try:
                # Hacer backup primero
                backup_path = input_path + '.backup'
                if not os.path.exists(backup_path):
                    import shutil
                    shutil.copy2(input_path, backup_path)
                    print(f"💾 Backup creado: {icon}.backup")
                
                process_icon_aggressive(input_path, input_path)
                processed += 1
            except Exception as e:
                print(f"   ❌ Error: {e}\n")
        else:
            print(f"   ⚠️  No encontrado: {icon}\n")
    
    print("=" * 50)
    print(f"✨ Completado: {processed}/{len(icons)} iconos procesados")
    print(f"📦 Backups guardados como *.png.backup")
    print(f"🔄 Limpia cache: rm -rf .expo node_modules/.cache")
    print(f"🚀 Reinicia: npx expo start --go --tunnel --clear")
    print("=" * 50)

if __name__ == '__main__':
    main()
