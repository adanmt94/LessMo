# 📍 Dónde Encontrar Cada Funcionalidad

## 🎯 12 Funcionalidades Avanzadas Implementadas

### 1. 📷 **OCR de Recibos** (Escaneo de Recibos con IA)
**¿Dónde se ve?**
- **Pantalla:** Al crear un nuevo gasto
- **Cómo activar:** 
  1. Ve a cualquier evento
  2. Presiona el botón "+" (Añadir Gasto)
  3. Presiona el icono de cámara 📷
  4. Toma foto del recibo
  5. **El OCR extrae automáticamente:** monto, categoría, descripción
- **Archivos:** `src/services/ocrService.ts`
- **Nota:** Usa Google Cloud Vision API para extraer datos del recibo

### 2. 🧾 **División por Ítems** (Split de recibo por productos)
**¿Dónde se ve?**
- **Pantalla:** Al crear un gasto con foto de recibo
- **Cómo activar:**
  1. Añadir gasto con foto de recibo (ver punto 1)
  2. Después de tomar la foto, aparece botón "Dividir por Ítems"
  3. Se abre pantalla `ItemSplitScreen`
  4. Asigna cada ítem del recibo a participantes específicos
- **Archivos:** `src/screens/ItemSplitScreen.tsx`

### 3. 📊 **Predicción de Presupuesto con ML**
**¿Dónde se ve?**
- **Pantalla:** SummaryScreen (Pestaña Resumen de cada evento)
- **Ubicación:** Card superior con predicción de gastos futuros
- **Qué muestra:**
  - Gasto promedio por día
  - Predicción de gastos hasta fin de mes
  - Alerta si vas a superar el presupuesto
  - Recomendaciones personalizadas
- **Archivos:** 
  - `src/services/budgetPredictionService.ts`
  - `src/components/BudgetPredictionCard.tsx`

### 4. 🏆 **Gamificación y Logros**
**¿Dónde se ve?**
- **Pantalla:** Nueva pestaña "Logros" en el menú principal
- **Cómo acceder:** 
  1. Ve a Settings (Configuración)
  2. Presiona "Ver Logros" 🏆
- **Qué incluye:**
  - Logros desbloqueables (First Expense, Big Spender, etc.)
  - Sistema de puntos
  - Niveles de usuario
  - Estadísticas de progreso
- **Archivos:** `src/screens/AchievementsScreen.tsx`

### 5. 🏦 **Integración Bancaria**
**¿Dónde se ve?**
- **Pantalla:** Settings → "Conectar Banco"
- **Cómo acceder:**
  1. Ve a Settings
  2. Presiona "Conectar Banco" 🏦
  3. Elige tu banco (simulado)
  4. Ve transacciones bancarias
  5. Importa transacciones como gastos
- **Archivos:**
  - `src/services/bankingService.ts`
  - `src/screens/BankConnectionScreen.tsx`
  - `src/screens/BankTransactionsScreen.tsx`

### 6. 🔄 **Optimización de Liquidaciones**
**¿Dónde se ve?**
- **Pantalla:** SummaryScreen (Pestaña Resumen)
- **Ubicación:** Card con título "Liquidaciones Optimizadas"
- **Qué hace:**
  - Minimiza el número de transferencias necesarias
  - Muestra quién debe pagar a quién
  - Calcula el camino más eficiente
- **Archivos:**
  - `src/services/settlementOptimizationService.ts`
  - `src/components/SettlementOptimizationCard.tsx`

### 7. 📱 **Pagos con QR**
**¿Dónde se ve?**
- **Pantalla:** Nueva opción en menú de evento
- **Cómo acceder:**
  1. Ve a cualquier evento
  2. Presiona el menú (⋮) arriba a la derecha
  3. Selecciona "Generar QR de Pago"
- **Qué hace:**
  - Genera QR con datos de pago (PayPal, Stripe, transferencia)
  - Comparte QR por WhatsApp, email, etc.
  - Guarda QR en galería
- **Archivos:** `src/screens/QRCodePaymentScreen.tsx`

### 8. ⏰ **Recordatorios Inteligentes**
**¿Dónde se ve?**
- **Pantalla:** Settings → "Recordatorios"
- **Cómo acceder:**
  1. Ve a Settings
  2. Presiona "Configurar Recordatorios" ⏰
- **Qué hace:**
  - Notificaciones automáticas antes de eventos
  - Recordatorios de gastos pendientes
  - Alertas de pagos por hacer
  - Frecuencia personalizable
- **Archivos:**
  - `src/services/reminderService.ts`
  - `src/screens/ReminderSettingsScreen.tsx`

### 9. 🗺️ **Itinerario de Viaje**
**¿Dónde se ve?**
- **Pantalla:** Nueva pestaña en eventos de tipo "Viaje"
- **Cómo acceder:**
  1. Crea un evento (debe ser tipo viaje)
  2. Ve a ese evento
  3. Presiona pestaña "Itinerario" 🗺️
- **Qué incluye:**
  - Timeline de actividades del viaje
  - Mapa con ubicaciones de gastos
  - Fotos de recibos geolocalizadas
  - Duración de estancias
