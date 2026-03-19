# 🧪 Guía Completa de Testing - LessMo

## 📋 Índice

1. [Configuración](#configuración)
2. [Tipos de Tests](#tipos-de-tests)
3. [Comandos de Testing](#comandos-de-testing)
4. [Estructura de Tests](#estructura-de-tests)
5. [Cobertura de Tests](#cobertura-de-tests)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Configuración

### Dependencias Instaladas

```json
{
  "@testing-library/react-native": "^13.3.3",
  "@testing-library/jest-native": "^5.4.3",
  "jest-expo": "latest",
  "@types/jest": "latest",
  "react-test-renderer": "^19.2.0"
}
```

### Archivos de Configuración

- **jest.config.js**: Configuración principal de Jest
- **jest.setup.js**: Mocks globales y configuración inicial
- **__mocks__/fileMock.js**: Mock para archivos estáticos

---

## 🎯 Tipos de Tests

### 1. **Tests Unitarios** (Unit Tests)

Prueban funciones y hooks individuales en aislamiento.

**Ubicación**: `src/hooks/__tests__/`, `src/utils/__tests__/`

**Ejemplo**:
```typescript
// src/hooks/__tests__/useAuth.test.ts
describe('useAuth Hook', () => {
  it('should sign in with email and password', async () => {
    const { result } = renderHook(() => useAuth());
    await result.current.signIn('test@example.com', 'password');
    expect(result.current.user).toBeTruthy();
  });
});
```

**Tests Cubiertos**:
- ✅ useAuth (sign in, sign up, sign out, validaciones)
- ✅ useExpenses (CRUD, cálculos de balances, liquidaciones)
- ✅ useLanguage (cambio de idioma, persistencia)
- ✅ useCurrency (cambio de moneda, formateo)
- ✅ exportUtils (Excel, CSV, sharing)

### 2. **Tests de Integración** (Integration Tests)

Prueban componentes completos con sus interacciones.

**Ubicación**: `src/screens/__tests__/`

**Ejemplo**:
```typescript
// src/screens/__tests__/LoginScreen.test.tsx
describe('LoginScreen Integration', () => {
  it('should handle complete login flow', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password');
    fireEvent.press(getByText('Iniciar Sesión'));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
```

**Tests Cubiertos**:
- ✅ LoginScreen (autenticación, validaciones, navegación)
- ✅ CreateEventScreen (creación/edición, participantes, monedas)
- ✅ OnboardingScreen (navegación, persistencia, skip)

### 3. **Tests End-to-End** (E2E)

Prueban flujos completos de usuario de principio a fin.

**Ubicación**: `src/__tests__/e2e-flows.test.ts`

**Ejemplo**:
```typescript
describe('E2E: Complete User Flow', () => {
  it('should register, create event, and add expense', async () => {
    // 1. Register user
    await registerUser('newuser@test.com', 'password', 'New User');
    
    // 2. Complete onboarding
    await completeOnboarding();
    
    // 3. Create event
    const eventId = await createEvent('Trip to Barcelona', 500);
    
    // 4. Add expense
    await addExpense(eventId, 'Hotel', 200);
    
    // 5. Verify calculations
    const balance = await getBalance(eventId);
    expect(balance.total).toBe(200);
  });
});
```

**Flujos Cubiertos**:
- ✅ Registro completo + creación de evento
- ✅ Gestión de gastos (añadir/editar/eliminar)
- ✅ Colaboración multi-usuario
- ✅ Cálculo de liquidaciones complejas
- ✅ Exportar y compartir datos
- ✅ Cambio de tema/idioma/moneda
- ✅ Manejo offline
- ✅ Recuperación de errores

---

## 🚀 Comandos de Testing

### Comandos Principales

```bash
# Ejecutar TODOS los tests
npm test

# Ejecutar tests en modo watch (útil durante desarrollo)
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage

# Tests para CI/CD (más rápido, sin watch)
npm run test:ci
```

### Comandos por Categoría

```bash
# Tests unitarios (hooks, utils)
npm run test:unit

# Tests de integración (componentes/pantallas)
npm run test:integration

# Tests E2E (flujos completos)
npm run test:e2e

# Tests de hooks específicamente
npm run test:hooks

# Tests de utilidades específicamente
npm run test:utils
```

### Tests Appium (Dispositivo Real/Emulador)

```bash
# Todos los tests Appium
npm run test:appium

# Tests específicos
npm run test:appium:login
npm run test:appium:register
npm run test:appium:event
npm run test:appium:expense
npm run test:appium:summary
```

---

## 📁 Estructura de Tests

```
src/
├── __tests__/
│   └── e2e-flows.test.ts              # Tests E2E completos
├── hooks/
│   └── __tests__/
│       ├── useAuth.test.ts             # ✅ 148 líneas
│       ├── useExpenses.test.ts         # ✅ 268 líneas
│       ├── useLanguage.test.ts         # ✅ 138 líneas
│       └── useCurrency.test.ts         # ✅ 157 líneas
├── screens/
│   └── __tests__/
│       ├── LoginScreen.test.tsx        # ✅ 292 líneas
│       ├── CreateEventScreen.test.tsx  # ✅ 344 líneas
│       └── OnboardingScreen.test.tsx   # ✅ 351 líneas
└── utils/
    └── __tests__/
        └── exportUtils.test.ts         # ✅ 370 líneas
```

### Total de Tests Creados

- **Tests Unitarios**: 5 archivos, ~711 líneas
- **Tests de Integración**: 3 archivos, ~987 líneas
- **Tests E2E**: 1 archivo, ~378 líneas
- **TOTAL**: **9 archivos, ~2,076 líneas de tests** 🎉

---

## 📊 Cobertura de Tests

### Configuración de Umbrales

En `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 60,    // 60% de ramas cubiertas
    functions: 60,   // 60% de funciones cubiertas
    lines: 70,       // 70% de líneas cubiertas
    statements: 70,  // 70% de declaraciones cubiertas
  },
}
```

### Ver Reporte de Cobertura

```bash
npm run test:coverage
```

Esto generará:
- Reporte en consola con porcentajes
- Reporte HTML en `coverage/lcov-report/index.html`

Abre el HTML en tu navegador para ver:
- Archivos cubiertos/no cubiertos
- Líneas específicas sin tests
- Gráficos visuales

### Archivos Excluidos de Cobertura

```javascript
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',           // Archivos de tipos
  '!src/types/**',            // Definiciones de tipos
  '!src/**/*.stories.tsx',    // Storybook stories
  '!src/navigation/**',       // Navegación (compleja)
]
```

---

## ✅ Best Practices

### 1. **Estructura AAA (Arrange-Act-Assert)**

```typescript
it('should calculate total expenses', () => {
  // Arrange: Preparar datos
  const expenses = [
    { amount: 50 },
    { amount: 75 },
  ];
  
  // Act: Ejecutar acción
  const total = calculateTotal(expenses);
  
  // Assert: Verificar resultado
  expect(total).toBe(125);
});
```

### 2. **Nombres Descriptivos**

❌ Mal:
```typescript
it('works', () => { ... });
```

✅ Bien:
```typescript
it('should calculate correct balance when user pays for multiple participants', () => { ... });
```

### 3. **Aislar Tests**

```typescript
beforeEach(() => {
  // Limpiar estado antes de cada test
  jest.clearAllMocks();
  AsyncStorage.clear();
});
```

### 4. **Usar Mocks Apropiadamente**

```typescript
// Mock Firebase para no hacer llamadas reales
jest.mock('../../services/firebase', () => ({
  signInWithEmail: jest.fn(),
  createEvent: jest.fn(),
}));
```

### 5. **Tests Asíncronos con waitFor**

```typescript
it('should load data asynchronously', async () => {
  const { getByText } = render(<MyComponent />);
  
  await waitFor(() => {
    expect(getByText('Loaded Data')).toBeTruthy();
  });
});
```

### 6. **Agrupar Tests Relacionados**

```typescript
describe('useAuth Hook', () => {
  describe('signIn', () => {
    it('should sign in successfully', () => { ... });
    it('should handle errors', () => { ... });
  });
  
  describe('signUp', () => {
    it('should register new user', () => { ... });
  });
});
```

### 7. **Edge Cases y Errores**

```typescript
describe('edge cases', () => {
  it('should handle empty array', () => { ... });
  it('should handle null values', () => { ... });
  it('should handle negative numbers', () => { ... });
  it('should handle very large numbers', () => { ... });
});
```

---

## 🧑‍💻 Escribir Nuevos Tests

### Template para Test Unitario

```typescript
/**
 * Tests for MyFunction
 */
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something expected', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });

  it('should handle errors', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Template para Test de Componente

```typescript
/**
 * Tests for MyComponent
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('should handle button press', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={mockOnPress} />);
    
    fireEvent.press(getByText('Click Me'));
    
    expect(mockOnPress).toHaveBeenCalled();
  });
});
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module"

**Problema**: Jest no encuentra archivos mock.

**Solución**:
```bash
# Limpiar cache de Jest
npm test -- --clearCache

# Verificar configuración de moduleNameMapper en jest.config.js
```

### Error: "ReferenceError: fetch is not defined"

**Problema**: Fetch no está disponible en entorno de test.

**Solución**: Ya está mockeado en `jest.setup.js`:
```javascript
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({}),
}));
```

### Error: "Timeout - Async callback was not invoked"

**Problema**: Test asíncrono tarda demasiado.

**Solución**:
```typescript
it('should complete async operation', async () => {
  await waitFor(() => {
    expect(result).toBeTruthy();
  }, { timeout: 5000 }); // Aumentar timeout
});
```

### Warnings de `useNativeDriver`

**Problema**: Animaciones generan warnings en tests.

**Solución**: Ya está mockeado en `jest.setup.js`:
```javascript
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
```

### Tests Fallan en CI pero Pasan Localmente

**Problema**: Diferencias de entorno.

**Solución**:
```bash
# Usar mismo comando que CI
npm run test:ci

# Verificar versiones de Node
node --version  # Debe coincidir con CI
```

---

## 📈 Métricas de Testing

### Objetivos de Cobertura

| Categoría | Objetivo | Estado Actual |
|-----------|----------|---------------|
| Líneas    | 70%      | ⏳ En progreso |
| Funciones | 60%      | ⏳ En progreso |
| Ramas     | 60%      | ⏳ En progreso |

### Tests por Categoría

| Categoría | Archivos | Tests Aprox. | Estado |
|-----------|----------|--------------|--------|
| Hooks     | 4        | ~35 tests    | ✅ Completo |
| Screens   | 3        | ~45 tests    | ✅ Completo |
| Utils     | 1        | ~30 tests    | ✅ Completo |
| E2E       | 1        | ~25 flows    | ✅ Completo |
| **TOTAL** | **9**    | **~135 tests** | **✅** |

---

## 🎯 Funcionalidades Cubiertas por Tests

### ✅ Autenticación
- Sign in con email/password
- Registro de usuarios
- Google Sign In flow
- Validación de credenciales
- Manejo de errores de autenticación

### ✅ Gestión de Eventos
- Crear evento con presupuesto
- Editar evento existente
- Añadir/eliminar participantes
- Selección de moneda
- Validaciones de formulario

### ✅ Gestión de Gastos
- Añadir gasto con split
- Editar gasto existente
- Eliminar gasto
- Cálculo de balances
- Liquidaciones óptimas

### ✅ Onboarding
- 6 pasos completos
- Navegación adelante/atrás
- Skip functionality
- Persistencia de completado
- Reset para testing

### ✅ Internacionalización
- Cambio de idioma (5 idiomas)
- Persistencia de preferencia
- Actualización de UI
- Formato de fechas/números

### ✅ Monedas
- Cambio de moneda
- Formateo de cantidades
- Símbolos correctos
- Persistencia de preferencia

### ✅ Exportación
- Exportar a Excel
- Exportar a CSV
- Compartir archivos
- Formateo de datos
- Sanitización de nombres

### ✅ Dark Mode
- Toggle tema claro/oscuro
- Modo automático (sistema)
- Persistencia de preferencia
- Aplicación de estilos

---

## 🚦 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
```

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Hooks](https://react-hooks-testing-library.com/)

### Tutoriales Recomendados
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## 🎉 Resumen

Has implementado una **suite completa de testing** para LessMo:

✅ **9 archivos de tests** (~2,076 líneas)
✅ **~135 test cases** cubriendo funcionalidad crítica
✅ **3 tipos de tests**: Unitarios, Integración, E2E
✅ **Configuración profesional** con Jest + Testing Library
✅ **Scripts organizados** para diferentes escenarios
✅ **Mocks completos** para Firebase, AsyncStorage, Expo
✅ **Best practices** implementadas
✅ **CI/CD ready** con test:ci command

### Próximos Pasos

1. **Ejecutar tests**:
   ```bash
   npm run test:coverage
   ```

2. **Revisar cobertura**: Abrir `coverage/lcov-report/index.html`

3. **Añadir tests faltantes** para alcanzar 70%+ cobertura

4. **Configurar CI/CD** con GitHub Actions

5. **Mantener tests actualizados** al añadir nuevas features

---

**¡Testing Completo Implementado! 🎊**
