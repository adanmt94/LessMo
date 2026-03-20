# Árbol Completo de Funcionalidades — LessMo

```
LessMo App
│
├── 🔐 AUTENTICACIÓN
│   ├── Login con Email/Contraseña
│   ├── Login con Google
│   ├── Login Anónimo
│   ├── Registro de cuenta nueva
│   ├── Recuperar contraseña (email)
│   ├── Face ID / Touch ID (bloqueo biométrico)
│   └── Cierre de sesión
│
├── 📱 ONBOARDING (Tutorial primera vez)
│   ├── Paso 1: Bienvenida
│   ├── Paso 2: Crear eventos
│   ├── Paso 3: Añadir gastos
│   ├── Paso 4: Dividir gastos
│   ├── Paso 5: Liquidar deudas
│   └── Paso 6: Empezar a usar
│
├── 📊 PESTAÑA 1: GASTOS PERSONALES (IndividualExpensesScreen)
│   ├── Lista de gastos/ingresos personales
│   ├── Filtro por tipo (gasto / ingreso)
│   ├── Pull-to-refresh
│   ├── Header con gradiente y estadísticas
│   └── Navegación a detalle de gasto
│
├── 📅 PESTAÑA 2: EVENTOS (GroupsScreen)
│   ├── Lista de eventos del usuario
│   ├── Búsqueda de eventos
│   ├── Pestañas Activos / Pasados
│   ├── Crear nuevo evento (botón +)
│   ├── Unirse a evento (código de invitación)
│   ├── Swipe para eliminar evento
│   ├── Selección múltiple para borrar
│   └── Pull-to-refresh
│
├── 📢 PESTAÑA 3: ACTIVIDAD (ActivityScreen)
│   ├── Feed cronológico de actividad reciente
│   ├── Eventos creados
│   ├── Gastos añadidos
│   ├── Participantes nuevos
│   └── Pagos realizados
│
├── ⚙️ PESTAÑA 4: AJUSTES (SettingsScreen)
│   ├── Perfil
│   │   ├── Editar nombre
│   │   └── Cambiar foto de perfil
│   ├── Preferencias
│   │   ├── Modo oscuro / claro
│   │   ├── Idioma (ES, EN, FR, DE, PT)
│   │   ├── Moneda predeterminada (EUR, USD, GBP, JPY, CNY, MXN, ARS, COP, CLP, BRL)
│   │   ├── Notificaciones push
│   │   ├── Recordatorio diario
│   │   ├── Bloqueo biométrico (Face ID / Touch ID)
│   │   ├── Alertas de gasto
│   │   └── Atajos de Siri
│   ├── Datos y Privacidad
│   │   ├── Exportar datos
│   │   ├── Limpiar caché
│   │   └── Eliminar cuenta
│   └── Acerca de
│       ├── Versión de la app
│       ├── Términos y condiciones
│       └── Política de privacidad
│
├── ➕ CREAR EVENTO (CreateEventScreen)
│   ├── Título del evento
│   ├── Descripción
│   ├── Presupuesto máximo
│   ├── Moneda del evento
│   ├── Fechas (inicio y fin)
│   ├── Color del evento
│   ├── Icono del evento
│   ├── Añadir participantes
│   └── Modo edición (reusar pantalla)
│
├── 📋 DETALLE DE EVENTO (EventDetailScreen)
│   ├── Info general del evento
│   ├── Lista de gastos del evento
│   ├── Participantes y balances
│   ├── Liquidaciones (quién debe a quién)
│   │   └── Optimización de liquidaciones (mínimas transferencias)
│   ├── Compartir código de invitación
│   ├── Enlace profundo para compartir
│   ├── Acceso a chat
│   ├── Acceso a estadísticas
│   ├── Predicción de presupuesto (IA)
│   └── Recomendaciones inteligentes
│
├── 💰 AÑADIR GASTO (AddExpenseScreen)
│   ├── Concepto del gasto
│   ├── Cantidad
│   ├── Categorías de GASTO (7)
│   │   ├── 🍕 Comida
│   │   ├── 🚗 Transporte
│   │   ├── 🏨 Alojamiento
│   │   ├── 🎭 Entretenimiento
│   │   ├── 🛍️ Compras
│   │   ├── 🏥 Salud
│   │   └── 📦 Otros
│   ├── Categorías de INGRESO (7)
│   │   ├── 💼 Salario
│   │   ├── 🧑‍💻 Freelance
│   │   ├── 💸 Reembolso
│   │   ├── 🎁 Regalo
│   │   ├── 📈 Inversión
│   │   ├── 🏷️ Venta
│   │   └── 💵 Otros ingresos
│   ├── Quién pagó
│   ├── Tipos de división (5)
│   │   ├── Equitativa (partes iguales)
│   │   ├── Por porcentaje
│   │   ├── Personalizada
│   │   ├── Por monto exacto
│   │   └── Por items (artículos individuales)
│   ├── Foto del recibo
│   ├── OCR (escaneo automático del recibo)
│   └── Templates de gastos (reutilizar gastos comunes)
│
├── 📄 DIVISIÓN POR ITEMS (ItemSplitScreen)
│   ├── Lista de items del recibo (detectados por OCR)
│   ├── Asignar items a participantes
│   ├── Cálculo automático de totales
│   └── Guardar división
│
├── 📊 RESUMEN (SummaryScreen)
│   ├── Gráficas de gastos por categoría
│   ├── Balances de participantes
│   ├── Liquidaciones optimizadas
│   ├── Exportar a PDF
│   └── Compartir resumen
│
├── 💬 CHAT (ChatScreen)
│   ├── Mensajes de texto en tiempo real
│   ├── Enviar imágenes
│   └── Historial de mensajes
│
├── 💳 PAGOS
│   ├── Métodos de pago (PaymentMethodScreen)
│   │   ├── Apple Pay
│   │   ├── Google Pay
│   │   ├── Bizum
│   │   ├── PayPal
│   │   ├── Transferencia bancaria
│   │   ├── Stripe (tarjeta)
│   │   ├── Efectivo
│   │   └── Venmo
│   ├── Marcar pago como completado (MarkPaymentModal)
│   ├── Confirmar recepción de pago
│   ├── QR de pago (QRCodePaymentScreen)
│   ├── Historial de pagos (PaymentHistoryScreen)
│   └── Procesamiento real con Stripe (StripePaymentModal)
│
├── 🏦 BANCA (BankConnectionScreen + BankTransactionsScreen)
│   ├── Conectar cuenta bancaria (Open Banking)
│   ├── Ver transacciones detectadas
│   └── Vincular transacciones a gastos existentes
│
├── 📈 ESTADÍSTICAS (StatisticsScreen)
│   ├── Gráficas por categoría
│   ├── Gráficas por participante
│   ├── Evolución temporal
│   └── Comparaciones
│
├── 📊 ANALYTICS AVANZADO (AnalyticsScreen)
│   ├── Tendencias de gasto
│   ├── Patrones de consumo
│   ├── Comparaciones entre periodos
│   └── Dashboard completo
│
├── 🏆 LOGROS (AchievementsScreen)
│   ├── Badges / medallas
│   ├── Tabla de clasificación (leaderboard)
│   ├── Estadísticas divertidas
│   └── Progreso de gamificación
│
├── 🗺️ ITINERARIO (ItineraryScreen)
│   ├── Timeline de paradas del viaje
│   ├── Gastos vinculados a ubicaciones
│   └── Mapa con puntos de gasto
│
├── 🔗 UNIRSE A EVENTO
│   ├── Por código de invitación (JoinEventScreen)
│   ├── Por código QR
│   ├── Por deep link (lessmo://join/CODIGO)
│   └── Unirse a grupo (JoinGroupScreen)
│
├── 🔔 NOTIFICACIONES
│   ├── Push notifications
│   ├── Recordatorio diario para registrar gastos
│   ├── Recordatorios de deudas pendientes
│   ├── Alertas de gasto (cuando superas un umbral)
│   └── Configurar frecuencia (ReminderSettingsScreen)
│
├── 🎨 DISEÑO Y UI
│   ├── Design System (designSystem.ts)
│   │   ├── Spacing (xs, sm, md, lg, xl, xxl, huge)
│   │   ├── Radius (sm, md, lg, xl, round)
│   │   ├── Typography (largeTitle a caption2)
│   │   ├── Shadows (sm, md, lg, primary)
│   │   └── Gradientes (primary, hero, heroDark, success, warm, cool)
│   ├── Modo oscuro completo
│   ├── Gradientes en headers
│   ├── Haptic feedback en tabs
│   └── 5 idiomas
│
├── 📱 FUNCIONES iOS NATIVAS (solo en build nativo)
│   ├── Widgets de Home Screen (3 tamaños)
│   ├── Live Activities (Dynamic Island)
│   ├── Atajos de Siri
│   ├── Face ID / Touch ID
│   └── Haptic feedback
│
├── 🔄 OFFLINE Y SINCRONIZACIÓN
│   ├── Cola de operaciones offline
│   ├── Sincronización automática al reconectar
│   └── Indicador de estado de sincronización
│
├── 📤 EXPORTACIÓN
│   ├── Exportar a PDF
│   ├── Compartir vía sistema nativo
│   └── Exportar datos de la cuenta
│
└── 🛡️ SEGURIDAD
    ├── Firestore security rules
    ├── Validación de permisos por usuario
    ├── Secure Store para datos sensibles
    ├── Biometric authentication
    └── Sentry error tracking
```

## Resumen Numérico

| Categoría | Cantidad |
|-----------|----------|
| Pantallas totales | 33 |
| Servicios/APIs | 27 |
| Hooks personalizados | 17 |
| Componentes reutilizables | 20 |
| Idiomas soportados | 5 |
| Monedas soportadas | 10 |
| Categorías de gasto | 7 |
| Categorías de ingreso | 7 |
| Tipos de división | 5 |
| Métodos de pago | 8 |