- **Archivos:**
  - `src/services/itineraryService.ts`
  - `src/screens/ItineraryScreen.tsx`

### 10. 💡 **Recomendaciones Personalizadas**
**¿Dónde se ve?**
- **Pantalla:** SummaryScreen (Pestaña Resumen)
- **Ubicación:** Card con consejos personalizados
- **Qué muestra:**
  - Análisis de patrones de gasto
  - Sugerencias para ahorrar
  - Categorías donde gastas más
  - Tips basados en tu comportamiento
- **Archivos:**
  - `src/services/recommendationsService.ts`
  - `src/components/RecommendationsCard.tsx`

### 11. 📡 **Sincronización Offline**
**¿Dónde se ve?**
- **Indicador:** Esquina superior derecha (siempre visible)
- **Estados:**
  - ✅ Verde: Sincronizado
  - ⚠️ Amarillo: Sincronizando
  - ❌ Rojo: Sin conexión (modo offline)
- **Qué hace:**
  - Trabaja sin internet
  - Guarda cambios localmente
  - Sincroniza automáticamente al reconectar
- **Archivos:**
  - `src/services/syncService.tsx`
  - `src/components/SyncStatusIndicator.tsx`

### 12. 📄 **Exportación a PDF/Excel**
**¿Dónde se ve?**
- **Pantalla:** SummaryScreen → Botón "Exportar"
- **Cómo acceder:**
  1. Ve a pestaña Resumen de cualquier evento
  2. Scroll hasta abajo
  3. Presiona "Exportar a PDF" o "Exportar a Excel"
- **Qué incluye:**
  - Resumen completo del evento
  - Lista de gastos con detalles
  - Gráficos de categorías
  - Balance por participante
- **Archivos:** `src/services/pdfService.ts`

---

## 🤖 IA y Chat (IMPORTANTE)

### ❌ **Chat con IA - NO IMPLEMENTADO**
El chat con IA y el envío de fotos para análisis **NO está implementado** en la app actual. 

**Lo que SÍ está implementado con IA:**
- ✅ OCR de recibos (usa Google Cloud Vision API)
- ✅ Predicción de presupuesto (ML básico con regresión lineal)
- ✅ Recomendaciones personalizadas (análisis de patrones)

**Para implementar chat con IA necesitarías:**
1. Integrar una API de chat (OpenAI GPT, Claude, Gemini)
2. Crear pantalla de chat
3. Implementar envío de fotos para análisis
4. Conectar con backend de IA

---

## 🎨 Funcionalidades Base (Ya implementadas)

### ✅ **Modo Oscuro**
- **Ubicación:** Settings → Toggle "Modo Oscuro"
- **Se aplica:** En toda la app automáticamente

### ✅ **Idiomas (ES/EN)**
- **Ubicación:** Settings → "Idioma" → Elegir español o inglés
- **Traducciones:** Completas en toda la app

### ✅ **Múltiples Monedas**
- **Ubicación:** Settings → "Moneda" → 10 monedas disponibles
- **Conversión:** Automática en toda la app

### ✅ **Autenticación Biométrica**
- **Ubicación:** Settings → Toggle "Autenticación Biométrica"
- **Tipos:** Face ID (iOS) / Touch ID / Huella dactilar (Android)

### ✅ **Grupos de Eventos**
- **Ubicación:** Pestaña "Grupos"
- **Función:** Organiza múltiples eventos relacionados

---

## 📋 Resumen Rápido

| Funcionalidad | ¿Dónde está? | ¿Cómo acceder? |
|--------------|-------------|----------------|
| OCR Recibos | Al añadir gasto | Botón cámara en AddExpenseScreen |
| Split por Ítems | Después de foto recibo | Botón "Dividir por Ítems" |
| Predicción ML | Resumen del evento | Card automático arriba |
| Logros | Settings | Botón "Ver Logros" 🏆 |
| Banco | Settings | Botón "Conectar Banco" 🏦 |
| Optimización | Resumen del evento | Card "Liquidaciones Optimizadas" |
| QR Pago | Menú del evento | ⋮ → "Generar QR de Pago" |
| Recordatorios | Settings | "Configurar Recordatorios" ⏰ |
| Itinerario | Eventos tipo viaje | Pestaña "Itinerario" 🗺️ |
| Recomendaciones | Resumen del evento | Card con consejos |
| Offline Sync | Siempre visible | Indicador esquina superior |
| Exportar PDF/Excel | Resumen del evento | Botón "Exportar" abajo |

---

## ⚠️ Funcionalidades NO Implementadas

- ❌ Chat con IA conversacional
- ❌ Envío de fotos al chat para análisis
- ❌ Asistente virtual interactivo
- ❌ Widget de pantalla de inicio (limitación de Expo)

---

## 🐛 Problemas Conocidos a Resolver

1. **Fotos de participantes no actualizadas** - Se debe sincronizar con Firebase
2. **Scroll limitado en Resumen** - No permite llegar a botones inferiores
3. **Iconos muy bastos** - Cambiar a versiones outline/minimalistas
4. **No se ve grupo en evento** - Falta mostrar badge del grupo en la lista
