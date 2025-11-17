# 🔴 CORRECCIONES CRÍTICAS: Editar vs Crear + Eliminar Eventos

**Fecha:** 16 de Noviembre, 2024  
**Commit:** `aa47d1a` - fix: CRÍTICO - Editar vs Crear pantallas + Botón eliminar evento

---

## 🐛 PROBLEMAS REPORTADOS POR EL USUARIO

1. **"Cuando se edita el grupo, entra en CREAR grupo"**
   - Al presionar "Editar" en un grupo, la pantalla aparecía VACÍA
   - Los datos del grupo NO se cargaban
   - Parecía que ibas a crear un nuevo grupo en lugar de editar

2. **"No se pueden eliminar Eventos"**
   - No había botón visible para eliminar eventos
   - La función `handleDeleteEvent` existía pero no se llamaba

3. **"Que cuando se edite, sea para editar, no volver a crear"**
   - Confusión generalizada entre modos crear/editar
   - Necesidad de distinción clara en TODAS las pantallas

---

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. Firebase Service (firebase.ts)

#### Funciones Añadidas:

```typescript
/**
 * Obtener un grupo por ID
 */
export const getGroup = async (groupId: string): Promise<any> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      throw new Error('Grupo no encontrado');
    }
    return {
      id: groupDoc.id,
      ...groupDoc.data()
    };
  } catch (error: any) {
    console.error('❌ Error loading group:', error);
    throw new Error(error.message || 'No se pudo cargar el grupo');
  }
};

/**
 * Actualizar un grupo
 */
export const updateGroup = async (
  groupId: string,
  name: string,
  description?: string,
  color?: string,
  icon?: string
): Promise<void> => {
  try {
    const groupData: any = {
      name,
      updatedAt: serverTimestamp(),
    };

    if (description) groupData.description = description;
    if (color) groupData.color = color;
    if (icon) groupData.icon = icon;

    await updateDoc(doc(db, 'groups', groupId), groupData);
    console.log('✅ Grupo actualizado:', groupId);
  } catch (error: any) {
    console.error('❌ Error updating group:', error);
    throw new Error(error.message || 'No se pudo actualizar el grupo');
  }
};
```

#### Import Añadido:
```typescript
import { 
  // ... otros imports
  serverTimestamp  // ← AÑADIDO
} from 'firebase/firestore';
```

**Nota:** `getEvent()` y `updateEvent()` ya existían, NO se duplicaron.

---

### 2. CreateGroupScreen - Modo Edición Implementado

#### ❌ ANTES (Problema):
```typescript
export const CreateGroupScreen: React.FC<Props> = ({ navigation, route }) => {
  const { groupId, mode } = route.params || {};
  const isEditMode = mode === 'edit' && groupId;
  
  // Estados siempre vacíos
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  
  // NO había código para cargar datos
  // ❌ Cuando se editaba, todo aparecía vacío
};
```

#### ✅ AHORA (Solución):
```typescript
export const CreateGroupScreen: React.FC<Props> = ({ navigation, route }) => {
  const { groupId, mode } = route.params || {};
  const isEditMode = mode === 'edit' && groupId;
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('👥');
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [loadingData, setLoadingData] = useState(!!isEditMode);  // ← NUEVO

  // ✅ NUEVO: useEffect para cargar datos en modo edición
  useEffect(() => {
    if (isEditMode) {
      loadGroupData();
    }
  }, [isEditMode, groupId]);

  // ✅ NUEVO: Función para cargar datos del grupo
  const loadGroupData = async () => {
    try {
      setLoadingData(true);
      const { getGroup } = await import('../services/firebase');
      const group = await getGroup(groupId!);
      
      // ✅ CARGA todos los datos del grupo
      setGroupName(group.name || '');
      setDescription(group.description || '');
      setSelectedIcon(group.icon || '👥');
      setSelectedColor(group.color || '#6366F1');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cargar el grupo');
      navigation.goBack();
    } finally {
      setLoadingData(false);
    }
  };

  // ✅ Loading state mientras carga datos
  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Cargando grupo...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
};
```

#### Manejo de Crear vs Actualizar:

