#!/usr/bin/env node

/**
 * Script para eliminar console.logs de producción
 * Uso: node scripts/cleanup-logs.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

// Directorios a procesar
const DIRECTORIES = ['src'];

// Patrones a eliminar
const LOG_PATTERNS = [
  /console\.log\([^)]*\);?\n?/g,
  /console\.info\([^)]*\);?\n?/g,
  /console\.debug\([^)]*\);?\n?/g,
];

// Patrones a CONSERVAR (no eliminar)
const KEEP_PATTERNS = [
  /console\.error/,
  /console\.warn/,
  /if\s*\(__DEV__\).*console\./,
  /__DEV__\s*&&.*console\./,
];

let filesProcessed = 0;
let logsRemoved = 0;

function shouldKeepLog(line) {
  return KEEP_PATTERNS.some(pattern => pattern.test(line));
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let fileLogsRemoved = 0;

  // Procesar línea por línea para verificar qué conservar
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    // Si la línea debe conservarse, devolverla sin cambios
    if (shouldKeepLog(line)) {
      return line;
    }

    // Intentar eliminar logs
    let processedLine = line;
    for (const pattern of LOG_PATTERNS) {
      const matches = processedLine.match(pattern);
      if (matches) {
        fileLogsRemoved += matches.length;
        processedLine = processedLine.replace(pattern, '');
      }
    }

    return processedLine;
  });

  newContent = processedLines.join('\n');

  // Limpiar líneas vacías múltiples
  newContent = newContent.replace(/\n{3,}/g, '\n\n');

  if (fileLogsRemoved > 0) {
    console.log(`  ${filePath}: ${fileLogsRemoved} logs`);
    logsRemoved += fileLogsRemoved;
    
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
    
    filesProcessed++;
  }

  return fileLogsRemoved;
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorar node_modules y otros directorios
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      processFile(filePath);
    }
  });
}

console.log(DRY_RUN ? '🔍 Modo DRY-RUN (no se harán cambios)\n' : '🧹 Limpiando console.logs...\n');

DIRECTORIES.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`Procesando ${dir}/...`);
    walkDirectory(dirPath);
  }
});

console.log(`\n✓ Completado:`);
console.log(`  - Archivos procesados: ${filesProcessed}`);
console.log(`  - Logs eliminados: ${logsRemoved}`);

if (DRY_RUN) {
  console.log('\n⚠️  Ejecuta sin --dry-run para aplicar los cambios');
}
