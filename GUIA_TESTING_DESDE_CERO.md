# Guía Completa de Testing — LessMo

## ¿Qué es el testing y por qué hacerlo?

El testing consiste en verificar que cada parte de tu app funciona correctamente. Hay varios niveles:

| Nivel | Qué prueba | Velocidad | Herramienta |
|-------|-----------|-----------|-------------|
| **Unit Tests** | Una función individual aislada | Milisegundos | Jest |
| **Integration Tests** | Varias funciones trabajando juntas | Segundos | Jest + Testing Library |
| **E2E Tests** | La app completa como la usaría un usuario real | Minutos | Appium (o Detox) |
| **Manual Testing** | Tú tocando la app y verificando | Variable | iPhone/Simulador |

---

## 1. Tests Unitarios con Jest (Lo más básico)

### ¿Qué es Jest?
Jest es un framework de testing de JavaScript. Ya está configurado en el proyecto.

### ¿Cómo funciona?
1. Escribes un archivo con extensión `.test.ts` o `.test.tsx`
2. Dentro describes qué esperas que pase
3. Jest ejecuta el código y verifica que el resultado sea el esperado

### Ejemplo simple:
```typescript
// Archivo: src/utils/__tests__/numberUtils.test.ts

import { formatCurrency } from '../numberUtils';

describe('formatCurrency', () => {
  test('formatea euros correctamente', () => {
    const result = formatCurrency(42.5, 'EUR');
    expect(result).toContain('42');
  });

  test('maneja valores negativos', () => {
    const result = formatCurrency(-10, 'USD');
    expect(result).toContain('-');
  });

  test('maneja cero', () => {
    const result = formatCurrency(0, 'EUR');
    expect(result).toContain('0');
  });
});
```

### Ejecutar tests:
```bash
# Ejecutar TODOS los tests
npm test

# Ejecutar tests de un archivo específico
npx jest src/utils/__tests__/numberUtils.test.ts

# Ejecutar tests y ver cuáles pasan/fallan en detalle
npm test -- --verbose

# Ejecutar tests en modo "watch" (se re-ejecutan al guardar cambios)
npm run test:watch

# Ejecutar tests con reporte de cobertura (qué % del código está testeado)
npm run test:coverage
```

### Tests que ya existen en el proyecto:

| Archivo | Qué prueba |
|---------|-----------|
| `src/__tests__/balanceCalculations.integration.test.ts` | Cálculos de balance entre participantes |
| `src/services/__tests__/firebase.test.ts` | Funciones de Firebase (auth, CRUD) |
| `src/services/__tests__/paymentConfirmationService.test.ts` | Servicio de confirmación de pagos |
| `src/hooks/__tests__/useAuth.test.ts` | Hook de autenticación |
| `src/hooks/__tests__/useCurrency.test.ts` | Hook de moneda |
| `src/hooks/__tests__/useExpenses.test.ts` | Hook de gastos |
| `src/hooks/__tests__/useLanguage.test.ts` | Hook de idioma |

### Comandos por categoría:
```bash
npm run test:hooks     # Solo hooks
npm run test:unit      # Solo tests unitarios
npm run test:ci        # Para CI/CD (con cobertura, 2 workers)
```

---

## 2. Tests de Integración

Verifican que varios módulos funcionan correctamente juntos.

```bash
npm run test:integration
```

---

## 3. Tests E2E con Appium (Tests de la app real)

### ¿Qué es Appium?
Appium es como un "robot" que toca tu app automáticamente. Abre la app, pulsa botones, escribe texto, y verifica que los resultados sean correctos.

### Instalación (primera vez):
```bash
# Instalar Appium globalmente
npm install -g appium

# Instalar el driver de iOS
appium driver install xcuitest

# Verificar que está instalado
appium driver list
```

### Tests E2E disponibles:

| Test | Qué prueba |
|------|-----------|
| `tests/appium/login.test.js` | Flujo completo de login |
| `tests/appium/register.test.js` | Flujo de registro de cuenta |
| `tests/appium/createEvent.test.js` | Crear un evento nuevo |
| `tests/appium/addExpense.test.js` | Añadir un gasto a un evento |
| `tests/appium/summary.test.js` | Ver resumen y balances |

### Ejecutar tests E2E:
```bash
# Primero: tener la app corriendo en simulador
npx expo run:ios

# En otra terminal, ejecutar Appium server
appium

# En otra terminal, ejecutar los tests
npm run test:appium              # Todos los tests E2E
npm run test:appium:login        # Solo login
npm run test:appium:register     # Solo registro
npm run test:appium:event        # Solo crear evento
npm run test:appium:expense      # Solo añadir gasto
npm run test:appium:summary      # Solo resumen
```

---

## 4. Verificación de TypeScript

No es un "test" como tal, pero verifica que no hay errores de tipos en toda la app:

```bash
npx tsc --noEmit
```

Si no imprime nada = 0 errores. Si hay errores, muestra exactamente el archivo y línea.

---

## 5. Testing Manual — Checklist Completo

Esta es la forma más directa de probar la app. Abre la app (en simulador o iPhone) y sigue esta lista:

### 5.1 Autenticación
- [ ] Abrir app → aparece pantalla de Login
- [ ] Registrar cuenta nueva con email/contraseña
- [ ] Cerrar sesión
- [ ] Iniciar sesión con la cuenta creada
- [ ] Probar "Olvidé mi contraseña" → verificar que llega email
- [ ] Probar Google Sign-In (si está configurado)

### 5.2 Onboarding
- [ ] Primera vez que entras → aparece tutorial de 6 pasos
- [ ] Navegar por los 6 pasos
- [ ] Completar onboarding → ya no aparece más

