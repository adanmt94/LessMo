# Guía: Compilar y Subir App iOS Manualmente desde Xcode

## 📱 Paso 1: Compilar en Xcode

1. Abre el workspace:
```bash
open ios/LessMo.xcworkspace
```

2. En Xcode:
   - Selecciona el esquema **LessMo** (arriba a la izquierda)
   - Selecciona **Any iOS Device (arm64)** como destino (no iPhone específico, no simulador)
   - Ve a `Product` → `Scheme` → `Edit Scheme...`
   - En `Run`, cambia `Build Configuration` a **Release**
   - Cierra el diálogo

3. Compila el archive:
   - Ve a `Product` → `Archive`
   - Espera 5-10 minutos mientras compila
   - Cuando termine, se abrirá la ventana **Organizer**

## 📦 Paso 2: Exportar el .ipa

En la ventana Organizer:

1. Selecciona el archive que acabas de crear
2. Click en **Distribute App**
3. Selecciona **App Store Connect**
4. Click **Next**
5. Selecciona **Export**
6. Click **Next**
7. Deja las opciones por defecto
8. Click **Next**
9. Revisa el resumen
10. Click **Export**
11. Selecciona dónde guardar (ej: Desktop)
12. Click **Export**

Se creará una carpeta con el archivo `.ipa` dentro.

## ☁️ Paso 3: Subir a App Store Connect

Opción A - Desde Terminal (más rápido):

```bash
# Navega a donde guardaste el .ipa
cd ~/Desktop/LessMo

# Encuentra el archivo .ipa
ls -la *.ipa

# Súbelo con EAS
eas submit --platform ios --path "LessMo.ipa"
```

Opción B - Desde Xcode Organizer:

1. En la ventana Organizer
2. Click en **Distribute App** (otra vez)
3. Esta vez selecciona **App Store Connect**
4. Click **Upload**
5. Sigue los pasos y espera la subida

## ✅ Verificar en App Store Connect

1. Ve a https://appstoreconnect.apple.com
2. Entra en tu app LessMo
3. Ve a **TestFlight**
4. En 5-10 minutos aparecerá la nueva build
5. Podrás distribuirla a testers

## 🔧 Solución de Problemas

### Error: "No signing certificate"
- Ve a Xcode → Preferences → Accounts
- Selecciona tu cuenta de Apple
- Click en "Manage Certificates"
- Si no hay certificado, créalo con el botón "+"

### Error: "No provisioning profile"
- Ve a https://developer.apple.com
- Certificates, Identifiers & Profiles
- Profiles → + (crear nuevo)
- App Store → Continuar
- Selecciona tu App ID
- Selecciona tu certificado
- Descarga e instala (doble click)

### El archive no se crea
- Asegúrate de seleccionar "Any iOS Device (arm64)"
- NO uses un simulador ni iPhone específico
- Build Configuration debe ser "Release"

### Error al subir
- Verifica que el Bundle ID coincida con App Store Connect
- Verifica que la versión sea mayor a la última subida
- Incrementa el Build Number si es necesario
