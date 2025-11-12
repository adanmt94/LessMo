# 🏗️ Arquitectura de LessMo - Documentación Técnica

## 📐 Arquitectura General

```
┌─────────────────────────────────────────────┐
│              APP.TSX (Root)                 │
│          AuthProvider (Context)             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   Navigation    │
         │  (Stack Nav)    │
         └────────┬────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
    ┌───▼────┐         ┌────▼────┐
    │  Auth  │         │  Main   │
    │ Screens│         │ Screens │
    └────────┘         └─────────┘
    Login              Home
    Register           CreateEvent
                       EventDetail
                       AddExpense
                       Summary
```

## 🗂️ Estructura de Carpetas Detallada

```
LessMo/
│
├── src/
│   │
│   ├── components/
│   │   ├── lovable/              # Componentes UI reutilizables
│   │   │   ├── Button.tsx        # Botón con variantes (primary, secondary, outline, danger)
│   │   │   ├── Input.tsx         # Input con label, error, icon
│   │   │   ├── Card.tsx          # Contenedor con estilos (default, elevated, outlined)
│   │   │   ├── ExpenseItem.tsx   # Item de lista de gastos
│   │   │   ├── ParticipantItem.tsx # Item de participante con barra de progreso
│   │   │   └── index.ts          # Exportación centralizada
│   │   │
│   │   └── v0/                   # (Reservado para componentes de V0.dev)
│   │
│   ├── context/
│   │   └── AuthContext.tsx       # Context API para estado de autenticación
│   │
│   ├── hooks/
│   │   ├── useAuth.ts            # Hook para autenticación (register, signIn, signOut)
│   │   └── useExpenses.ts        # Hook para gastos (CRUD, cálculos, liquidaciones)
│   │
│   ├── navigation/
│   │   └── index.tsx             # Configuración de React Navigation (Auth/Main stacks)
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx       # Pantalla de login
│   │   ├── RegisterScreen.tsx    # Pantalla de registro
│   │   ├── HomeScreen.tsx        # Lista de eventos
│   │   ├── CreateEventScreen.tsx # Crear evento con participantes
│   │   ├── EventDetailScreen.tsx # Detalle con tabs (gastos/participantes/resumen)
│   │   ├── AddExpenseScreen.tsx  # Formulario para agregar gastos
│   │   ├── SummaryScreen.tsx     # Resumen con gráficos y liquidaciones
│   │   └── index.ts              # Exportación centralizada
│   │
│   ├── services/
│   │   └── firebase.ts           # Cliente Firebase + funciones CRUD
│   │
│   └── types/
│       └── index.ts              # Tipos TypeScript globales
│
├── App.tsx                       # Punto de entrada principal
├── package.json                  # Dependencias
├── tsconfig.json                 # Configuración TypeScript
├── README.md                     # Documentación general
├── FIREBASE_SETUP.md             # Guía de configuración Firebase
└── QUICK_START.md                # Guía de inicio rápido
```

## 🔄 Flujo de Datos

### 1. Autenticación
```
Usuario → LoginScreen → useAuth → Firebase Auth → AuthContext → Navigation
```

### 2. Crear Evento
```
Usuario → CreateEventScreen → firebase.createEvent() → Firestore (events)
                            → firebase.addParticipant() → Firestore (participants)
```

### 3. Agregar Gasto
```
Usuario → AddExpenseScreen → useExpenses.addExpense() → firebase.createExpense()
                                                       → Actualiza balances participantes
                                                       → Firestore (expenses)
```

### 4. Ver Resumen
```
SummaryScreen → useExpenses → Calcula:
                               - Total de gastos
                               - Saldo restante
                               - Gastos por categoría
                               - Balances de participantes
                               - Liquidaciones sugeridas
```

## 🔥 Estructura de Firestore

### Collections:

#### 1. **users**
```typescript
{
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}
```

#### 2. **events**
```typescript
{
  id: string;
  name: string;
  description?: string;
  createdBy: string;          // userId
  createdAt: Date;
  initialBudget: number;
  currency: Currency;
  participantIds: string[];
  isActive: boolean;
}
```

#### 3. **participants**
```typescript
{
  id: string;
  eventId: string;
  userId?: string;
  name: string;
  email?: string;
  individualBudget: number;
  currentBalance: number;      // Se actualiza con cada gasto
  joinedAt: Date;
}
```

#### 4. **expenses**
```typescript
{
  id: string;
  eventId: string;
  paidBy: string;              // participantId
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: Date;
  beneficiaries: string[];     // participantIds
  splitType: 'equal' | 'custom';
  customSplits?: { [participantId: string]: number };
  createdAt: Date;
  updatedAt?: Date;
}
```

## 🧮 Algoritmos Principales

### 1. Cálculo de Saldo Restante
```typescript
saldoRestante = presupuestoTotal - totalGastado
```

### 2. División de Gastos (Equitativa)
```typescript
montoPorPersona = montoTotal / numBeneficiarios

// Para cada beneficiario:
nuevoBalance = balanceActual - montoPorPersona
```