### 5.3 Pestaña "Gastos" (IndividualExpensesScreen)
- [ ] Ver lista de gastos personales
- [ ] Pull-to-refresh funciona
- [ ] Toggle gasto/ingreso funciona (si implementado)
- [ ] Header con gradiente se ve bien

### 5.4 Pestaña "Eventos" (GroupsScreen)
- [ ] Ver lista de eventos
- [ ] Buscar eventos por nombre
- [ ] Crear nuevo evento
- [ ] Pull-to-refresh
- [ ] Swipe para eliminar un evento
- [ ] Selección múltiple funciona

### 5.5 Crear Evento
- [ ] Poner título, descripción
- [ ] Seleccionar moneda
- [ ] Definir presupuesto
- [ ] Añadir participantes
- [ ] Guardar → aparece en la lista

### 5.6 Detalle de Evento (EventDetailScreen)
- [ ] Ver info del evento
- [ ] Ver lista de gastos
- [ ] Ver participantes y balances
- [ ] Ver liquidaciones (quién debe a quién)
- [ ] Compartir código de invitación
- [ ] Acceder al chat

### 5.7 Añadir Gasto (AddExpenseScreen)
- [ ] Poner concepto y cantidad
- [ ] Seleccionar categoría (7 de gasto + 7 de ingreso)
- [ ] Seleccionar quién pagó
- [ ] Seleccionar tipo de división (equitativa, porcentaje, custom, por monto, por items)
- [ ] Tomar foto del recibo
- [ ] OCR extrae datos del recibo
- [ ] Guardar gasto → aparece en la lista del evento

### 5.8 División por Items (ItemSplitScreen)
- [ ] Asignar items individuales a participantes
- [ ] Los totales se calculan correctamente
- [ ] Guardar y volver al evento

### 5.9 Resumen (SummaryScreen)
- [ ] Ver gráficas de gastos
- [ ] Ver liquidaciones optimizadas
- [ ] Exportar a PDF
- [ ] Compartir resumen

### 5.10 Chat (ChatScreen)
- [ ] Enviar mensaje de texto
- [ ] Enviar imagen
- [ ] Los mensajes aparecen en tiempo real

### 5.11 Pagos
- [ ] Marcar un pago como completado
- [ ] Ver historial de pagos
- [ ] Generar QR de pago
- [ ] Seleccionar método de pago (Bizum, PayPal, etc.)

### 5.12 Estadísticas y Análisis
- [ ] Ver estadísticas de un evento
- [ ] Ver analytics avanzados
- [ ] Ver achievements/logros

### 5.13 Unirse a Evento
- [ ] Usar código de invitación
- [ ] Escanear QR de invitación
- [ ] Apareces como participante del evento

### 5.14 Settings
- [ ] Cambiar modo oscuro/claro
- [ ] Cambiar idioma (ES, EN, FR, DE, PT)
- [ ] Cambiar moneda predeterminada
- [ ] Activar/desactivar biometría (Face ID)
- [ ] Activar/desactivar recordatorios
- [ ] Editar perfil (nombre, foto)
- [ ] Cerrar sesión

### 5.15 Modo Oscuro
- [ ] Activar modo oscuro
- [ ] Todas las pantallas se ven correctamente
- [ ] Los textos son legibles
- [ ] Los gradientes se adaptan

### 5.16 Internacionalización
- [ ] Cambiar a inglés → todos los textos cambian
- [ ] Cambiar a francés → todos los textos cambian
- [ ] Volver a español → todo correcto

### 5.17 Funciones iOS Nativas (solo en build nativo, no Expo Go)
- [ ] Haptic feedback al cambiar de pestaña
- [ ] Face ID / Touch ID funciona
- [ ] Deep links `lessmo://` funcionan

---

## 6. Cómo Crear Tus Propios Tests

### Test unitario de una función:
```typescript
// Crear archivo: src/utils/__tests__/miTest.test.ts

describe('Mi función', () => {
  test('hace lo que espero', () => {
    const resultado = miFuncion(entrada);
    expect(resultado).toBe(valorEsperado);
  });
});
```

### Test de un componente React:
```typescript
// Crear archivo: src/screens/__tests__/MiScreen.test.tsx

import { render, fireEvent } from '@testing-library/react-native';
import { MiScreen } from '../MiScreen';

describe('MiScreen', () => {
  test('muestra el título', () => {
    const { getByText } = render(<MiScreen />);
    expect(getByText('Mi Título')).toBeTruthy();
  });

  test('botón ejecuta acción', () => {
    const { getByText } = render(<MiScreen />);
    fireEvent.press(getByText('Guardar'));
    // Verificar resultado
  });
});
```

### Ejecutar tu test:
```bash
npx jest src/utils/__tests__/miTest.test.ts --verbose
```

---

## 7. Reporte de Cobertura

```bash
npm run test:coverage
```

Esto genera un reporte en `coverage/` que muestra:
- Qué porcentaje del código está cubierto por tests
- Qué líneas específicas NO tienen tests
- Abre `coverage/lcov-report/index.html` en el navegador para ver el reporte visual

---

## 8. Resumen de Comandos

| Qué quiero hacer | Comando |
|-------------------|---------|
| Ejecutar todos los tests | `npm test` |
| Tests con detalle | `npm test -- --verbose` |
| Tests de un archivo | `npx jest ruta/al/archivo.test.ts` |
| Tests en modo watch | `npm run test:watch` |
| Cobertura de código | `npm run test:coverage` |
| Solo hooks | `npm run test:hooks` |
| Solo unitarios | `npm run test:unit` |
| Tests E2E (Appium) | `npm run test:appium` |
| Verificar TypeScript | `npx tsc --noEmit` |
| Verificar dependencias | `npx expo install --check` |
| Diagnóstico completo | `npx expo-doctor` |
