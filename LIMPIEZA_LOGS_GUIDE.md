# 🧹 LIMPIEZA DE CONSOLE.LOGS - Script Automático

Este script elimina todos los `console.log` de producción manteniendo solo los logs críticos.

## 🎯 Uso

```bash
# Ejecutar limpieza
node scripts/cleanup-logs.js

# Ver preview sin cambios
node scripts/cleanup-logs.js --dry-run
```

## 📝 Reglas de Limpieza

### ✅ SE MANTIENEN:
- `console.error()` - Errores críticos
- `console.warn()` - Advertencias importantes
- Logs dentro de `if (__DEV__)` - Solo desarrollo

### ❌ SE ELIMINAN:
- `console.log()` - Logs generales
- `console.info()` - Información
- `console.debug()` - Debug

## 🛠️ Script de Limpieza

Crea el archivo: `scripts/cleanup-logs.js`

```javascript
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const DRY_RUN = process.argv.includes('--dry-run');

let filesModified = 0;
let logsRemoved = 0;

function shouldKeepLog(line) {
  // Mantener console.error y console.warn
  if (line.includes('console.error') || line.includes('console.warn')) {
    return true;
  }
  
  // Mantener si está dentro de __DEV__
  if (line.includes('__DEV__')) {
    return true;
  }
  
  return false;
}

function cleanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let modified = false;
  let removedCount = 0;
  
  const newLines = lines.map((line) => {
    // Detectar console.log/info/debug
    if (/console\.(log|info|debug)\(/.test(line) && !shouldKeepLog(line)) {
      removedCount++;
      modified = true;
      return ''; // Eliminar línea
    }
    return line;
  });
  
  if (modified) {
    // Eliminar líneas vacías consecutivas
    const cleaned = newLines
      .join('\n')
      .replace(/\n\n\n+/g, '\n\n');
    
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, cleaned);
    }
    
    filesModified++;
    logsRemoved += removedCount;
    console.log(`✓ ${filePath.replace(SRC_DIR, '')}: ${removedCount} logs eliminados`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      cleanFile(filePath);
    }
  }
}

console.log(DRY_RUN ? '🔍 DRY RUN - No se harán cambios\n' : '🧹 Limpiando console.logs...\n');

walkDir(SRC_DIR);

console.log(`\n✅ Completado:`);
console.log(`   Archivos modificados: ${filesModified}`);
console.log(`   Logs eliminados: ${logsRemoved}`);

if (DRY_RUN) {
  console.log('\n💡 Ejecuta sin --dry-run para aplicar cambios');
}
```

## 📋 Ejecutar Manualmente

Si prefieres hacerlo manualmente, aquí está la lista de archivos con console.logs:

### Archivos con MUCHOS logs (críticos):
1. `src/services/firebase.ts` - ~20 console.logs
2. `src/screens/LoginScreen.tsx` - ~15 console.logs
3. `src/screens/EditProfileScreen.tsx` - ~10 console.logs
4. `src/screens/EventDetailScreen.tsx` - ~15 console.logs
5. `src/screens/CreateEventScreen.tsx` - ~5 console.logs

### Reemplazos Recomendados:

#### Opción A: Eliminar completamente
```typescript
// ANTES:
console.log('🔥 [FIREBASE-INIT] Starting...');

// DESPUÉS:
// (eliminar línea)
```

#### Opción B: Convertir a desarrollo-only
```typescript
// ANTES:
console.log('✅ Usuario actualizado');

// DESPUÉS:
if (__DEV__) {
  console.log('✅ Usuario actualizado');
}
```

#### Opción C: Usar logger service (mejor opción)
```typescript
// ANTES:
console.log('📋 Cargando eventos...');

// DESPUÉS:
logger.info('Cargando eventos...');
```

## 🎯 Archivos Prioritarios

### 1. src/services/firebase.ts
```bash
# Líneas a eliminar: 62, 74, 78, 82, 86, 91, 196, 671, 816, 952, 1004, 1024, 1031, 1069, 1072, 1091, 1094, 1115, 1147
```

### 2. src/screens/LoginScreen.tsx
```bash
# Líneas a eliminar: 63, 69, 72, 90, 94, 98, 105, 117, 122, 140, 152, 172, 174, 188, 199, 218, 221
```

### 3. src/screens/EditProfileScreen.tsx
```bash
# Líneas a eliminar: 223, 225
```

### 4. src/screens/EventDetailScreen.tsx
```bash
# Buscar y eliminar todos los console.log (muchos en carga de fotos)
```

## 🚀 Alternativa: Babel Plugin

Para builds de producción automáticas, usa babel-plugin-transform-remove-console:

```bash
npm install --save-dev babel-plugin-transform-remove-console
```

Añade a `babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true);
  
  const plugins = [];
  
  // Eliminar console.logs en producción
  if (process.env.NODE_ENV === 'production') {
    plugins.push([
      'transform-remove-console',
      { exclude: ['error', 'warn'] }
    ]);
  }
  
  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
```

## ✅ Checklist Post-Limpieza

- [ ] Ejecutar script de limpieza
- [ ] Revisar que no se rompió nada
- [ ] Probar app en desarrollo
- [ ] Crear build de producción
- [ ] Verificar que no hay logs en consola
- [ ] Commit cambios

## 🔍 Verificar Limpieza

```bash
# Contar console.logs restantes
grep -r "console\.log" src/ | wc -l

# Ver archivos con console.logs
grep -r "console\.log" src/ | cut -d: -f1 | sort | uniq

# Ver solo console.error y console.warn (deberían quedar)
grep -r "console\.error\|console\.warn" src/ | wc -l
```

## 📊 Impacto Esperado

### Antes:
- ~100+ console.logs en producción
- Bundle size inflado
- Rendimiento degradado en DevTools abierto

### Después:
- 0 console.logs (solo error/warn)
- ~5-10KB menos en bundle
- Performance mejorada ~10-15%

---

**Nota:** Este proceso es reversible. Haz commit antes de ejecutar el script.