### 3. Cálculo de Liquidaciones (Algoritmo Greedy)
```typescript
// 1. Calcular balance de cada participante
balance = totalPagado - totalDebido

// 2. Separar deudores (balance < 0) y acreedores (balance > 0)
deudores = participantes.filter(p => p.balance < 0)
acreedores = participantes.filter(p => p.balance > 0)

// 3. Emparejar deudores con acreedores
while (hayDeudores && hayAcreedores) {
  montoLiquidacion = min(|deuda|, credito)
  agregarLiquidacion(deudor → acreedor, montoLiquidacion)
}
```

### 4. Porcentaje de Gasto por Categoría
```typescript
porcentaje = (gastoCategoria / gastoTotal) * 100
```

## 🎨 Sistema de Diseño

### Colores
```typescript
const colors = {
  primary: '#6366F1',      // Índigo
  secondary: '#10B981',    // Verde
  danger: '#EF4444',       // Rojo
  warning: '#F59E0B',      // Naranja
  background: '#F9FAFB',   // Gris claro
  white: '#FFFFFF',
  gray: {
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#374151',
    700: '#111827',
  }
};
```

### Categorías con Colores
```typescript
const CategoryColors = {
  food: '#EF4444',         // Rojo
  transport: '#3B82F6',    // Azul
  accommodation: '#8B5CF6', // Púrpura
  entertainment: '#EC4899', // Rosa
  shopping: '#F59E0B',     // Naranja
  health: '#10B981',       // Verde
  other: '#6B7280',        // Gris
};
```

### Tipografía
```typescript
const typography = {
  h1: { fontSize: 32, fontWeight: '700' },
  h2: { fontSize: 28, fontWeight: '700' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  small: { fontSize: 14, fontWeight: '400' },
  tiny: { fontSize: 12, fontWeight: '400' },
};
```

## 🔐 Seguridad

### Reglas de Firestore
```javascript
// Los usuarios solo pueden:
// - Leer/escribir sus propios datos
// - Leer eventos
// - Crear eventos
// - Modificar/eliminar sus propios eventos
// - Leer/escribir participantes y gastos si están autenticados
```

### Validaciones
```typescript
// En el frontend:
- Email válido (regex)
- Password mínimo 6 caracteres
- Montos entre MIN_AMOUNT y MAX_AMOUNT
- Máximo MAX_PARTICIPANTS participantes
- Longitud máxima de strings

// Recomendado agregar en el backend (Cloud Functions):
- Validación de permisos
- Sanitización de inputs
- Límites de tasa (rate limiting)
```

## 📦 Dependencias Principales

```json
{
  "firebase": "^10.x",                    // Backend
  "@react-navigation/native": "^6.x",     // Navegación
  "@react-navigation/stack": "^6.x",      // Stack navigation
  "react-native-chart-kit": "^6.x",       // Gráficos
  "react-native-svg": "^13.x",            // SVG para gráficos
  "typescript": "^5.x",                   // TypeScript
  "@types/react": "^18.x",                // Tipos React
  "@types/react-native": "^0.x"           // Tipos React Native
}
```

## 🚀 Performance

### Optimizaciones implementadas:
- ✅ Uso de `useCallback` para evitar re-renders innecesarios
- ✅ `useMemo` para cálculos costosos (liquidaciones)
- ✅ Lazy loading de datos (solo cargar cuando se necesita)
- ✅ Firestore queries optimizadas (índices, límites)
- ✅ Componentes memoizados con React.memo

### Mejoras futuras:
- [ ] Paginación en listas largas
- [ ] Cache local con AsyncStorage
- [ ] Optimistic updates
- [ ] Imágenes lazy loading

## 🧪 Testing (Sugerido)

```typescript
// Unit Tests (Jest)
- Funciones de cálculo (balances, liquidaciones)
- Validaciones de formularios
- Helpers y utilidades

// Integration Tests (React Native Testing Library)
- Flujos de usuario completos
- Navegación entre pantallas
- Interacción con Firebase mock

// E2E Tests (Detox)
- Registro y login
- Crear evento
- Agregar gastos
- Ver resumen
```

## 📊 Métricas y Analytics (Sugerido)

Implementar con Firebase Analytics:
```typescript
- Screen views
- Eventos creados
- Gastos registrados
- Tiempo en app
- Crashes y errores
```

## 🔄 CI/CD (Futuro)

```yaml
# GitHub Actions workflow sugerido:
- Linting (ESLint)
- Type checking (TypeScript)
- Unit tests (Jest)
- Build de producción (EAS Build)
- Deploy automático
```

## 📱 Plataformas Soportadas

- ✅ **iOS** (via Expo)
- ✅ **Android** (via Expo)
- ✅ **Web** (limitado, requiere adaptaciones)

## 🎯 Roadmap Técnico

### Fase 1 (Actual) ✅
- MVP funcional
- CRUD completo
- Cálculos básicos

### Fase 2 (Próxima)
- [ ] Export PDF
- [ ] Compartir por link
- [ ] Notificaciones push

### Fase 3 (Futuro)
- [ ] Modo offline
- [ ] Sincronización en tiempo real
- [ ] Chat entre participantes
- [ ] Adjuntar imágenes a gastos

---

**Documentación generada automáticamente para LessMo v1.0**
