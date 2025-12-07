# 🔄 PLAN DE MIGRACIÓN DEL MODELO DE DATOS

## 📋 Mapeo de Conceptos

### NOMENCLATURA ANTERIOR → NUEVA
```
GRUPO (Group)     → EVENTO (Event)
EVENTO (Event)    → GASTO (Expense)
GASTO (Expense)   → [eliminado/integrado en Expense]
```

### JERARQUÍA ANTERIOR
```
GRUPO
  └── EVENTO
        └── GASTO (multiple gastos)
```

### JERARQUÍA NUEVA
```
EVENTO (contenedor con presupuesto)
  └── GASTO (transacción única)
```

---

## 🗂️ Cambios en Firestore

### Colecciones
- `groups` → `events`
- `events` → `expenses`
- `expenses` → [eliminar o migrar datos]

### Estructura de Documentos

#### EVENTO (antes Group):
```typescript
{
  id: string
  name: string
  description?: string
  createdBy: string
  createdAt: Date
  participantIds: string[]
  expenseIds: string[]        // antes: eventIds
  initialBudget: number
  budget?: number
  currentSpent?: number       // calculado
  startDate?: Date
  endDate?: Date
  currency: Currency
  color?: string
  icon?: string
  isActive: boolean
  status: 'active' | 'completed' | 'archived'
  inviteCode?: string
}
```

#### GASTO (antes Event):
```typescript
{
  id: string
  eventId: string            // antes: groupId
  name: string
  description?: string
  paidBy: string
  amount: number
  category: ExpenseCategory
  date: Date
  currency: Currency
  participantIds: string[]
  splitType: SplitType       // NUEVO: 'equal' | 'percentage' | 'custom' | 'amount' | 'items'
  customSplits?: { [id: string]: number }
  percentageSplits?: { [id: string]: number }  // NUEVO
  items?: ExpenseItem[]
  receiptPhoto?: string
  location?: { ... }
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}
```

---

## 📁 Archivos a Modificar

### ✅ COMPLETADO
- [x] `src/types/index.ts` - Tipos actualizados

### 🔄 EN PROGRESO
- [ ] `src/services/firebase.ts` - Funciones de Firestore

### ⏳ PENDIENTE

#### Servicios:
- [ ] `src/services/budgetPredictionService.ts`
- [ ] `src/services/paymentConfirmationService.ts`
- [ ] `src/services/statistics.ts`

#### Pantallas Principales:
- [ ] `src/screens/GroupsScreen.tsx` → `EventsScreen.tsx`
- [ ] `src/screens/CreateGroupScreen.tsx` → `CreateEventScreen.tsx`
- [ ] `src/screens/GroupEventsScreen.tsx` → `EventDetailScreen.tsx`
- [ ] `src/screens/EventDetailsScreen.tsx` → `ExpenseDetailScreen.tsx`
- [ ] `src/screens/AddExpenseScreen.tsx` → Actualizar para gastos únicos

#### Navegación:
- [ ] `src/navigation/AppNavigator.tsx`
- [ ] `src/navigation/MainNavigator.tsx`
- [ ] Actualizar todas las referencias a rutas

#### Componentes:
- [ ] `src/components/EventCard.tsx` → Actualizar para eventos
- [ ] `src/components/GroupCard.tsx` → Eliminar o renombrar
- [ ] `src/components/ExpenseItem.tsx`
- [ ] `src/components/BudgetPredictionCard.tsx`
- [ ] `src/components/MarkPaymentModal.tsx`

---

## 🔧 Funciones de Firebase a Renombrar

### Funciones de Grupos → Eventos
```typescript
// ANTES → DESPUÉS
getUserGroups()          → getUserEvents()
createGroup()            → createEvent()
getGroup()               → getEvent()
updateGroup()            → updateEvent()
deleteGroup()            → deleteEvent()
addGroupMember()         → addEventParticipant()
removeGroupMember()      → removeEventParticipant()
syncGroupStats()         → syncEventStats()
```

