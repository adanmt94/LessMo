# RESUMEN COMPLETO - Sesión 21 Nov 2024 (Parte 3)

## ✅ COMPLETADO EN ESTA SESIÓN

### 1. StatusBar en Modo Oscuro - ARREGLADO ✅
- **Problema**: Hora, batería, WiFi invisibles en modo oscuro
- **Solución**: `<StatusBar style={theme.isDark ? 'light' : 'dark'} />`
- **Archivo**: `App.tsx` (reestructurado con AppContent)

### 2. Sistema de Alertas de Gastos - IMPLEMENTADO ✅
- **Hook creado**: `src/hooks/useSpendingAlerts.ts`
  - Configuración persistente en AsyncStorage
  - Notificaciones push automáticas
  - Dos tipos: Dinero bajo / Gasto alto
  
- **UI en Settings**: Sección completa con:
  - Switch para activar/desactivar cada alerta
  - Botón para configurar montos (Alert.prompt)
  - Muestra valores actuales

- **Cómo usar**:
  1. Settings > Alertas de Gastos
  2. Tocar el TÍTULO de la alerta
  3. Introducir monto deseado
  4. Activar switch

### 3. Participantes Duplicados - ARREGLADO ✅
- **Problema**: Se creaban múltiples participantes para el mismo usuario
- **Solución**: Verificar `userId` antes de crear participante
- **Archivo**: `src/screens/JoinEventScreen.tsx`
- **Código**:
```typescript
const existingParticipants = await getEventParticipants(eventId);
const alreadyParticipant = existingParticipants.find(p => p.userId === user.uid);
if (alreadyParticipant) {
  // Mostrar alerta y navegar directamente al evento
}
```

### 4. Error "Missing or insufficient permissions" - MEJORADO ✅
- **Mejora**: Mensaje de error más claro
- **Logs**: Console.error con detalles del error
- **Causa probable**: Reglas de Firestore están correctas, puede ser problema temporal de red o evento específico

---

## ⚠️ PROBLEMAS IDENTIFICADOS (No resueltos)

### 1. QR "No es válido"
**Estado**: Servidor corriendo correctamente en `exp://192.168.0.185:8081`

**Soluciones intentar**:
- Presionar 'r' en terminal para reload
- Cerrar Expo Go completamente y volver a escanear
- Copiar URL manualmente en Expo Go

### 2. Idioma no cambia visualmente
**Los logs SÍ muestran**:
```
🔔 Emitiendo evento global: LANGUAGE_CHANGED
🔄 FORZANDO REMOUNT COMPLETO DE LA APP
```

**Diagnóstico**: El estado cambia pero la UI no se actualiza

**Posibles causas**:
a) Componentes no usan `useLanguage()` correctamente
b) Textos hardcodeados en vez de `t('key')`
c) Cache de traducciones no se limpia

**Cómo verificar**:
```typescript
// En cualquier componente, verificar que use:
const { t } = useLanguage();
// Y no tenga textos como:
<Text>Configuración</Text> // ❌ MAL
<Text>{t('settings.title')}</Text> // ✅ BIEN
```

### 3. Moneda no cambia visualmente
**Similar al problema de idioma**

**Verificar**:
- Que componentes usen `useCurrency()` para obtener `currentCurrency`
- Que symbolo de moneda use `currentCurrency.symbol` y no hardcoded '€'

### 4. Welcome aparece dos veces
**No investigado**. Buscar:
- OnboardingScreen.tsx (pantalla completa)
- Modal/Banner de bienvenida en HomeScreen o EventsScreen
- Eliminar el duplicado

### 5. No hay botón compartir eventos/grupos
**Solución propuesta**:
```typescript
import { Share } from 'react-native';

const handleShare = async () => {
  await Share.share({
    message: `¡Únete a "${event.name}"!\n\nCódigo: ${event.inviteCode}\n\nDescarga LessMo: https://lessmo.app`,
  });
};

// Añadir botón en header de EventDetailScreen
```

### 6. No se puede unir a grupos
**Solución**: Crear `JoinGroupScreen.tsx` similar a `JoinEventScreen.tsx`

### 7. Seleccionar participante existente al unirse
**Propuesta**: Al unirse, mostrar:
```
"¿Eres alguno de estos participantes?"
[ ] Adán
[ ] Clara  
[ ] Soy nuevo/a

