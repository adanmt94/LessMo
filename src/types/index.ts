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

// Tipos de división de gastos
export type SplitType = 
  | 'equal'         // A partes iguales (todos pagan lo mismo)
  | 'percentage'    // Por porcentaje (cada uno un % diferente)
  | 'custom'        // Personalizado (montos específicos por persona)
  | 'amount'        // Por cantidad fija (cada uno paga una cantidad específica)
  | 'items';        // Por items individuales

// Interface para usuario
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}

// Interface para gasto único (antes era "evento")
export interface Expense {
  id: string;
  eventId: string;            // ID del evento al que pertenece
  name: string;
  description?: string;
  paidBy: string;             // userId de quien pagó
  amount: number;
  category: ExpenseCategory;
  date: Date;
  currency: Currency;
  participantIds: string[];   // Participantes que comparten este gasto
  splitType: SplitType;       // Cómo se divide el gasto
  customSplits?: {            // Solo si splitType es 'custom' o 'amount'
    [participantId: string]: number; // Monto o porcentaje por participante
  };
  percentageSplits?: {        // Solo si splitType es 'percentage'
    [participantId: string]: number; // Porcentaje (0-100) por participante
  };
  items?: ExpenseItem[];      // Items individuales (solo si splitType es 'items')
  receiptPhoto?: string;      // URL de la foto del recibo
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Interface para participante
export interface Participant {
  id: string;
  eventId: string;
  userId?: string;            // Opcional, puede ser invitado sin cuenta
  name: string;
  email?: string;
  photoURL?: string;          // URL de la foto del usuario
  individualBudget: number;   // Saldo inicial asignado a este participante
  currentBalance: number;     // Saldo actual después de gastos
  joinedAt: Date;
  isAnonymous?: boolean;      // Si se unió sin registrarse
}

// Interface para evento (antes era "grupo" - contenedor con presupuesto)
export interface Event {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  participantIds: string[];   // IDs de participantes del evento
  expenseIds: string[];       // IDs de gastos del evento
  initialBudget: number;      // Presupuesto inicial
  budget?: number;            // Alias para compatibilidad
  currentSpent?: number;      // Total gastado (calculado)
  startDate?: Date;
  endDate?: Date;
  currency: Currency;
  color?: string;             // Color para identificar el evento
  icon?: string;              // Emoji o icono del evento
  isActive: boolean;
  status: 'active' | 'completed' | 'archived';
  inviteCode?: string;        // Código para compartir
}

// Interface para item individual de un gasto
export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  assignedTo: string[];       // participantIds que comparten este item
  sharedEqually: boolean;     // true = división equitativa, false = custom
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
  CreateEvent: { eventId?: string; mode?: 'create' | 'edit' } | undefined;
  EventDetail: { eventId: string; eventName?: string }; // Lista de gastos del evento
  AddExpense: { 
    eventId: string; 
    expenseId?: string; 
    mode?: 'create' | 'edit';
    prefilledData?: {
      amount?: number;
      description?: string;
      category?: string;
      paidBy?: string;
      splitType?: SplitType;
    };
  };
  ExpenseDetail: { expenseId: string; eventId: string }; // Detalle de un gasto específico
  Summary: { eventId: string };
  JoinEvent: { inviteCode: string };
  JoinGroup: { inviteCode?: string };
  // TEMPORAL: Mantener compatibilidad durante migración
  CreateGroup: { groupId?: string; mode?: 'create' | 'edit' } | undefined;
  GroupEvents: { groupId: string; groupName: string; groupIcon?: string; groupColor?: string };
  Chat: { eventId?: string; groupId?: string; title: string };
  EditProfile: undefined;
  Achievements: { eventId: string; participantId: string };
  BankConnection: { connectedAccounts?: any[]; onAccountConnected?: (account: any) => void };
  BankTransactions: { account: any; event: any; expenses: any[]; onExpenseCreated?: (expense: any) => void };
  PaymentMethod: {
    amount: number;
    currency: Currency;
    recipientName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    description?: string;
    eventId: string;
    eventName: string;
  };
  QRCodePayment: {
    amount: number;
    currency: string;
    recipientName: string;
    recipientPhone?: string;
    recipientEmail?: string;
    description?: string;
    paymentType: 'bizum' | 'paypal' | 'venmo' | 'generic';
  };
  ReminderSettings: undefined;
  Itinerary: { event: any; expenses: any[] };
  Statistics: {
    eventId: string;
    eventName: string;
    currency: Currency;
  };
  Analytics: { eventId: string };
  PaymentHistory: { eventId: string; eventName: string };
};

export type TabParamList = {
  Events: undefined;    // Lista de eventos (antes "grupos")
  Groups: undefined;    // TEMPORAL: mantener durante migración
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