```typescript
const handleCreateGroup = async () => {
  // Validaciones...
  
  setLoading(true);

  try {
    if (isEditMode) {
      // ✅ ACTUALIZAR grupo existente
      const { updateGroup } = await import('../services/firebase');
      await updateGroup(
        groupId!,
        groupName,
        description,
        selectedColor,
        selectedIcon
      );

      Alert.alert(
        '¡Grupo actualizado!',  // ← Mensaje específico
        'Los cambios se han guardado correctamente',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
      );
    } else {
      // ✅ CREAR nuevo grupo
      const newGroupId = await createGroup(
        groupName,
        user!.uid,
        description,
        selectedColor,
        selectedIcon
      );

      Alert.alert(
        '¡Grupo creado!',  // ← Mensaje específico
        'El grupo se ha creado correctamente',
        [{ text: 'Aceptar', onPress: () => navigation.navigate('MainTabs', { screen: 'Groups' } as any) }]
      );
    }
  } catch (error: any) {
    Alert.alert('Error', error.message || `No se pudo ${isEditMode ? 'actualizar' : 'crear'} el grupo`);
  } finally {
    setLoading(false);
  }
};
```

#### Título Dinámico:

Ya estaba implementado:
```typescript
<Text style={styles.headerTitle}>
  {isEditMode ? 'Editar Grupo' : 'Crear Grupo'}  // ← Ya existía
</Text>

<Button
  title={isEditMode ? 'Guardar Cambios' : 'Crear Grupo'}  // ← Ya existía
  onPress={handleCreateGroup}
/>
```

---

### 3. EventDetailScreen - Botón Eliminar Implementado

#### ❌ ANTES (Problema):
```typescript
// La función handleDeleteEvent existía pero NO se llamaba
const handleDeleteEvent = () => {
  Alert.alert(/* ... */);
};

// ❌ NO había botón en el header
return (
  <View style={styles.container}>
    {/* Solo tabs, sin botón de eliminar */}
  </View>
);
```

#### ✅ AHORA (Solución):
```typescript
import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';  // ← useLayoutEffect añadido

export const EventDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { eventId } = route.params;
  
  // ✅ NUEVO: Configurar header con botones
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 8 }}>
          {/* ✅ Botón EDITAR */}
          <TouchableOpacity 
            onPress={handleEditEvent}
            style={{ padding: 8 }}
          >
            <Text style={{ fontSize: 20 }}>✏️</Text>
          </TouchableOpacity>
          
          {/* ✅ Botón ELIMINAR (NUEVO) */}
          <TouchableOpacity 
            onPress={handleDeleteEvent}
            style={{ padding: 8, marginLeft: 4 }}
          >
            <Text style={{ fontSize: 20 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  // handleEditEvent ya existía (línea 108)
  const handleEditEvent = () => {
    navigation.navigate('CreateEvent', { 
      eventId: eventId, 
      mode: 'edit' 
    });
  };

  // handleDeleteEvent ya existía (línea 115)
  const handleDeleteEvent = () => {
    Alert.alert(
      'Eliminar evento',
      '¿Estás seguro? Se eliminarán todos los gastos y participantes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteEvent } = await import('../services/firebase');
              await deleteEvent(eventId);
              Alert.alert('Éxito', 'Evento eliminado correctamente', [
                { text: 'Aceptar', onPress: () => navigation.navigate('MainTabs', { screen: 'Events' } as any) }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el evento');
            }
          },
        },
      ]
    );
  };
};
```

---

### 4. Navigation (index.tsx) - Simplificado

#### ❌ ANTES:
```typescript
<Stack.Screen 
  name="EventDetail" 
  component={EventDetailScreen}
  options={({ navigation, route }) => ({ 
    headerShown: true,
    title: 'Detalles del Evento',
    headerBackTitle: 'Atrás',
    headerRight: () => (
      <View style={{ flexDirection: 'row', marginRight: 8 }}>
        <TouchableOpacity 
          onPress={() => {
            navigation.navigate('CreateEvent', { 
              eventId: route.params?.eventId, 
              mode: 'edit' 
            });
          }}
          style={{ padding: 8 }}
        >
          <Text style={{ fontSize: 20 }}>✏️</Text>
        </TouchableOpacity>
        {/* ❌ NO había botón de eliminar */}
      </View>
    )
  })}
/>
```

#### ✅ AHORA:
```typescript
<Stack.Screen 
  name="EventDetail" 
  component={EventDetailScreen}
  options={{ 
    headerShown: true,
    title: 'Detalles del Evento',
    headerBackTitle: 'Atrás',
    // ✅ Header configurado desde EventDetailScreen con useLayoutEffect
  }}
/>
```

**Ventajas:**
- Más limpio y mantenible
- Los botones tienen acceso a las funciones del componente
- Mejor control del estado

---

## 📋 ESTADO DE OTRAS PANTALLAS

