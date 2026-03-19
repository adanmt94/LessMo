# 🤖 Guía de Uso de GitHub Copilot Pro+ con LessMo

Esta guía te ayudará a aprovechar al máximo GitHub Copilot Pro+ durante el desarrollo y mantenimiento de LessMo.

## 🎯 Casos de Uso Principales

### 1️⃣ Agregar Validaciones

**Escenario**: Necesitas validar un campo de entrada

```typescript
// En cualquier archivo .tsx
// PASO 1: Escribe un comentario descriptivo
// Validar que el email tenga formato válido y no esté vacío

// PASO 2: Copilot sugerirá automáticamente:
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length > 0;
};
```

### 2️⃣ Crear Nuevas Funciones

**Escenario**: Necesitas una función para formatear fechas

```typescript
// En src/utils/helpers.ts (crear si no existe)

// Función para formatear fecha a formato español DD/MM/YYYY
// Copilot completará:
export const formatDateToSpanish = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
```

### 3️⃣ Agregar Nuevas Categorías de Gasto

**Escenario**: Quieres agregar categorías personalizadas

```typescript
// En src/types/index.ts

// Agregar nueva categoría "education" para gastos educativos
// PASO 1: Modifica ExpenseCategory
export type ExpenseCategory = 
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'entertainment'
  | 'shopping'
  | 'health'
  | 'education'  // Nueva categoría
  | 'other';

// PASO 2: Actualiza CategoryLabels
export const CategoryLabels: Record<ExpenseCategory, string> = {
  food: '🍴 Comida',
  transport: '🚗 Transporte',
  accommodation: '🏨 Alojamiento',
  entertainment: '🎉 Entretenimiento',
  shopping: '🛒 Compras',
  health: '💊 Salud',
  education: '📚 Educación',  // Copilot sugerirá el emoji
  other: '📱 Otros',
};

// PASO 3: Actualiza CategoryColors
// Copilot sugerirá automáticamente el color basándose en el patrón
export const CategoryColors: Record<ExpenseCategory, string> = {
  // ... colores existentes
  education: '#6366F1',  // Copilot sugerirá un color apropiado
};
```

### 4️⃣ Crear Nuevos Hooks Personalizados

**Escenario**: Necesitas un hook para manejar configuraciones

```typescript
// Crear src/hooks/useSettings.ts

// Hook personalizado para manejar configuraciones del usuario
// Copilot generará toda la estructura:

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  defaultCurrency: Currency;
  notifications: boolean;
  theme: 'light' | 'dark';
}

export const useSettings = () => {
  // Copilot completará toda la lógica
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  // ... resto del código
};
```

### 5️⃣ Agregar Componente de Filtros

**Escenario**: Filtrar gastos por categoría o fecha

```typescript
// Crear src/components/lovable/FilterBar.tsx

// Componente para filtrar gastos por categoría y rango de fechas
// Copilot generará el componente completo:

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExpenseCategory } from '../../types';

interface FilterBarProps {
  onFilterChange: (category: ExpenseCategory | 'all') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  // Copilot completará toda la UI y lógica
};
```

### 6️⃣ Implementar Exportación a PDF

**Escenario**: Exportar resumen del evento a PDF

```typescript
// En src/screens/SummaryScreen.tsx

// Función para exportar resumen a PDF usando expo-print
// Copilot sugerirá la implementación completa:

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const exportToPDF = async () => {
  // Copilot generará el HTML template y la lógica de exportación
  const html = `
    <html>
      <head>
        <style>
          /* Copilot sugerirá estilos CSS */
        </style>
      </head>
      <body>
        <!-- Copilot generará el contenido -->
      </body>
    </html>
  `;
  
  // Copilot completará la exportación
};
```

### 7️⃣ Agregar Tests Unitarios

**Escenario**: Testear la función de cálculo de liquidaciones

```typescript
// Crear src/hooks/__tests__/useExpenses.test.ts

// Test para verificar el cálculo correcto de liquidaciones
// Copilot generará los tests:

import { calculateSettlements } from '../useExpenses';

describe('calculateSettlements', () => {
  // Copilot sugerirá casos de prueba
  it('should calculate settlements correctly for 2 participants', () => {
    // Test implementation
  });

  it('should handle zero balances', () => {
    // Test implementation
  });
});
```

