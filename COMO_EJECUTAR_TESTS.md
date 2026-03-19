# 🧪 Cómo Ejecutar los Tests - Guía Práctica

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Comandos Básicos](#comandos-básicos)
3. [Comandos por Categoría](#comandos-por-categoría)
4. [Interpretar Resultados](#interpretar-resultados)
5. [Generar Reporte de Cobertura](#generar-reporte-de-cobertura)
6. [Modo Watch para Desarrollo](#modo-watch-para-desarrollo)
7. [Ejecutar Tests Específicos](#ejecutar-tests-específicos)
8. [Solución de Problemas](#solución-de-problemas)

---

## 📦 Requisitos Previos

### ✅ Ya Instalado (No hacer nada)

Todo está configurado. Solo necesitas ejecutar los comandos.

### 🔍 Verificar Instalación

```bash
npm list jest jest-expo @testing-library/react-native
```

Deberías ver:
- `jest@29.x.x`
- `jest-expo@latest`
- `@testing-library/react-native@13.3.3`

---

## 🚀 Comandos Básicos

### 1️⃣ Ejecutar TODOS los tests

```bash
npm test
```

**¿Qué hace?**
- Ejecuta los 135+ tests implementados
- Muestra resultados en consola
- Tiempo estimado: ~30 segundos

**Salida esperada:**
```
PASS src/hooks/__tests__/useAuth.test.ts
PASS src/hooks/__tests__/useExpenses.test.ts
PASS src/hooks/__tests__/useLanguage.test.ts
...
Test Suites: 9 passed, 9 total
Tests:       135 passed, 135 total
Time:        28.456s
```

### 2️⃣ Ver cobertura de código

```bash
npm run test:coverage
```

**¿Qué hace?**
- Ejecuta todos los tests
- Genera reporte de cobertura
- Crea carpeta `coverage/` con HTML interactivo

**Salida esperada:**
```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   72.34 |    65.12 |   68.90 |   73.21 |
 hooks/               |   85.67 |    78.23 |   82.45 |   86.12 |
  useAuth.ts          |   90.12 |    85.34 |   88.90 |   91.23 |
  useExpenses.ts      |   87.45 |    80.12 |   85.67 |   88.34 |
  ...
```

**Ver reporte HTML:**
```bash
open coverage/lcov-report/index.html
```

### 3️⃣ Modo desarrollo (Watch)

```bash
npm run test:watch
```

**¿Qué hace?**
- Ejecuta tests automáticamente cuando guardas cambios
- Ideal para desarrollo
- Se mantiene corriendo hasta que presiones `q`

**Comandos en modo watch:**
- `a` - Ejecutar todos los tests
- `f` - Ejecutar solo tests que fallaron
- `p` - Filtrar por nombre de archivo
- `t` - Filtrar por nombre de test
- `q` - Salir

---

## 📂 Comandos por Categoría

### 🪝 Tests de Hooks (Unit Tests)

```bash
npm run test:hooks
```

**Ejecuta tests de:**
- ✅ `useAuth.test.ts` (12 tests) - Autenticación
- ✅ `useExpenses.test.ts` (20 tests) - Gastos y cálculos
- ✅ `useLanguage.test.ts` (10 tests) - Cambio de idioma
- ✅ `useCurrency.test.ts` (12 tests) - Cambio de moneda

**Ejemplo de output:**
```
PASS src/hooks/__tests__/useAuth.test.ts
  useAuth Hook
    signIn
      ✓ should sign in successfully (125ms)
      ✓ should handle sign in error (89ms)
    ...
Tests: 54 passed, 54 total
```

### 🖼️ Tests de Pantallas (Integration Tests)

```bash
npm run test:integration
```

**Ejecuta tests de:**
- ✅ `LoginScreen.test.tsx` (18 tests) - Login y registro
- ✅ `CreateEventScreen.test.tsx` (22 tests) - Crear eventos
- ✅ `OnboardingScreen.test.tsx` (25 tests) - Tutorial inicial

**Ejemplo de output:**
```
PASS src/screens/__tests__/LoginScreen.test.tsx
  LoginScreen
    UI Rendering
      ✓ renders login form correctly (234ms)
      ✓ renders Google sign-in button (156ms)
    ...
Tests: 65 passed, 65 total
```

### 🔧 Tests de Utilidades

```bash
npm run test:utils
```

**Ejecuta tests de:**
- ✅ `exportUtils.test.ts` (28 tests) - Exportar a Excel/CSV

**Ejemplo de output:**
```
PASS src/utils/__tests__/exportUtils.test.ts
  exportUtils
    exportToExcel
      ✓ should generate Excel file (312ms)
      ✓ should include all expenses (189ms)
    ...
Tests: 28 passed, 28 total
```

### 🔄 Tests End-to-End (E2E)

```bash
npm run test:e2e
```

**Ejecuta tests de:**
- ✅ `e2e-flows.test.ts` (15 flows) - Flujos completos de usuario

**Ejemplo de output:**
```
PASS src/__tests__/e2e-flows.test.ts
  E2E User Flows
    ✓ should complete registration and event creation (567ms)
    ✓ should add, edit, and delete expense (445ms)
    ✓ should calculate settlements correctly (389ms)
    ...
Tests: 15 passed, 15 total
```

### 🔁 Tests para CI/CD

```bash
npm run test:ci
```

**¿Qué hace?**
- Optimizado para integración continua
- Usa máximo 2 workers (menos recursos)
- Genera reporte de cobertura automáticamente

---

## 📊 Interpretar Resultados

### ✅ Test Exitoso

```
✓ should sign in successfully (125ms)
```

- ✅ Verde = Test pasó
- `125ms` = Tiempo de ejecución

### ❌ Test Fallido

```
✕ should handle invalid email (234ms)

  Expected: "Email inválido"
  Received: undefined
```

**Qué hacer:**
1. Lee el mensaje de error
2. Revisa el código del test
3. Verifica la implementación
4. Ejecuta solo ese test: `npm test -- useAuth.test.ts`

### ⚠️ Test con Warning

```
PASS src/hooks/__tests__/useAuth.test.ts
  console.warn
    Warning: Some warning message
```

**Qué hacer:**
- Los warnings no fallan tests
- Revisa si es importante
- Si no, puedes ignorarlo

---

## 📈 Generar Reporte de Cobertura

### 1. Ejecutar con cobertura

```bash
npm run test:coverage
```

### 2. Ver reporte en consola

```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   72.34 |    65.12 |   68.90 |   73.21 |
```

**Significado de columnas:**
- **% Stmts**: Porcentaje de declaraciones ejecutadas
- **% Branch**: Porcentaje de ramas (if/else) ejecutadas
- **% Funcs**: Porcentaje de funciones ejecutadas
- **% Lines**: Porcentaje de líneas ejecutadas

### 3. Ver reporte HTML interactivo

```bash
# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html

# Windows
start coverage/lcov-report/index.html
```

**Features del reporte HTML:**
- 🌳 Vista de árbol de archivos
- 🔍 Ver líneas exactas sin cubrir (en rojo)
- 🎯 Click en archivo para ver detalles
- 📊 Gráficos visuales de cobertura

### 4. Objetivos de Cobertura

**Configurado en `jest.config.js`:**
```javascript
coverageThreshold: {
  global: {
    branches: 60%,
    functions: 60%,
    lines: 70%,
    statements: 70%
  }
}
```

**Si no se cumple:**
```
Jest: "global" coverage threshold for branches (60%) not met: 55.2%
```

---

## 🔄 Modo Watch para Desarrollo

### Iniciar modo watch

```bash
npm run test:watch
```

### Flujo de trabajo recomendado

1. **Inicia watch:**
   ```bash
   npm run test:watch
   ```

2. **Edita código** - Los tests se ejecutan automáticamente

3. **Usa comandos interactivos:**
   - Presiona `p` → Escribe nombre de archivo → Enter
   - Presiona `t` → Escribe nombre de test → Enter
   - Presiona `a` → Ejecutar todos

4. **Ejemplo práctico:**
   ```
   Watch Usage
    › Press a to run all tests.
    › Press f to run only failed tests.
    › Press p to filter by a filename regex pattern.
    › Press t to filter by a test name regex pattern.
    › Press q to quit watch mode.
    › Press Enter to trigger a test run.
   ```

5. **Filtrar por archivo:**
   ```
   Pattern Mode Usage
    › Press Esc to exit pattern mode.
    › Press Enter to filter by a filenames regex.

   pattern › useAuth

   Pattern matches 1 file
    src/hooks/__tests__/useAuth.test.ts
   ```

---

## 🎯 Ejecutar Tests Específicos

### Por archivo

```bash
# Un archivo específico
npm test -- useAuth.test.ts

# Todos los tests de hooks
npm test -- hooks/

# Todos los tests de screens
npm test -- screens/
```

### Por nombre de test

```bash
# Tests que contengan "sign in"
npm test -- -t "sign in"

# Tests que contengan "expense"
npm test -- -t "expense"

# Tests que contengan "language" O "currency"
npm test -- -t "language|currency"
```

### Ejemplos prácticos

```bash
# Solo tests de autenticación
npm test -- useAuth

# Solo tests de formulario de login
npm test -- LoginScreen -t "form"

# Solo tests E2E de settlements
npm test -- e2e-flows -t "settlement"

# Ver output detallado
npm test -- --verbose

# Ejecutar sin cache
npm test -- --no-cache
```

---

## 🐛 Solución de Problemas

### Problema 1: Tests no se encuentran

**Error:**
```
No tests found related to files changed since last commit.
```

**Solución:**
```bash
npm test -- --watchAll=false
# O simplemente:
npm test
```

### Problema 2: Tests fallan por timeout

**Error:**
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Solución:**
Aumentar timeout en el test:
```typescript
it('should do something', async () => {
  // código
}, 10000); // 10 segundos
```

### Problema 3: Mocks no funcionan

**Error:**
```
TypeError: Cannot read property 'someMethod' of undefined
```

**Solución:**
1. Verifica que `jest.setup.js` esté correctamente configurado
2. Revisa que el mock esté definido ANTES del import:
   ```typescript
   jest.mock('../services/firebase');
   import { myFunction } from '../services/firebase';
   ```

### Problema 4: Snapshot test falla

**Error:**
```
Snapshot Summary
 › 1 snapshot failed.
```

**Solución:**
```bash
# Actualizar snapshots
npm test -- -u

# Ver diferencias
npm test -- --verbose
```

### Problema 5: Cache corruptas

**Error:**
```
SyntaxError: Unexpected token
```

**Solución:**
```bash
# Limpiar cache de Jest
npm test -- --clearCache

# Reinstalar node_modules
rm -rf node_modules
npm install --legacy-peer-deps
```

### Problema 6: Tests pasan localmente pero fallan en CI

**Posibles causas:**
1. **Variables de entorno:** Verifica `.env` en CI
2. **Timezone:** Tests dependen de fechas
3. **Recursos:** CI tiene menos memoria

**Solución:**
```bash
# Simular entorno CI localmente
npm run test:ci
```

---

## 📝 Comandos de Referencia Rápida

```bash
# EJECUCIÓN BÁSICA
npm test                    # Todos los tests
npm run test:watch          # Modo watch
npm run test:coverage       # Con cobertura

# POR CATEGORÍA
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e            # End-to-end tests
npm run test:hooks          # Solo hooks
npm run test:utils          # Solo utils

# FILTROS
npm test -- useAuth         # Por archivo
npm test -- -t "sign in"    # Por nombre
npm test -- --verbose       # Output detallado

# UTILIDADES
npm test -- --clearCache    # Limpiar cache
npm test -- --no-cache      # Sin cache
npm test -- -u              # Actualizar snapshots
npm run test:ci             # Modo CI/CD

# REPORTE
open coverage/lcov-report/index.html  # Ver HTML
```

---

## 🎓 Tips y Best Practices

### ✅ Antes de Hacer Commit

```bash
# Ejecutar tests relevantes
npm run test:coverage

# Verificar que no haya tests fallidos
# Verificar que la cobertura sea >70%
```

### ✅ Durante Desarrollo

```bash
# Usa modo watch
npm run test:watch

# Ejecuta solo los tests relacionados con tu cambio
npm test -- myFile.test.ts
```

### ✅ Antes de Merge/Pull Request

```bash
# Ejecutar suite completa con cobertura
npm run test:ci

# Verificar que todos pasen
# Verificar que la cobertura no baje
```

### ✅ Debugging Tests

```typescript
// Agregar console.log en tests
it('should work', () => {
  console.log('Debug:', someValue);
  expect(someValue).toBe(expected);
});

// Ver output completo
npm test -- --verbose
```

---

## 🎯 Ejercicios Prácticos

### Ejercicio 1: Primer Test

```bash
# 1. Ejecutar todos los tests
npm test

# 2. Ver resultados
# 3. Ejecutar solo tests de useAuth
npm test -- useAuth

# 4. Ver cobertura
npm run test:coverage
open coverage/lcov-report/index.html
```

### Ejercicio 2: Modo Watch

```bash
# 1. Iniciar modo watch
npm run test:watch

# 2. Presiona 'p' y escribe 'useAuth'
# 3. Edita src/hooks/useAuth.ts (agrega un espacio)
# 4. Guarda y observa cómo se ejecutan automáticamente
# 5. Presiona 'a' para ejecutar todos
# 6. Presiona 'q' para salir
```

### Ejercicio 3: Filtrar Tests

```bash
# 1. Ejecutar tests que contengan "sign in"
npm test -- -t "sign in"

# 2. Ejecutar tests de LoginScreen
npm test -- LoginScreen

# 3. Ejecutar tests E2E
npm run test:e2e
```

---

## 📚 Recursos Adicionales

### Documentación Oficial

- **Jest:** https://jestjs.io/docs/getting-started
- **React Testing Library:** https://testing-library.com/docs/react-testing-library/intro/
- **Testing Library React Native:** https://callstack.github.io/react-native-testing-library/

### Guías Internas

- **GUIA_TESTING_COMPLETA.md** - Guía exhaustiva de 500+ líneas
- **RESUMEN_TESTING_IMPLEMENTADO.md** - Resumen de la implementación
- `src/**/__tests__/` - Ejemplos de tests

### Cheat Sheets

**Matchers comunes:**
```typescript
expect(value).toBe(expected);           // ===
expect(value).toEqual(expected);        // deep equal
expect(value).toBeTruthy();             // if(value)
expect(value).toBeFalsy();              // if(!value)
expect(value).toBeNull();               // === null
expect(value).toBeUndefined();          // === undefined
expect(array).toContain(item);          // array includes
expect(string).toMatch(/regex/);        // regex match
expect(fn).toHaveBeenCalled();          // mock called
expect(fn).toHaveBeenCalledWith(arg);   // mock called with arg
```

**Async tests:**
```typescript
// Con async/await
it('should work', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});

// Con waitFor
import { waitFor } from '@testing-library/react-native';

it('should wait', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeTruthy();
  });
});
```

---

## 🎉 ¡Listo para Probar!

Ya tienes todo configurado. Empieza con:

```bash
npm test
```

Si tienes dudas, consulta:
1. Esta guía
2. `GUIA_TESTING_COMPLETA.md`
3. Ejemplos en `src/**/__tests__/`

**¡Happy Testing! 🧪✨**
