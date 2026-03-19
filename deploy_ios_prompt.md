# Prompt para Claude 4.5 — Crear build local de iOS y subirla a App Store Connect

Quiero que generes un script completo para macOS llamado `deploy_ios.sh` que haga todo el proceso de generar una build local de iOS usando EAS y subirla automáticamente a App Store Connect.

## 🔧 Requisitos del script

El script debe:

1. Generar una build local de iOS usando EAS BUILD sin usar Expo Cloud:
   ```
   eas build --platform ios --profile production --local
   ```

2. Validar:
   - Que EAS CLI está instalado (si no, instalarlo).
   - Que Xcode está instalado.
   - Que tengo sesión iniciada en Apple (si no, pedir login con EAS).

3. Detectar automáticamente la ruta final del archivo `.ipa` generado.

4. Subir el archivo `.ipa` a App Store Connect usando:
   ```
   eas submit --platform ios --path <ruta_del_ipa>
   ```

5. Mostrar mensajes claros en cada paso y detenerse si hay un error.

6. Ser compatible con rutas con espacios.

## 🧩 Estructura esperada de salida de Claude

Claude debe devolver SOLO el contenido final del archivo `deploy_ios.sh`, sin explicaciones adicionales, listo para pegarlo en un archivo local.

El script debe incluir:

- Shebang (`#!/bin/bash`)
- Comprobaciones de herramientas
- Generación de build local
- Auto-detección del archivo IPA
- Subida automática a App Store Connect
- Manejo de errores
- Mensajes de estado claros

## 🎯 Resultado esperado

Claude debe devolver un script funcional y profesional que permita ejecutar:

```
chmod +x deploy_ios.sh
./deploy_ios.sh
```

Y que automáticamente:

- Construya la IPA en local  
- La encuentre  
- La suba a TestFlight  
- Sin consumir builds del plan gratuito de Expo Cloud
