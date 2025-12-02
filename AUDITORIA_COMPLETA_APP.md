# 🔍 AUDITORÍA COMPLETA DE LA APP - 27 NOV 2025

## 1️⃣ PROBLEMA: GRUPOS Y EVENTOS

### Estado Actual
✅ **Código Firebase**: Correcto
- `createEvent()` acepta `groupId` opcional
- Se guarda correctamente en Firestore
- Logs confirman que funciona

✅ **CreateEventScreen**: Correcto  
- Recibe `groupId` del route params
- Lo pasa a `createEvent()`
- Logs muestran el flujo completo

✅ **EventsScreen**: Correcto
- Carga nombres de grupos
- Muestra badge con 📁 + nombre
- Fallback a "Grupo" si no carga el nombre

### ✅ CONCLUSIÓN: **NO HAY PROBLEMA CON GRUPOS**
El código funciona correctamente. Si no se ve el grupo:
1. Verificar que el evento fue creado desde un grupo
2. Ver logs en consola para confirmar groupId

---

## 2️⃣ PROBLEMA: FOTOS DE PARTICIPANTES NO SE VEN

### Análisis de la Cadena

#### A) Creación de Participante
```typescript
addParticipant() {
  - Recibe userId
  - Busca user en Firestore
  - Guarda photoURL en participante ✅
}
```

#### B) Carga de Participantes
```typescript
getEventParticipants() {
  - Si tiene photoURL guardado → lo usa ✅
  - Si no, busca en users y actualiza ✅
  - Sistema de 3 capas implementado ✅
}
```

#### C) Componente ParticipantItem
```typescript
<Image source={{ uri: photoURL }} onError={...} /> ✅
```

### 🔴 PROBLEMA REAL: photoURL puede ser NULL o UNDEFINED

**Casos donde NO habrá foto**:
1. Usuario creado sin Google (email/password) → NO tiene photoURL
2. Usuario anónimo → NO tiene photoURL
3. Participante invitado (sin userId) → NO tiene photoURL
4. Error en carga de Firebase

### ✅ SOLUCIÓN: Verificar que el usuario tenga foto

---

## 3️⃣ PROBLEMA: ICONOS NO ENTENDIBLES

### Iconos Actuales Problemáticos

#### EventsScreen - Header
- `↗` → Unirse a evento ❌ Confuso
- `+` → Crear evento ✅ OK

#### EventDetailScreen - Header
- `←` → Atrás ✅ OK
- `↗` → Compartir ❌ Confuso

#### EventDetailScreen - Footer
- `■` → Stats ❌ No se entiende
- `···` → Chat ❌ No se entiende
- `↗` → Share ❌ Confuso
- `✎` → Edit ✅ OK
- `×` → Delete ✅ OK

#### GroupEventsScreen - Header
- `···` → Chat ❌ No se entiende
- `↗` → Share ❌ Confuso
- `+` → Add ✅ OK

### 🎯 PROPUESTA DE ICONOS ENTENDIBLES

Necesitamos iconos que sean:
- **Reconocibles** inmediatamente
- **Universales** (mismo significado en todo el mundo)
- **Minimalistas** pero claros
- **Con texto** descriptivo debajo

#### Solución: Iconos SVG o Text con mejor significado

```
Stats    → 📊 (gráfica) 
Chat     → 💬 (bocadillo)
Share    → ⎘ (cuadrado con flecha)
Join     → ⎘+ (entrar)
Search   → 🔍 (lupa)
Add      → + (más)
Edit     → ✎ (lápiz)
Delete   → 🗑 (papelera)
Back     → ← (flecha)
```

---

## 4️⃣ PLAN DE ACCIÓN

### Prioridad Alta 🔴
1. Rediseñar TODOS los iconos con símbolos más claros
2. Añadir texto descriptivo bajo cada icono
3. Usar emojis reconocibles donde tenga sentido
4. Mantener círculos minimalistas

### Prioridad Media 🟡
5. Verificar que las fotos funcionen con usuarios de Google
6. Añadir placeholder visual cuando no hay foto
7. Mejorar feedback visual en acciones

### Prioridad Baja 🟢
8. Optimizar animaciones
9. Mejorar transiciones entre pantallas
10. Añadir tooltips explicativos

---

## 5️⃣ DECISIONES DE DISEÑO

### Iconos Finales Propuestos

| Acción | Icono Actual | Icono Nuevo | Texto |
|--------|-------------|-------------|-------|
| Stats | ■ | 📊 | Stats |
| Chat | ··· | 💬 | Chat |
| Share | ↗ | ⤴ | Share |
| Join | ↗ | + | Join |
| Edit | ✎ | ✏️ | Edit |
| Delete | × | 🗑 | Delete |
| Add | + | ➕ | Add |

### Estilo Visual
- Círculos de 44×44px
- Fondo translúcido con color del tema
- Iconos de 20px
- Texto de 11px debajo
- Espaciado consistente de 8px

