from PIL import Image, ImageDraw, ImageFont
import os

output_dir = 'assets/payment-methods'
size = (400, 400)

icons = {
    'zelle': {'bg': '#6d1ed4', 'text': 'Z', 'text_color': '#ffffff'},
    'stripe': {'bg': '#635bff', 'text': 'S', 'text_color': '#ffffff'},
    'bank': {'bg': '#4a90e2', 'text': '🏦', 'text_color': '#ffffff'},
    'cash': {'bg': '#28a745', 'text': '$', 'text_color': '#ffffff'},
    'card': {'bg': '#ff6b6b', 'text': '💳', 'text_color': '#ffffff'}
}

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

for name, config in icons.items():
    img = Image.new('RGBA', size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Fondo de color
    bg_color = hex_to_rgb(config['bg']) + (255,)
    draw.rounded_rectangle([0, 0, size[0]-1, size[1]-1], radius=60, fill=bg_color)
    
    # Borde
    draw.rounded_rectangle([8, 8, size[0]-9, size[1]-9], radius=52, outline=(255, 255, 255, 255), width=12)
    
    text = config['text']
    if text:
        try:
            font_size = 180 if len(text) == 1 and text.isalpha() else 140
            try:
                font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', font_size)
            except:
                font = ImageFont.load_default()
            
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (size[0] - text_width) // 2
            y = (size[1] - text_height) // 2 - 10
            
            # Sombra
            draw.text((x+3, y+3), text, font=font, fill=(0, 0, 0, 80))
            
            # Texto
            text_color = hex_to_rgb(config['text_color']) + (255,)
            draw.text((x, y), text, font=font, fill=text_color)
        except Exception as e:
            print(f"Error with {name}: {e}")
    
    output_path = f'{output_dir}/{name}.png'
    img.save(output_path, 'PNG', optimize=True)
    print(f'✓ Created {name}.png ({img.size[0]}x{img.size[1]})')

print('\n✓ All missing icons created!')