### CreateEventScreen ✅
**Ya estaba BIEN implementado:**
- `isEditMode` definido correctamente
- `useEffect` para cargar datos del evento
- `loadEventData()` carga evento y participantes
- `handleCreateEvent()` maneja crear/actualizar
- Título dinámico: 'Editar Evento' vs 'Crear Evento'

**NO necesitó cambios.**

### AddExpenseScreen ⚠️
**Necesita revisión:**
- Tiene param `expenseId` para edición
- Necesita implementar `useEffect` para cargar datos del gasto
- Necesita lógica updateExpense vs createExpense

**Pendiente de implementar** (no reportado como problema urgente).

---

## 🎯 RESULTADO FINAL

### ✅ LO QUE AHORA FUNCIONA:

1. **Editar Grupo:**
   - ✅ Carga datos correctamente (nombre, descripción, icono, color)
   - ✅ Muestra "Cargando grupo..." mientras obtiene datos
   - ✅ Título: "Editar Grupo" (no "Crear Grupo")
   - ✅ Botón: "Guardar Cambios" (no "Crear Grupo")
   - ✅ Al guardar, muestra "¡Grupo actualizado!" y regresa

2. **Eliminar Evento:**
   - ✅ Botón 🗑️ visible en header junto a ✏️
   - ✅ Al presionar muestra confirmación
   - ✅ Elimina evento y todos sus gastos/participantes
   - ✅ Navega de regreso a lista de eventos

3. **Editar Evento:**
   - ✅ Ya funcionaba (no cambios necesarios)
   - ✅ Botón ✏️ visible y funcional

---

## 🧪 CÓMO PROBAR

### Test 1: Editar Grupo
1. Ir a pestaña "Grupos"
2. Tocar un grupo existente
3. Tocar icono de editar (✏️)
4. **VERIFICAR:**
   - ✅ Se muestra "Cargando grupo..."
   - ✅ Datos del grupo aparecen pre-cargados
   - ✅ Título dice "Editar Grupo"
   - ✅ Botón dice "Guardar Cambios"
5. Cambiar algo (ej: nombre)
6. Presionar "Guardar Cambios"
7. **VERIFICAR:**
   - ✅ Muestra "¡Grupo actualizado!"
   - ✅ Cambios se guardaron
   - ✅ Regresa a pantalla anterior

### Test 2: Eliminar Evento
1. Ir a pestaña "Eventos"
2. Tocar un evento
3. **VERIFICAR:**
   - ✅ Header muestra dos botones: ✏️ y 🗑️
4. Tocar botón 🗑️
5. **VERIFICAR:**
   - ✅ Muestra alerta de confirmación
6. Confirmar eliminación
7. **VERIFICAR:**
   - ✅ Evento eliminado de Firebase
   - ✅ Navega a lista de eventos
   - ✅ Evento ya no aparece en lista

### Test 3: Crear vs Editar
1. Crear nuevo grupo
   - **VERIFICAR:** Título "Crear Grupo", botón "Crear Grupo"
2. Editar grupo existente
   - **VERIFICAR:** Título "Editar Grupo", botón "Guardar Cambios"
3. Crear nuevo evento
   - **VERIFICAR:** Título "Crear Evento", botón "Crear Evento"
4. Editar evento existente
   - **VERIFICAR:** Título "Editar Evento", botón "Guardar Cambios"

---

## 📝 ARCHIVOS MODIFICADOS

1. **src/services/firebase.ts**
   - Añadido: `getGroup()`
   - Añadido: `updateGroup()`
   - Import: `serverTimestamp`
   - Export actualizado

2. **src/screens/CreateGroupScreen.tsx**
   - `useEffect` para cargar datos
   - `loadGroupData()` async
   - `handleCreateGroup()` con lógica crear/actualizar
   - Loading state
   - Estilos de loading

3. **src/screens/EventDetailScreen.tsx**
   - Import `useLayoutEffect`
   - `useLayoutEffect` para header buttons
   - Botón eliminar en header

4. **src/navigation/index.tsx**
   - Simplificado options de EventDetail
   - Removed inline headerRight

---

## 🚀 PRÓXIMOS PASOS (Opcionales)

1. **AddExpenseScreen:**
   - Implementar modo edición completo
   - useEffect para cargar datos del gasto
   - Lógica updateExpense

2. **Otros screens:**
   - Revisar si hay más pantallas con modo edición
   - Aplicar mismo patrón

3. **Testing:**
   - Crear tests automatizados para flujos editar/crear
   - Verificar que datos se carguen correctamente

---

**Commit:** `aa47d1a`  
**Archivos modificados:** 4  
**Líneas añadidas:** 192  
**Líneas eliminadas:** 57
