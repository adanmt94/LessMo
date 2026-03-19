#!/usr/bin/env python3
"""
Script para crear logos PNG simples para métodos de pago
Usa PIL/Pillow para crear imágenes
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    # Directorio de salida
    output_dir = "/Users/adanmonterotorres/Projects/LessMo/LessMo/assets/payment-methods"
    
    # Crear logos que faltan
    logos_to_create = {
        "bizum": {"color": "#0066FF", "text": ">>", "bg": "#FFFFFF"},
        "zelle": {"color": "#6D1ED4", "text": "Z", "bg": "#FFFFFF"},
        "bank": {"color": "#2563EB", "text": "🏦", "bg": "#FFFFFF"},
        "cash": {"color": "#10B981", "text": "$", "bg": "#FFFFFF"},
        "card": {"color": "#3B82F6", "text": "💳", "bg": "#FFFFFF"},
        "stripe": {"color": "#635BFF", "text": "S", "bg": "#FFFFFF"},
        "generic": {"color": "#3B82F6", "text": "$", "bg": "#FFFFFF"},
    }
    
    for name, config in logos_to_create.items():
        # Crear imagen 200x200 con fondo transparente
        img = Image.new('RGBA', (200, 200), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)
        
        # Dibujar círculo de fondo
        margin = 20
        draw.ellipse([margin, margin, 200-margin, 200-margin], fill=config["color"])
        
        # Dibujar texto
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 80)
        except:
            font = ImageFont.load_default()
        
        # Centrar texto
        bbox = draw.textbbox((0, 0), config["text"], font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (200 - text_width) / 2
        y = (200 - text_height) / 2 - 10
        
        draw.text((x, y), config["text"], fill="white", font=font)
        
        # Guardar
        output_path = os.path.join(output_dir, f"{name}.png")
        img.save(output_path, "PNG")
        print(f"✅ Creado: {name}.png")
    
    print("\n🎉 Todos los logos fueron creados exitosamente!")
    
except ImportError:
    print("❌ PIL/Pillow no está instalado")
    print("📦 Instálalo con: pip3 install Pillow")
except Exception as e:
    print(f"❌ Error: {e}")
