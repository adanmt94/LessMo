# Prompt para Claude 4.5 — Crear build local de iOS en producción y subirla a App Store Connect

Quiero que generes un script llamado `deploy_ios.sh` para macOS que haga lo siguiente:

## 🚀 Objetivo del script
El script debe crear una **build local de iOS en modo producción** usando EAS y después **subir automáticamente el archivo .ipa a App Store Connect**.

---

## 🔧 Requisitos detallados del script

1. Crear una build local de iOS usando el perfil de producción:
   ```
   eas build --platform ios --profile production --local
   ```

2. Validar:
   - Si EAS CLI está instalado; si no, instalarlo con npm.
   - Que Xcode está instalado correctamente.
   - Que tengo sesión iniciada en Apple Developer; si no, que solicite inicio de sesión mediante `eas submit`.

3. Encontrar automáticamente el archivo `.ipa` generado en cualquier carpeta dentro del proyecto.
   - Debe ser compatible con rutas que tengan espacios.
   - Debe tomar siempre el primer `.ipa` encontrado.

4. Subir el archivo `.ipa` a App Store Connect usando:
   ```
   eas submit --platform ios --path "<ruta_del_ipa>"
   ```

5. El script debe incluir:
   - Shebang (`#!/bin/bash`)
   - Mensajes de estado claros en cada paso
   - Manejo de errores (`set -e`)
   - Texto claro y fácil de entender para depuración
   - Compatibilidad total con macOS

---

## 🧩 Formato esperado de la respuesta de Claude

Claude debe devolver **solo el contenido final del archivo `deploy_ios.sh`**, sin explicaciones adicionales, listo para copiar y pegar en un archivo local en mi Mac.

El script debe ser completamente funcional al ejecutar:

```
chmod +x deploy_ios.sh
./deploy_ios.sh
```

---

## 🎯 Resultado esperado

Claude debe generar un script profesional que:

- Genere una build local en modo producción  
- Detecte automáticamente el archivo IPA  
- Lo suba a App Store Connect vía TestFlight  
- Sin consumir builds del plan gratuito de Expo Cloud  
