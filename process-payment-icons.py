#!/usr/bin/env python3
"""
Script para procesar iconos de métodos de pago:
- Redimensionar a 600x600px
- Eliminar fondo blanco/gris claro
- Hacer fondo transparente
- Mantener calidad máxima
"""

from PIL import Image
import os

def remove_white_background(img):
    """Elimina el fondo blanco/gris claro y lo hace transparente"""
    # Convertir a RGBA si no lo está
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Obtener datos de píxeles
    data = img.getdata()
    new_data = []
    
    # Umbral para considerar un color como "blanco" (RGB > 235)
    white_threshold = 235
    
    for item in data:
        # Cambiar todos los píxeles blancos/grises claros a transparente
        if item[0] > white_threshold and item[1] > white_threshold and item[2] > white_threshold:
            # Hacer transparente (alpha = 0)
            new_data.append((255, 255, 255, 0))
        else:
            # Mantener el píxel original
            new_data.append(item)
    
    # Actualizar datos de imagen
    img.putdata(new_data)
    return img

def process_icon(input_path, output_path, target_size=(600, 600)):
    """Procesa un icono: redimensiona y elimina fondo blanco"""
    print(f"📸 Procesando: {os.path.basename(input_path)}")
    
    # Abrir imagen
    img = Image.open(input_path)
    
    # Eliminar fondo blanco primero
    img = remove_white_background(img)
    
    # Calcular nuevo tamaño manteniendo aspect ratio
    img.thumbnail(target_size, Image.Resampling.LANCZOS)
    
    # Crear canvas 600x600 transparente
    canvas = Image.new('RGBA', target_size, (0, 0, 0, 0))
    
    # Centrar imagen en canvas
    offset_x = (target_size[0] - img.width) // 2
    offset_y = (target_size[1] - img.height) // 2
    canvas.paste(img, (offset_x, offset_y), img)
    
    # Guardar con máxima calidad
    canvas.save(output_path, 'PNG', optimize=True, quality=100)
    
    # Mostrar tamaño de archivo
    size_kb = os.path.getsize(output_path) / 1024
    print(f"   ✅ Guardado: {os.path.basename(output_path)} ({size_kb:.1f} KB)")

def main():
    # Directorio de iconos
    icons_dir = '/Users/adanmonterotorres/Projects/LessMo/LessMo/assets/payment-methods'
    
    # Lista de iconos a procesar
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
    
    print("🎨 Procesando iconos de métodos de pago...")
    print(f"📁 Directorio: {icons_dir}")
    print(f"🎯 Tamaño objetivo: 600x600px")
    print(f"🔍 Eliminando fondos blancos/grises claros\n")
    
    processed = 0
    for icon in icons:
        input_path = os.path.join(icons_dir, icon)
        output_path = input_path  # Sobreescribir archivo original
        
        if os.path.exists(input_path):
            try:
                process_icon(input_path, output_path)
                processed += 1
            except Exception as e:
                print(f"   ❌ Error procesando {icon}: {e}")
        else:
            print(f"   ⚠️  No encontrado: {icon}")
    
    print(f"\n✨ Proceso completado: {processed}/{len(icons)} iconos procesados")
    print("🔄 Recuerda reiniciar Metro con: npx expo start --go --tunnel --clear")

if __name__ == '__main__':
    main()