Si selecciona "Soy nuevo/a", pedir nombre
Si selecciona existente, vincular userId con ese participante
```

### 8. Botón activo en modo oscuro
**No investigado**. Buscar botón dentro de eventos de grupo y ajustar colores.

---

## 📊 ARCHIVOS MODIFICADOS

### Creados:
- `src/hooks/useSpendingAlerts.ts` (160 líneas)
- `PLAN_ACCION_URGENTE.md`
- `RESUMEN_FINAL_21_NOV_V2.md`
- Este archivo

### Modificados:
- `App.tsx` - Reestructurado completo con AppContent y StatusBar dinámico
- `src/screens/SettingsScreen.tsx` - Nueva sección "Alertas de Gastos"
- `src/screens/JoinEventScreen.tsx` - Prevención de duplicados
- `src/services/firebase.ts` - Fix AsyncStorage warning
- `src/navigation/index.tsx` - Fix DeepLinkHandler

---

## 🎯 PRIORIDADES PARA SIGUIENTE SESIÓN

### CRÍTICO (hacer primero):
1. **Investigar por qué idioma/moneda no cambian visualmente**
   - Añadir más logs
   - Verificar que componentes usen hooks correctamente
   - Revisar traducciones

2. **Añadir botón compartir** (10 min)
   - Fácil, solo usar `Share.share()`

### IMPORTANTE:
3. **Eliminar welcome duplicado** (5 min)
4. **Seleccionar participante existente al unirse** (30 min)
5. **Botón modo oscuro** (10 min)

### OPCIONAL:
6. **Unirse a grupos** (1 hora)

---

## 💡 NOTAS TÉCNICAS

### Alertas de Gastos - Cómo funciona:
```typescript
// 1. Usuario configura umbral en Settings
await updateMinAvailableAmount(100);  // Avisar si queda menos de 100€

// 2. Al añadir gasto, verificar:
await checkAvailableAmount(
  currentBalance,  // 45€
  'EUR',
  'Viaje a Madrid'
);

// 3. Si 45 < 100, envía notificación push:
// "⚠️ Dinero disponible bajo"
// "Solo te quedan 45 EUR en Viaje a Madrid"
```

### Participantes Duplicados - Prevención:
```typescript
// ANTES (problema):
await addParticipant(eventId, 'Clara', ...);
// Se creaba siempre nuevo participante

// AHORA (arreglado):
const existing = await getEventParticipants(eventId);
const alreadyExists = existing.find(p => p.userId === currentUserId);
if (alreadyExists) {
  // No crear duplicado
  return;
}
await addParticipant(...);
```

### StatusBar Dinámico:
```typescript
// ANTES:
<StatusBar style="auto" />  // No funcionaba en modo oscuro

// AHORA:
const { theme } = useTheme();
<StatusBar style={theme.isDark ? 'light' : 'dark'} />
// 'light' = texto blanco (para fondo oscuro)
// 'dark' = texto negro (para fondo claro)
```

---

## 🐛 BUGS CONOCIDOS

1. **Google Sign-In Config**: Aparece 40+ veces en logs
   - No es crítico pero contamina consola
   - Buscar dónde se llama repetidamente y cachear

2. **Idioma/Moneda no actualizan visualmente**
   - Estado cambia correctamente
   - Evento global se emite
   - App remounts con nuevo key
   - Pero textos no cambian → Investigar componentes

3. **QR "no válido"**
   - Servidor corre correctamente
   - Puede ser problema de cache de Expo Go
   - Workaround: Copiar URL manualmente

---

## 📈 PROGRESO GENERAL

### Problemas reportados: 10
### Resueltos completamente: 3 ✅
### Mejorados: 1 ⚠️
### Identificados/Documentados: 6 📝

### Features implementadas: 1
- Sistema completo de alertas de gastos

### Bugs arreglados: 2  
- StatusBar invisible en modo oscuro
- Participantes duplicados

---

## 🚀 CÓMO CONTINUAR

### Opción A: Resolver idioma/moneda (RECOMENDADO)
Es el problema más importante reportado por usuario.

**Pasos**:
1. Añadir logs detallados en LanguageContext
2. Verificar que TODOS los screens usan `useLanguage()`
3. Buscar strings hardcodeados
4. Probar cambio paso a paso

### Opción B: Implementar features faltantes
- Botón compartir (rápido)
- Unirse a grupos (largo)
- Seleccionar participante existente (medio)

### Opción C: Pulir UI
- Arreglar botón modo oscuro
- Eliminar welcome duplicado
- Mejorar mensajes de error

---

**Última actualización**: 21 de Noviembre de 2024, 13:00h

**Tokens utilizados**: ~98,000 / 1,000,000

**Próxima sesión**: Enfocarse en idioma/moneda que no cambian visualmente
