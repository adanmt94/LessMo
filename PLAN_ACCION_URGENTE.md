# PLAN DE ACCIÓN - Problemas Urgentes

## PRIORIDAD CRÍTICA

### 1. ❌ ERROR: "Missing or insufficient permissions"
**Problema detectado en logs**: Los participantes se guardan correctamente pero luego hay un error de permisos.

**Diagnóstico**: 
- Los logs muestran: `✅ Participante guardado con ID: DEahuzysHR0x2BIpgNic`
- Pero luego aparece error de permisos en la UI

**Solución**:
```typescript
// En firestore.rules - Verificar reglas de participants
match /participants/{participantId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update, delete: if request.auth != null;
}
```

### 2. 🔄 PROBLEMA: Participantes Duplicados
**Logs muestran**: 4 participantes cuando solo debería haber 2 (Adán y Clara)
- Clara aparece 2 veces: DEahuzysHR0x2BIpgNic, I3KcB4p5PlpVnudUkCZO

**Causa**: Al unirse a evento, se crea NUEVO participante siempre, incluso si el usuario ya es participante

**Solución necesaria**: Antes de crear participante, verificar si userId ya existe en ese evento

---

## PRIORIDAD ALTA

### 3. 📱 QR "No es válido"
**Estado**: El servidor está corriendo correctamente en modo Expo Go
- URL correcta: `exp://192.168.0.185:8081`

**Solución**: 
1. Presiona 'r' en la terminal para recargar
2. Escanea el nuevo QR que aparece
3. Si sigue fallando, cierra Expo Go completamente y vuelve a escanear

### 4. 🌍 Idioma no cambia visualmente
**Los logs SÍ muestran el cambio**: `🔔 Emitiendo evento global: LANGUAGE_CHANGED` y `🔄 FORZANDO REMOUNT`

**Problema**: Aunque el estado cambia, los textos no se actualizan

**Causa probable**: Los componentes no están usando el hook `useLanguage()` para obtener las traducciones

**Solución**: Verificar que TODOS los textos usen `t('key')` en vez de strings hardcodeados

### 5. 💰 Moneda no cambia visualmente  
**Similar al problema de idioma**

**Para probar**: 
1. Ir a Settings
2. Cambiar moneda de EUR a USD
3. Verificar en consola si aparece: `🔔 Emitiendo evento global: CURRENCY_CHANGED`

**Si aparece el log pero no cambia**: Los componentes no están usando `useCurrency()` correctamente

---

## PRIORIDAD MEDIA

### 6. 🎯 Alertas de gastos - YA SON MODIFICABLES
**NO HAY PROBLEMA**. Las alertas YA son completamente configurables:

1. Ve a Settings > Scroll a "Alertas de Gastos"
2. **Toca el TÍTULO** de la alerta (no el switch)
3. Introduce el monto que quieras
4. El switch activa/desactiva la alerta

**Ejemplo**:
- Toca "Alerta: Dinero disponible bajo"
- Introduce "50"
- Activa el switch
- Listo!

### 7. 👥 Welcome aparece dos veces
**Causa**: Probablemente hay un OnboardingScreen y además un modal/banner de bienvenida

**Solución**: Buscar y eliminar el componente duplicado (probablemente un modal en HomeScreen o EventsScreen)

### 8. 🔗 No hay botón compartir
**Solución**: Añadir botón en EventDetailScreen que:
```typescript
const handleShare = async () => {
  await Share.share({
    message: `¡Únete a mi evento "${event.name}"! Código: ${event.inviteCode}\n\nDescarga LessMo: https://lessmo.app`,
  });
};
```

### 9. 👥 No se puede unir a grupos
**Solución**: Crear `JoinGroupScreen.tsx` similar a `JoinEventScreen.tsx`

---

## SOLUCIONES RÁPIDAS (Orden de implementación)

### PASO 1: Arreglar error de permisos (5 min)
```bash
# Verificar firestore.rules
```

### PASO 2: Prevenir participantes duplicados (10 min)
```typescript
// En JoinEventScreen, antes de crear participante:
const existingParticipant = participants.find(p => p.userId === user.uid);
if (existingParticipant) {
  Alert.alert('Ya eres participante', 'Ya estás unido a este evento');
  navigation.navigate('EventDetail', { eventId });
  return;
}
```

### PASO 3: Verificar cambio de idioma/moneda (15 min)
- Probar cambiar idioma y ver si TODOS los textos cambian
- Si no cambian, buscar textos hardcodeados y reemplazarlos por `t('key')`

### PASO 4: Añadir botón compartir (10 min)
- Importar `Share` from 'react-native'
- Añadir botón en header de EventDetailScreen
- Mostrar inviteCode y link

### PASO 5: Eliminar welcome duplicado (5 min)
- Buscar componentes de onboarding
- Dejar solo OnboardingScreen.tsx a pantalla completa

### PASO 6: Seleccionar participante existente (30 min)
- En JoinEventScreen, mostrar lista de participantes
- Opciones: "Soy [Nombre]" o "Soy nuevo"

---

## PRIORIDAD BAJA

### Bot

ón activo en modo oscuro
- Buscar botón dentro de eventos de grupo
- Ajustar colores según theme.isDark

### Unirse a grupos
- Implementar JoinGroupScreen
- Similar a JoinEventScreen pero para grupos

---

## ORDEN RECOMENDADO DE EJECUCIÓN

1. **AHORA**: Arreglar error de permisos ❌
2. **AHORA**: Prevenir participantes duplicados 🔄
3. Verificar cambio de idioma/moneda 🌍💰
4. Añadir botón compartir 🔗
5. Eliminar welcome duplicado 👥
6. Implementar selección de participante existente
7. Arreglar botón modo oscuro
8. Implementar unirse a grupos

---

**NOTA IMPORTANTE**: 
El QR debería funcionar. El servidor está corriendo correctamente en modo Expo Go. Si sigue diciendo "no válido", prueba:
1. Cerrar Expo Go completamente
2. Presionar 'r' en la terminal
3. Volver a escanear el QR

Si eso no funciona, copia manualmente la URL: `exp://192.168.0.185:8081`
