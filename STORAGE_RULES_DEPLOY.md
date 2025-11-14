# Firebase Storage Rules - Despliegue

## Error actual
```
Firebase Storage: An unknown error occurred (storage/unknown)
```

Este error ocurre porque las reglas de Firebase Storage no están configuradas correctamente.

## Solución

### Opción 1: Firebase Console (Recomendada)

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto LessMo
3. En el menú lateral, ve a **Storage** → **Rules**
4. Copia y pega el contenido de `storage.rules`
5. Haz clic en **Publicar**

### Opción 2: Firebase CLI

```bash
# Si tienes Firebase CLI instalado
firebase deploy --only storage
```

## Verificación

Una vez desplegadas las reglas, prueba subir una foto de perfil desde la app.

## Reglas Aplicadas

Las reglas permiten:
- ✅ **Lectura**: Cualquiera puede ver las fotos de perfil
- ✅ **Escritura**: Solo usuarios autenticados pueden subir su propia foto
- ✅ **Límite**: Máximo 5MB por imagen
- ✅ **Tipo**: Solo archivos de imagen (image/*)

## Nota Importante

Las reglas de Storage son independientes de las de Firestore. Debes desplegarlas manualmente desde la consola de Firebase o con Firebase CLI.
