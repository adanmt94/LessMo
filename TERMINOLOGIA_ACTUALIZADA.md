# 📚 TERMINOLOGÍA ACTUALIZADA - Les$Mo

## 🎯 Nomenclatura Correcta

### En el Código (TypeScript)
| Término Código | Significa | Usuario Ve | Ejemplo |
|----------------|-----------|------------|---------|
| **Group** | Contenedor con presupuesto máximo | "Grupo" o "Evento" | "Viaje a Madrid" con 1000€ |
| **GroupEvent** | Gasto único (transacción) | "Gasto" o "Evento" | "Cena restaurante" -50€ |
| **Event** | Alias de Group (legacy) | "Grupo" | Para compatibilidad |
| **Expense** | Alias de GroupEvent (legacy) | "Gasto" | Para compatibilidad |

### En la UI (Lo que ve el usuario)

#### Pantalla Principal (EventsScreen)
- **"Mis Grupos"** → Lista de contenedores con presupuesto
- **"Crear grupo"** → Crea un nuevo contenedor con presupuesto
- Cada item muestra: presupuesto, participantes, código

#### Dentro de un Grupo (GroupEventsScreen)
- **"Gastos del grupo"** → Lista de transacciones individuales
- **"Añadir Gasto"** → Crea una nueva transacción
- Cada gasto muestra: quién pagó, cuánto, quién debe

#### Tab de Navegación
- **"Eventos"** → Tab que muestra grupos (contenedores)
- **"Grupos"** → Tab que muestra grupos organizados por categoría

## 🔄 Migración Gradual

### Fase 1: ✅ COMPLETADA
- [x] Crear interfaces `Group` y `GroupEvent`
- [x] Crear aliases `Event = Group` y `Expense = GroupEvent`
- [x] Documentar en comentarios

### Fase 2: ✅ COMPLETADA
- [x] Actualizar textos en EventsScreen ("Mis Eventos" → "Mis Grupos")
- [x] Actualizar textos en GroupEventsScreen ("Crear Evento" → "Añadir Gasto")
- [x] Mantener traducciones i18n compatibles

### Fase 3: 🔄 EN PROGRESO
- [ ] Actualizar comentarios en servicios Firebase
- [ ] Actualizar documentación técnica
- [ ] Actualizar nombres de variables gradualmente

### Fase 4: ⏳ PENDIENTE (Futuro)
- [ ] Renombrar archivos de pantallas
- [ ] Migrar colecciones en Firestore
- [ ] Eliminar aliases de compatibilidad

## 💡 Guía de Uso

### Para Desarrolladores
```typescript
// ✅ CORRECTO - Nueva nomenclatura
import { Group, GroupEvent } from '../types';

const group: Group = {
  name: "Viaje a Madrid",
  initialBudget: 1000,
  // ...
};

const expense: GroupEvent = {
  name: "Cena restaurante",
  amount: 50,
  paidBy: "user123",
  // ...
};

// ✅ TAMBIÉN CORRECTO - Usando aliases (legacy)
import { Event, Expense } from '../types';

const event: Event = group; // Funciona por el alias
const expense: Expense = groupEvent; // Funciona por el alias
```

### Para Textos UI
```typescript
// ✅ CORRECTO - Claridad para el usuario
<Text>Mis Grupos</Text>           // Lista de contenedores
<Text>Añadir Gasto</Text>         // Crear transacción
<Text>Gastos del grupo</Text>     // Lista de transacciones

// ❌ EVITAR - Puede confundir
<Text>Mis Eventos</Text>          // ¿Grupos o gastos?
<Text>Crear Evento</Text>         // ¿Grupo o gasto?
```

## 📊 Estructura de Datos

```
Group/Event (Contenedor)
├── id: "group_123"
├── name: "Viaje a Madrid"
├── initialBudget: 1000€
├── participantIds: ["user1", "user2"]
└── eventIds: ["expense1", "expense2"]  ← Referencias a gastos

GroupEvent/Expense (Gasto único)
├── id: "expense1"
├── eventId: "group_123"  ← Pertenece al grupo
├── name: "Cena restaurante"
├── amount: 50€
├── paidBy: "user1"
└── participantIds: ["user1", "user2"]
```

## 🎨 Convenciones UI

### Iconos
- 📁 **Grupo/Contenedor** → Carpeta, contenedor
- 💰 **Gasto individual** → Dinero, transacción
- 👥 **Participantes** → Personas que comparten
- 🎯 **Presupuesto** → Meta u objetivo

### Colores
- **Azul (#6366F1)** → Grupos activos
- **Verde (#10B981)** → Saldos positivos, completado
- **Rojo (#EF4444)** → Alertas, saldos negativos
- **Gris (#6B7280)** → Grupos archivados

## 📝 Notas Importantes

1. **Los aliases son temporales**: Event y Expense seguirán funcionando durante la migración, pero eventualmente se eliminarán.

2. **Firebase no cambia**: Las colecciones siguen siendo `/events/` y `/expenses/` en Firestore para no romper datos existentes.

3. **UI antes que código**: Priorizamos claridad para el usuario sobre consistencia técnica.

4. **Migración gradual**: Actualizamos pantalla por pantalla para minimizar bugs.

## 🚀 Próximos Pasos

1. Actualizar comentarios en `firebase.ts`
2. Revisar y actualizar todas las pantallas gradualmente
3. Documentar ejemplos de uso en cada archivo
4. Considerar migración de colecciones Firestore (largo plazo)

---

**Fecha de actualización**: 7 de diciembre de 2024
**Estado**: Fase 2 completada - Textos UI actualizados
**Próxima fase**: Actualizar comentarios en servicios
