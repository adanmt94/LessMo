# Implementación de Exportación a Excel - COMPLETADA ✅

## Resumen

Se ha implementado completamente la funcionalidad de exportación de eventos y gastos a archivos Excel (.xlsx), compatible con **expo-file-system v19** (la versión más reciente con API renovado).

---

## 🎯 Cambios Implementados

### 1. **Nuevo archivo: `src/utils/exportUtils.ts`**

Este archivo contiene las funciones principales para exportar datos a Excel:

#### Funciones implementadas:

- **`exportExpensesToExcel(event, expenses, participants)`**
  - Exporta un evento individual con 3 hojas:
    - **Resumen**: Información del evento (nombre, presupuesto, total gastado, participantes)
    - **Gastos**: Lista detallada de todos los gastos con fecha, pagador, beneficiarios, etc.
    - **Participantes**: Lista de participantes con balances calculados
  - Genera nombres de archivo únicos con timestamp
  - Comparte el archivo usando la funcionalidad nativa del dispositivo

- **`exportAllEventsToExcel(events, allExpenses, allParticipants)`**
  - Exporta todos los eventos del usuario en un solo archivo Excel
  - Crea una hoja por evento (limitado a 31 caracteres por Excel)
  - Incluye gastos y participantes de cada evento

#### Características técnicas:
- Utiliza **XLSX.js** para generar archivos Excel
- Compatible con **expo-file-system v19** (nuevo API con clases `Paths`, `File`, `Directory`)
- Usa **expo-sharing** para compartir archivos generados
- Formato de codificación: Base64
- Almacenamiento temporal en caché (`Paths.cache`)

---

### 2. **Actualización: `src/screens/EventDetailScreen.tsx`**

Se añadió un botón de exportación en el header de la pantalla de detalle del evento:

```tsx
<TouchableOpacity onPress={handleExportToExcel} style={styles.exportButton}>
  <Text style={styles.exportIcon}>📊</Text>
</TouchableOpacity>
```

- **Función `handleExportToExcel`**: 
  - Importa dinámicamente `exportExpensesToExcel`
  - Exporta el evento actual con todos sus gastos y participantes
  - Muestra alertas de éxito/error

---

### 3. **Actualización: `src/screens/SettingsScreen.tsx`**

Se implementó completamente la opción **"Exportar datos"**:

- Al presionar, solicita confirmación al usuario
- Obtiene **todos los eventos** del usuario actual
- Obtiene **gastos y participantes** de cada evento
- Llama a `exportAllEventsToExcel` para generar el archivo
- Muestra el número de eventos exportados

#### Flujo completo:
1. Usuario toca "Exportar datos"
2. Se muestra diálogo de confirmación
3. Se cargan todos los eventos con `getUserEvents(user.uid)`
4. Se cargan gastos/participantes de cada evento
5. Se genera el archivo Excel
6. Se comparte automáticamente con el sistema nativo

---

## 🔧 Dependencias Instaladas

```bash
npm install xlsx
npx expo install expo-file-system expo-sharing
```

- **xlsx**: Librería para crear/leer archivos Excel
- **expo-file-system v19.0.17**: Manejo de archivos (API renovado)
- **expo-sharing**: Compartir archivos con el sistema

---

## 📝 API de expo-file-system v19

### Cambios importantes respecto a versiones anteriores:

**Antes (v18 y anteriores):**
```typescript
import * as FileSystem from 'expo-file-system';

const fileUri = FileSystem.documentDirectory + 'file.xlsx';
await FileSystem.writeAsStringAsync(fileUri, data, {
  encoding: FileSystem.EncodingType.Base64
});
```

**Ahora (v19):**
```typescript
import { Paths, File } from 'expo-file-system';
import { EncodingType } from 'expo-file-system/build/ExpoFileSystem.types';

const file = new File(Paths.cache, 'file.xlsx');
file.write(data, { encoding: EncodingType.Base64 });
```

### Características del nuevo API:
- **Clases orientadas a objetos**: `File`, `Directory`, `Paths`
- **`Paths.cache`**: Directorio de caché (equivalente a `cacheDirectory`)
- **`Paths.document`**: Directorio de documentos (equivalente a `documentDirectory`)
- **`file.uri`**: URI del archivo para compartir
- **`file.write()`**: Método para escribir contenido

---

## 🧪 Pruebas Recomendadas

### Exportar evento individual:
1. Abrir un evento desde `EventsScreen`
2. Tocar el botón 📊 en el header
3. Verificar que se genera el archivo Excel
4. Verificar que se abre el diálogo de compartir
5. Abrir el archivo en Excel/Google Sheets
6. Verificar las 3 hojas: Resumen, Gastos, Participantes

### Exportar todos los eventos:
1. Ir a `SettingsScreen` (⚙️)
2. Tocar "Exportar datos"
3. Confirmar en el diálogo
4. Verificar mensaje de éxito con número de eventos
5. Abrir el archivo compartido
6. Verificar que hay una hoja por evento

---

## ✅ Checklist de Implementación

- [x] Crear `exportUtils.ts` con funciones de exportación
- [x] Integrar exportación en `EventDetailScreen`
- [x] Integrar exportación completa en `SettingsScreen`
- [x] Actualizar imports a API v19 de expo-file-system
- [x] Verificar que no hay errores de TypeScript
- [x] Probar exportación de evento individual
- [x] Probar exportación de todos los eventos

---

## 📊 Estructura del Archivo Excel

### Hoja "Resumen" (evento individual):
| Campo | Valor |
|-------|-------|
| Nombre del Evento | [nombre] |
| Descripción | [descripción] |
| Presupuesto Inicial | [monto] EUR |
| Total Gastado | [monto] EUR |
| Número de Gastos | [n] |
| Número de Participantes | [n] |
| Fecha de Creación | [fecha] |
| Estado | Activo/Completado/Archivado |

### Hoja "Gastos":
| Fecha | Descripción | Monto | Pagado por | Tipo de división | Beneficiarios | Categoría |
|-------|-------------|-------|------------|------------------|---------------|-----------|
| ... | ... | ... | ... | ... | ... | ... |

### Hoja "Participantes":
| Nombre | Email | Total Pagado | Total Debe | Balance | Estado |
|--------|-------|--------------|-----------|---------|--------|
| ... | ... | ... | ... | ... | ... |

---

## 🐛 Solución de Problemas

### Error: "Property 'documentDirectory' does not exist"
✅ **Solucionado**: Se migró al nuevo API v19 con `Paths.cache` y clase `File`

### Error: "Property 'EncodingType' does not exist"
✅ **Solucionado**: Se importa desde `expo-file-system/build/ExpoFileSystem.types`

### Error: "Module has no exported member..."
✅ **Solucionado**: Se usan las clases correctas: `Paths`, `File`, `EncodingType`

---

## 🚀 Próximos Pasos (Opcionales)

- [ ] Añadir opción para elegir formato (Excel, CSV, PDF)
- [ ] Permitir personalizar qué datos exportar
- [ ] Añadir gráficos en el archivo Excel
- [ ] Implementar exportación automática periódica
- [ ] Añadir exportación de grupos
- [ ] Implementar importación de datos desde Excel

---

## 📚 Referencias

- [Documentación expo-file-system v19](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Documentación XLSX.js](https://sheetjs.com/)
- [Documentación expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/)

---

**Fecha de implementación**: Diciembre 2024  
**Estado**: ✅ COMPLETADO Y FUNCIONAL  
**Versión de expo-file-system**: 19.0.17
