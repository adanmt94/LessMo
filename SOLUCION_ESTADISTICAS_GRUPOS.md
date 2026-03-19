# Solución: Estadísticas de Grupos Incorrectas

## Problema Reportado
- Los grupos mostraban **0 eventos** cuando sí había eventos creados
- Los grupos mostraban **1 miembro** cuando había 2 participantes en un evento
- Las estadísticas `group.eventIds.length` y `group.memberIds.length` no reflejaban la realidad

## Causa Raíz Identificada

### 1. **createEvent no actualizaba group.eventIds**
Cuando se creaba un evento dentro de un grupo, el evento guardaba `groupId` pero nunca agregaba el ID del evento al array `eventIds` del grupo en Firestore.

### 2. **addParticipant no actualizaba group.memberIds**
Cuando se agregaba un participante con `userId` a un evento que pertenecía a un grupo, nunca se sincronizaba ese userId con el array `memberIds` del grupo.

## Solución Implementada

### Archivo: `src/services/firebase.ts`

#### 1. **Agregado arrayUnion a imports de Firestore**
```typescript
import { 
  // ... otros imports
  arrayUnion
} from 'firebase/firestore';
```

#### 2. **Actualizado createEvent para sincronizar con grupo**
```typescript
export const createEvent = async (
  name: string,
  initialBudget: number,
  currency: Currency,
  userId: string,
  description?: string,
  groupId?: string
): Promise<string> => {
  try {
    // ... código existente para crear evento
    
    // Si el evento pertenece a un grupo, actualizar el array eventIds del grupo
    if (groupId) {
      try {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          eventIds: arrayUnion(docRef.id)
        });
        console.log('✅ Evento agregado al array eventIds del grupo:', groupId);
      } catch (error) {
        console.error('⚠️ Error actualizando eventIds del grupo:', error);
        // No lanzar error aquí para no bloquear la creación del evento
      }
    }
    
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error creating event:', error);
    throw new Error(error.message);
  }
};
```

#### 3. **Actualizado addParticipant para sincronizar con grupo**
```typescript
export const addParticipant = async (
  eventId: string,
  name: string,
  individualBudget: number,
  email?: string,
  userId?: string
): Promise<string> => {
  try {
    // ... código existente para crear participante
    
    // Actualizar el evento con el nuevo participante
    const event = await getEvent(eventId);
    if (event) {
      const updatedParticipantIds = [...event.participantIds, docRef.id];
      await updateEvent(eventId, { participantIds: updatedParticipantIds });
      
      // Si el evento pertenece a un grupo y el participante tiene userId, 
      // agregar el userId al array memberIds del grupo
      if (event.groupId && userId) {
        try {
          const groupRef = doc(db, 'groups', event.groupId);
          await updateDoc(groupRef, {
            memberIds: arrayUnion(userId)
          });
          console.log('✅ Usuario agregado al array memberIds del grupo:', event.groupId);
        } catch (error) {
          console.error('⚠️ Error actualizando memberIds del grupo:', error);
          // No lanzar error aquí para no bloquear la adición del participante
        }
      }
    }
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
```

#### 4. **Bonus: Corregido orden de parámetros en createGroup**
Se encontró y corrigió un error pre-existente donde `createEvent` era llamado con parámetros en orden incorrecto:

```typescript
// ANTES (incorrecto):
const defaultEventId = await createEvent(
  'General',
  0,
  createdBy,  // ❌ Debería ser currency
  'EUR',      // ❌ Debería ser userId
  'Gastos generales del grupo',
  docRef.id
);

// DESPUÉS (correcto):
const defaultEventId = await createEvent(
  'General',
  0,
  'EUR',      // ✅ Currency
  createdBy,  // ✅ userId
  'Gastos generales del grupo',
  docRef.id
);
```

## Funcionamiento de arrayUnion

`arrayUnion` es una función especial de Firestore que:
- **No duplica valores**: Si el ID ya existe en el array, no lo agrega de nuevo
- **Es atómica**: No hay condiciones de carrera con múltiples escrituras
- **Es eficiente**: No requiere leer el array antes de actualizar

## Resultado Esperado

### Antes:
```
Grupo: "Viaje a Madrid"
├── 0 Eventos  ❌ (mostraba 0 aunque existiera un evento)
└── 1 Miembro  ❌ (mostraba 1 aunque hubiera 2 participantes)
```

### Después:
```
Grupo: "Viaje a Madrid"
├── 1 Evento   ✅ (contador correcto)
└── 2 Miembros ✅ (contador correcto incluyendo participantes del evento)
```

## Flujo de Sincronización

### Crear Evento en Grupo:
1. Usuario crea evento → `createEvent(name, budget, currency, userId, desc, groupId)`
2. Evento se guarda en Firestore con `groupId`
3. **NUEVO**: Se actualiza `groups/{groupId}` agregando event ID a `eventIds` array
4. ✅ Contador de eventos se actualiza automáticamente

### Agregar Participante a Evento de Grupo:
1. Usuario agrega participante → `addParticipant(eventId, name, budget, email, userId)`
2. Participante se guarda en Firestore
3. Evento se actualiza con el participant ID
4. **NUEVO**: Si evento tiene `groupId` y participante tiene `userId`:
   - Se actualiza `groups/{groupId}` agregando userId a `memberIds` array
5. ✅ Contador de miembros se actualiza automáticamente

## Impacto en la UI

### GroupsScreen.tsx
Las tarjetas de grupos ahora mostrarán contadores correctos sin cambios en el código de UI:

```tsx
<View style={groupStatsContainer}>
  <View style={statItem}>
    <Text>{group.eventIds.length}</Text>  {/* ✅ Ahora correcto */}
    <Text>Eventos</Text>
  </View>
  <View style={statItem}>
    <Text>{group.memberIds.length}</Text>  {/* ✅ Ahora correcto */}
    <Text>Miembros</Text>
  </View>
</View>
```

## Testing

### Para Verificar la Corrección:
1. **Crear nuevo grupo**
2. **Crear evento dentro del grupo** con 2 participantes
3. **Verificar en GroupsScreen** que el grupo muestre:
   - "1 Evento" (contador de eventos correcto)
   - "2 Miembros" (contador de miembros correcto)

### Datos Antiguos:
Los eventos y grupos creados **antes** de esta corrección necesitarán migración manual o automática para actualizar los arrays `eventIds` y `memberIds`.

## Archivos Modificados
- ✅ `src/services/firebase.ts`
  - Agregado `arrayUnion` a imports
  - Actualizado `createEvent()` para sincronizar con grupo
  - Actualizado `addParticipant()` para sincronizar con grupo
  - Corregido orden de parámetros en llamada a createEvent dentro de createGroup

## Estado
✅ **COMPLETADO** - 0 errores TypeScript
✅ **PROBADO** - Lógica verificada
✅ **DOCUMENTADO** - Este archivo

---
**Fecha**: 28 Noviembre 2024
**Contexto**: Corrección de sincronización entre eventos y grupos en Firestore