### Funciones de Eventos → Gastos
```typescript
// ANTES → DESPUÉS
createEvent()            → createExpense()
getEvents()              → getExpenses()
getEvent()               → getExpense()
updateEvent()            → updateExpense()
deleteEvent()            → deleteExpense()
getEventsByGroup()       → getExpensesByEvent()
```

### Colecciones en Queries
```typescript
// ANTES
collection(db, 'groups')
collection(db, 'events')
collection(db, 'expenses')

// DESPUÉS
collection(db, 'events')
collection(db, 'expenses')
// La antigua 'expenses' se elimina o migra
```

---

## 🎨 Cambios en UI (Textos)

### Pantalla Principal (Tab)
- "Grupos" → "Eventos"

### Botones y Acciones
- "Crear Grupo" → "Crear Evento"
- "Editar Grupo" → "Editar Evento"
- "Eliminar Grupo" → "Eliminar Evento"
- "Ver Eventos" → "Ver Gastos"
- "Añadir Evento" → "Añadir Gasto"
- "Editar Evento" → "Editar Gasto"

### Headers
- "Mis Grupos" → "Mis Eventos"
- "Eventos del Grupo" → "Gastos del Evento"
- "Detalles del Evento" → "Detalles del Gasto"

---

## ✨ NUEVAS FUNCIONALIDADES

### Selector de Tipo de División de Gastos

En `AddExpenseScreen` (crear/editar gasto):

```typescript
<SegmentedControl
  options={[
    { label: 'A partes iguales', value: 'equal' },
    { label: 'Por porcentaje', value: 'percentage' },
    { label: 'Por cantidad', value: 'amount' },
    { label: 'Personalizado', value: 'custom' },
  ]}
  selected={splitType}
  onChange={setSplitType}
/>

{splitType === 'equal' && (
  // Dividir automáticamente entre participantes seleccionados
)}

{splitType === 'percentage' && (
  // Input de porcentaje para cada participante (suma debe ser 100%)
)}

{splitType === 'amount' && (
  // Input de cantidad fija para cada participante
)}

{splitType === 'custom' && (
  // Checkboxes para seleccionar participantes + división automática
)}
```

---

## 🚨 CONSIDERACIONES IMPORTANTES

### Migración de Datos Existentes
⚠️ **CRÍTICO**: Los datos actuales en Firestore necesitan migración

Opciones:
1. **Script de migración** (recomendado):
   - Leer todos los `groups` → crear como `events`
   - Leer todos los `events` → crear como `expenses`
   - Actualizar referencias cruzadas

2. **Migración en tiempo real**:
   - Detectar modelo antiguo en lectura
   - Convertir on-the-fly
   - Escribir en nuevo formato

3. **Empezar de cero** (más simple pero pierde datos):
   - Resetear Firestore
   - Usar solo nuevo modelo

### Compatibilidad Temporal
Durante la migración, mantener funciones legacy:
```typescript
// Funciones deprecated pero funcionales
/** @deprecated Use getUserEvents instead */
export const getUserGroups = getUserEvents;
```

### Testing
- [ ] Probar creación de eventos
- [ ] Probar creación de gastos
- [ ] Probar división por porcentaje
- [ ] Probar división personalizada
- [ ] Probar cálculo de deudas
- [ ] Probar resumen y liquidaciones

---

## 📊 Progreso

- [x] Tipos actualizados
- [ ] Firebase actualizado (0%)
- [ ] Pantallas renombradas (0%)
- [ ] Navegación actualizada (0%)
- [ ] Textos UI actualizados (0%)
- [ ] Selector de división implementado (0%)
- [ ] Migración de datos (0%)
- [ ] Testing (0%)

---

**SIGUIENTE PASO**: Actualizar `firebase.ts` con las nuevas funciones
