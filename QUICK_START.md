# 🎯 Guía de Inicio Rápido - LessMo

## ✅ Estado del Proyecto

✅ Todos los archivos generados
✅ TypeScript configurado
✅ Firebase integrado
✅ Componentes creados
✅ Pantallas implementadas
✅ Navegación configurada
✅ Sin errores de compilación

## 🚀 Pasos para ejecutar

### 1. Configurar Firebase (IMPORTANTE)

**Antes de ejecutar la app, debes configurar Firebase:**

1. Abre `src/services/firebase.ts`
2. Reemplaza los valores de `firebaseConfig` con los de tu proyecto Firebase
3. Ver instrucciones completas en `FIREBASE_SETUP.md`

### 2. Ejecutar la aplicación

```bash
# En la carpeta del proyecto
npx expo start
```

Luego escanea el QR con la app **Expo Go** en tu teléfono.

## 📱 Estructura de la App

### Pantallas implementadas:

1. **LoginScreen** - Inicio de sesión con email/password
2. **RegisterScreen** - Registro de nuevos usuarios
3. **HomeScreen** - Lista de eventos del usuario
4. **CreateEventScreen** - Crear evento con presupuesto y participantes
5. **EventDetailScreen** - Detalles con tabs (Gastos/Participantes/Resumen)
6. **AddExpenseScreen** - Agregar gastos con categorías
7. **SummaryScreen** - Resumen completo con gráficos y liquidaciones

### Componentes reutilizables (Lovable):

- **Button** - Botón personalizado con variantes
- **Input** - Campo de texto con validación
- **Card** - Contenedor estilizado
- **ExpenseItem** - Item de lista de gastos
- **ParticipantItem** - Item de lista de participantes

### Hooks personalizados:

- **useAuth** - Manejo de autenticación
- **useExpenses** - Manejo de gastos y cálculos

## 🎨 Funcionalidades clave

### Saldo inicial configurable
- Cada evento tiene un presupuesto inicial
- Cada participante tiene un presupuesto individual
- Se descuenta automáticamente con cada gasto

### Categorías de gastos
🍴 Comida | 🚗 Transporte | 🏨 Alojamiento | 🎉 Entretenimiento | 🛒 Compras | 💊 Salud | 📱 Otros

### Soporte multi-moneda
€ EUR | $ USD | £ GBP | $ MXN | $ ARS | $ COP | $ CLP | R$ BRL

### Cálculos automáticos
- Saldo restante por participante
- Total de gastos por categoría
- Liquidaciones sugeridas (quién debe pagar a quién)
- Gráficos de distribución de gastos

## 🔥 Firebase - Colecciones

La app usa las siguientes colecciones en Firestore:

1. **users** - Información de usuarios
2. **events** - Eventos/grupos creados
3. **participants** - Participantes de cada evento
4. **expenses** - Gastos registrados

## 💡 Uso de GitHub Copilot Pro+

### Durante el desarrollo:

1. **Autocompletado inteligente**
   - Escribe comentarios descriptivos
   - Copilot sugerirá implementaciones

2. **Refactorización**
   - Selecciona código
   - Pide a Copilot mejoras

3. **Generación de validaciones**
   ```typescript
   // Validar que el email tenga formato correcto
   // Copilot sugerirá la regex y lógica
   ```

4. **Completar funciones**
   ```typescript
   // Función para calcular el porcentaje de gasto
   const calculatePercentage = (amount: number, total: number) => {
     // Copilot completará automáticamente
   ```

## 🛠️ Comandos útiles

```bash
# Iniciar servidor de desarrollo
npx expo start

# Limpiar caché
npx expo start -c

# Verificar errores TypeScript
npx tsc --noEmit

# Instalar nuevas dependencias
npm install <paquete>

# Actualizar dependencias
npm update
```

## 🧪 Testing básico

### Flujo de prueba manual:

1. ✅ Registrar un nuevo usuario
2. ✅ Iniciar sesión
3. ✅ Crear un evento con 2-3 participantes
4. ✅ Agregar varios gastos
5. ✅ Ver resumen y gráficos
6. ✅ Verificar liquidaciones sugeridas
7. ✅ Cerrar sesión

## 📊 Métricas del proyecto

- **Pantallas**: 7
- **Componentes**: 5
- **Hooks**: 2
- **Servicios**: 1 (Firebase)
- **Líneas de código**: ~3000+
- **Lenguaje**: TypeScript
- **Framework**: React Native + Expo

## 🎯 Próximos pasos sugeridos

1. **Configurar Firebase** (obligatorio)
2. **Ejecutar y probar la app**
3. **Personalizar estilos y colores** si es necesario
4. **Agregar validaciones adicionales** con Copilot
5. **Implementar exportación a PDF** (feature futura)
6. **Agregar tests unitarios** para funciones críticas

## ⚠️ Notas importantes

- **NUNCA** subas `firebase.ts` con credenciales reales a GitHub público
- Usa variables de entorno para producción
- Las reglas de Firestore deben configurarse correctamente
- Revisa los límites de Firebase Free tier

## 🤝 Soporte

Si encuentras problemas:

1. Revisa `README.md` y `FIREBASE_SETUP.md`
2. Verifica la consola de Firebase
3. Ejecuta `npx expo start -c` para limpiar caché
4. Revisa errores en la consola de Expo

## 🎉 ¡Listo para usar!

Tu aplicación LessMo está completamente configurada y lista para ejecutar. Solo falta configurar Firebase y comenzar a probar.

**¡Mucha suerte con tu proyecto!** 🚀
