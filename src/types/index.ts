/**
 * Tipos y interfaces principales de LessMo
 */

// Tipos de monedas soportadas
export type Currency = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CNY' | 'MXN' | 'ARS' | 'COP' | 'CLP' | 'BRL';

// Categorías de gastos
export type ExpenseCategory = 
  | 'food'          // 🍴 Comida
  | 'transport'     // 🚗 Transporte
  | 'accommodation' // 🏨 Alojamiento
  | 'entertainment' // 🎉 Entretenimiento
  | 'shopping'      // 🛒 Compras
  | 'health'        // 💊 Salud
  | 'other';        // 📱 Otros

// Interface para usuario
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}

// Interface para evento/grupo
export interface Event {
  id: string;
  name: string;
  description?: string;
  createdBy: string;          // userId del creador
  createdAt: Date;
  initialBudget: number;      // Presupuesto inicial del evento
  currency: Currency;
  participantIds: string[];   // Array de IDs de participantes
  isActive: boolean;          // Si el evento está activo
  status: 'active' | 'completed' | 'archived'; // Estado del evento
  groupId?: string;           // ID del grupo al que pertenece (opcional)
  inviteCode?: string;        // Código único para compartir el evento
}

// Interface para participante
export interface Participant {
  id: string;
  eventId: string;
  userId?: string;            // Opcional, puede ser invitado sin cuenta
  name: string;
  email?: string;
  individualBudget: number;   // Saldo inicial asignado a este participante
  currentBalance: number;     // Saldo actual después de gastos
  joinedAt: Date;
  isAnonymous?: boolean;      // Si se unió sin registrarse
}

// Interface para grupo de eventos
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  memberIds: string[];        // IDs de usuarios miembros
  eventIds: string[];         // IDs de eventos del grupo
  color?: string;             // Color para identificar el grupo
  icon?: string;              // Emoji o icono del grupo
}

// Interface para gasto
export interface Expense {
  id: string;
  eventId: string;
  paidBy: string;             // participantId de quien pagó
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: Date;
  beneficiaries: string[];    // Array de participantIds que se benefician
  splitType: 'equal' | 'custom'; // Tipo de división
  customSplits?: {            // Solo si splitType es 'custom'
    [participantId: string]: number; // Monto específico por participante
  };
  createdAt: Date;
  updatedAt?: Date;
}

// Interface para resumen de gastos por categoría
export interface ExpenseSummary {
  category: ExpenseCategory;
  total: number;
  percentage: number;
  count: number;
}

// Interface para balance entre participantes
export interface ParticipantBalance {
  participantId: string;
  participantName: string;
  totalPaid: number;
  totalOwed: number;
  balance: number;            // Positivo: le deben, Negativo: debe
}

// Interface para transacción de liquidación
export interface Settlement {
  from: string;               // participantId
  to: string;                 // participantId
  amount: number;
}

// Props de navegación (React Navigation)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  CreateEvent: { eventId?: string; mode?: 'create' | 'edit'; groupId?: string } | undefined;
  CreateGroup: { groupId?: string; mode?: 'create' | 'edit' } | undefined;
  EventDetail: { eventId: string };
  GroupEvents: { groupId: string; groupName: string };
  AddExpense: { eventId: string; expenseId?: string; mode?: 'create' | 'edit' };
  ExpenseList: { eventId: string };
  Summary: { eventId: string };
  JoinEvent: { inviteCode: string };
  EditProfile: undefined;
};

export type TabParamList = {
  Events: undefined;
  Groups: undefined;
  Activity: undefined;
  Settings: undefined;
};

// Símbolos de monedas
export const CurrencySymbols: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  MXN: '$',
  ARS: '$',
  COP: '$',
  CLP: '$',
  BRL: 'R$',
};

// Etiquetas de categorías en español
export const CategoryLabels: Record<ExpenseCategory, string> = {
  food: '🍴 Comida',
  transport: '🚗 Transporte',
  accommodation: '🏨 Alojamiento',
  entertainment: '🎉 Entretenimiento',
  shopping: '🛒 Compras',
  health: '💊 Salud',
  other: '📱 Otros',
};

// Colores para categorías (para gráficos)
export const CategoryColors: Record<ExpenseCategory, string> = {
  food: '#EF4444',
  transport: '#3B82F6',
  accommodation: '#8B5CF6',
  entertainment: '#EC4899',
  shopping: '#F59E0B',
  health: '#10B981',
  other: '#6B7280',
};

// Validaciones
export const VALIDATION = {
  MAX_PARTICIPANTS: 20,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 1000000,
  MAX_EVENT_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
};
