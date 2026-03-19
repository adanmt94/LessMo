# 🔍 ESTADO REAL DE LA MIGRACIÓN - 7 Diciembre 2024

## 📋 LO QUE PEDISTE (Tu Solicitud Original)

> **"Los eventos tienen que ser un gasto único que tenga un participante que paga y participantes que deben"**
> 
> **"Los grupos tienen que ser un conjunto de eventos con presupuesto máximo"**

### Estructura Solicitada:
```
GRUPO (con presupuesto máximo)
├── EVENTO 1 (gasto único)
│   ├── Participante que paga
│   └── Participantes que deben
├── EVENTO 2 (gasto único)
│   ├── Participante que paga
│   └── Participantes que deben
└── EVENTO 3 (gasto único)
    ├── Participante que paga
    └── Participantes que deben
```

## ❌ LO QUE ESTÁ AHORA (Estructura Actual)

### En `src/types/index.ts`:
```typescript
// ❌ INCORRECTO: "Event" es el CONTENEDOR con presupuesto
export interface Event {
  id: string;
  name: string;
  initialBudget: number;      // ← Presupuesto del CONTENEDOR
  participantIds: string[];   
  expenseIds: string[];       // ← Lista de gastos dentro
  currency: Currency;
  // ...
}

// ❌ INCORRECTO: "Expense" es el GASTO INDIVIDUAL
// Debería llamarse "Event" según tu solicitud
export interface Expense {
  id: string;
  eventId: string;            // ← ID del contenedor
  name: string;
  paidBy: string;             // ← Quien paga
  amount: number;
  participantIds: string[];   // ← Quienes deben (beneficiaries)
  splitType: SplitType;
  // ...
}
```

### Estructura Actual:
```
EVENT (con presupuesto) ← Debería llamarse GROUP
├── EXPENSE 1 ← Debería llamarse EVENT
│   ├── paidBy
│   └── participantIds (beneficiaries)
├── EXPENSE 2 ← Debería llamarse EVENT
│   ├── paidBy
│   └── participantIds (beneficiaries)
└── EXPENSE 3 ← Debería llamarse EVENT
    ├── paidBy
    └── participantIds (beneficiaries)
```

## 🔄 LO QUE NECESITA CAMBIAR

### 1. Tipos (`src/types/index.ts`)
| Actual | Debe ser | Razón |
|--------|----------|-------|
| `Event` | `Group` | Es el contenedor con presupuesto máximo |
| `Expense` | `Event` | Es el gasto único (evento) que pediste |
| `eventId` en Expense | `groupId` | Referencia al contenedor |
| `expenseIds` en Event | `eventIds` | Lista de eventos/gastos |

### 2. Firebase (`src/services/firebase.ts`)
| Función Actual | Debe ser | Estado |
|----------------|----------|--------|
| `createEvent()` | `createGroup()` | ❌ Ya existe pero crea grupos viejos |
| `getEvent()` | `getGroup()` | ❌ Ya existe |
| `createExpense()` | `createEvent()` | ❌ Conflicto - existe para otra cosa |
| `getEventExpenses()` | `getGroupEvents()` | ❌ No existe |

### 3. Pantallas
| Pantalla Actual | Debe ser | Estado |
|-----------------|----------|--------|
| `EventsScreen.tsx` | `GroupsScreen.tsx` | ❌ No renombrado |
| `CreateEventScreen.tsx` | `CreateGroupScreen.tsx` | ✅ Ya existe (viejo) |
| `EventDetailScreen.tsx` | `GroupDetailScreen.tsx` | ❌ No renombrado |
| `AddExpense.tsx` | `CreateEventScreen.tsx` | ❌ No renombrado |

### 4. Navegación (`src/types/index.ts`)
```typescript
// ACTUAL (INCORRECTO)
export type RootStackParamList = {
  CreateEvent: { eventId?: string };      // ← Crea CONTENEDOR
  EventDetail: { eventId: string };       // ← Detalle CONTENEDOR
  AddExpense: { eventId: string };        // ← Añade GASTO
  // ...
}

// DEBE SER
export type RootStackParamList = {
  CreateGroup: { groupId?: string };      // ← Crea CONTENEDOR
  GroupDetail: { groupId: string };       // ← Detalle CONTENEDOR
  CreateEvent: { groupId: string };       // ← Crea GASTO/EVENTO
  // ...
}
```