### 8️⃣ Implementar Notificaciones Push

**Escenario**: Enviar notificación cuando se agrega un gasto

```typescript
// Crear src/services/notifications.ts

// Servicio para manejar notificaciones push con Expo
// Copilot generará toda la configuración:

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configurar notificaciones
// Copilot completará toda la lógica
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Copilot sugerirá la configuración
  }),
});

export const sendExpenseNotification = async (
  participantName: string,
  amount: number,
  description: string
) => {
  // Copilot generará la implementación
};
```

## 💡 Tips para Usar Copilot Eficientemente

### ✅ Mejores Prácticas

1. **Escribe comentarios descriptivos antes del código**
   ```typescript
   // Función que calcula el promedio de gastos por día en un evento
   // Recibe un array de gastos y retorna el promedio
   // Si no hay gastos, retorna 0
   const calculateDailyAverage = (expenses: Expense[]): number => {
     // Copilot completará automáticamente
   ```

2. **Usa nombres descriptivos de variables y funciones**
   ```typescript
   // ✅ Bueno
   const calculateTotalExpensesForParticipant = (participantId: string) => {}
   
   // ❌ Malo
   const calc = (id: string) => {}
   ```

3. **Aprovecha el contexto del archivo**
   - Copilot entiende los imports y tipos existentes
   - Sugerirá código consistente con tu estilo

4. **Itera sobre las sugerencias**
   - Presiona `Tab` para aceptar
   - Presiona `Ctrl + Enter` (Windows/Linux) o `Cmd + Enter` (Mac) para ver más opciones

5. **Usa Copilot Chat**
   ```
   /explain - Explica el código seleccionado
   /fix - Arregla errores
   /tests - Genera tests
   /doc - Genera documentación
   ```

### 🎨 Ejemplos de Prompts Efectivos

#### Para agregar estilos
```typescript
// Estilos para un botón flotante en la esquina inferior derecha
// con sombra y animación de pulso
const styles = StyleSheet.create({
  // Copilot generará los estilos
});
```

#### Para validaciones
```typescript
// Validar que el presupuesto sea un número positivo
// mayor a 0 y menor a 1 millón
// Retornar objeto con isValid y errorMessage
const validateBudget = (budget: string) => {
  // Copilot completará
};
```

#### Para llamadas a API
```typescript
// Función asíncrona para obtener tasa de cambio de divisas
// usando la API de exchangerate-api.com
// Maneja errores y retorna null si falla
const getExchangeRate = async (from: Currency, to: Currency) => {
  // Copilot generará toda la lógica
};
```

## 🔧 Configuración Recomendada de Copilot

### En VS Code settings.json:

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": false,
    "markdown": true,
    "typescript": true,
    "typescriptreact": true
  },
  "github.copilot.advanced": {
    "suggestions": "auto"
  }
}
```

## 🚀 Flujo de Trabajo Recomendado

1. **Planifica** - Escribe comentarios describiendo lo que necesitas
2. **Genera** - Deja que Copilot sugiera la implementación
3. **Revisa** - Lee y entiende el código generado
4. **Refina** - Ajusta según tus necesidades
5. **Documenta** - Agrega comentarios para contexto futuro

## 📚 Recursos Adicionales

- [GitHub Copilot Docs](https://docs.github.com/en/copilot)
- [Copilot Best Practices](https://github.blog/2023-06-20-how-to-write-better-prompts-for-github-copilot/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)

## ⚠️ Advertencias

- **Siempre revisa el código generado** - Copilot es una herramienta, no un reemplazo del developer
- **Verifica la seguridad** - Especialmente en validaciones y autenticación
- **No compartas credenciales** - Copilot aprende de tu código, evita poner API keys directamente
- **Testea el código generado** - Asegúrate de que funciona como esperas

---

**¡Disfruta desarrollando con Copilot!** 🚀