## 🎯 PLAN DE ACCIÓN COMPLETO

### Fase 1: Tipos Base ⚠️ CRÍTICO
- [ ] Renombrar `Event` → `Group` en types/index.ts
- [ ] Renombrar `Expense` → `Event` en types/index.ts
- [ ] Crear alias de compatibilidad temporales

### Fase 2: Firebase
- [ ] Renombrar funciones de eventos → funciones de grupos
- [ ] Renombrar funciones de expenses → funciones de eventos
- [ ] Mantener aliases para no romper código existente

### Fase 3: Hooks
- [ ] Actualizar `useEvents` → manejar Groups
- [ ] Actualizar `useExpenses` → manejar Events (gastos únicos)
- [ ] Actualizar `useParticipants`

### Fase 4: Pantallas Principales
- [ ] `EventsScreen.tsx` → `GroupsScreen.tsx`
- [ ] `EventDetailScreen.tsx` → `GroupDetailScreen.tsx`
- [ ] `CreateEventScreen.tsx` → `CreateGroupScreen.tsx`
- [ ] `AddExpense.tsx` → `CreateEventScreen.tsx`

### Fase 5: Navegación
- [ ] Actualizar `RootStackParamList`
- [ ] Actualizar todas las llamadas `navigation.navigate()`
- [ ] Actualizar deep links

### Fase 6: UI/UX
- [ ] Actualizar traducciones (i18n)
- [ ] Actualizar textos hardcodeados
- [ ] Actualizar componentes (EventCard → GroupCard)

### Fase 7: Testing
- [ ] Probar creación de grupos
- [ ] Probar creación de eventos (gastos)
- [ ] Probar navegación completa
- [ ] Verificar que no se rompió nada

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. Conflicto de Nombres
```typescript
// ❌ PROBLEMA: Ambas existen y hacen cosas diferentes
createEvent() // ← Actualmente crea CONTENEDOR (debería crear GASTO)
createGroup() // ← Actualmente crea grupo viejo (debería crear CONTENEDOR)
```

### 2. Confusión Terminológica
```
Usuario ve: "Eventos" 
Código dice: Event (que es contenedor)
Debería ser: Groups en código, "Eventos" en UI
```

### 3. Migración de Datos
```
Firestore actual:
/events/{eventId} ← Son contenedores (deberían ser /groups/)
/expenses/{expenseId} ← Son gastos (deberían ser /events/)
```

## 💡 SOLUCIÓN PROPUESTA

### Opción A: Migración Gradual con Aliases (RECOMENDADA)
1. Crear nuevos tipos: `Group`, `GroupEvent`
2. Mantener `Event` y `Expense` como aliases
3. Migrar pantalla por pantalla
4. Una vez todo funcione, eliminar aliases

### Opción B: Migración Total de Golpe (ARRIESGADA)
1. Renombrar todo de una vez
2. Actualizar todas las referencias
3. Alto riesgo de romper la app

### Opción C: Mantener Actual + Documentación (NO RECOMENDADA)
1. Mantener nombres actuales
2. Solo documentar que "Event" = Grupo y "Expense" = Evento
3. Confusión permanente

## 📊 PROGRESO ACTUAL

### ✅ Completado
- Sistema de presupuesto en contenedores
- Selector de división de gastos (5 tipos)
- Validaciones de porcentajes
- Cálculos de balance

### 🔄 En Progreso
- Cambio de branding Les$Mo (completo)
- Bug fixes (completos)

### ❌ No Iniciado
- **Migración de terminología Event/Expense** ← LO MÁS IMPORTANTE
- Renombramientos de archivos
- Actualización de navegación
- Actualización de traducciones

## 🎯 SIGUIENTE PASO INMEDIATO

**Empezar con Fase 1: Renombrar tipos base**

1. Backup de `src/types/index.ts`
2. Crear nuevas interfaces:
   ```typescript
   export interface Group { /* contenedor con presupuesto */ }
   export interface GroupEvent { /* gasto único */ }
   export type Event = Group; // Alias temporal
   export type Expense = GroupEvent; // Alias temporal
   ```
3. Actualizar gradualmente las referencias

---

**Fecha**: 7 Diciembre 2024  
**Estado**: Migración de modelo 30% completa  
**Prioridad**: 🔴 ALTA - Afecta arquitectura completa
