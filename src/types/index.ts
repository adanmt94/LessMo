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
  budget?: number;            // Presupuesto actual para predicciones (alias de initialBudget)
  startDate?: Date;           // Fecha de inicio del evento (opcional)
  endDate?: Date;             // Fecha de fin del evento (opcional)
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
  photoURL?: string;          // URL de la foto del usuario
  individualBudget: number;   // Saldo inicial asignado a este participante
  currentBalance: number;     // Saldo actual después de gastos
  joinedAt: Date;
  isAnonymous?: boolean;      // Si se unió sin registrarse
}

// Tipo de grupo
export type GroupType = 'project' | 'recurring';

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
  type?: GroupType;           // 'project' (con eventos) o 'recurring' (gastos directos)
  defaultEventId?: string;    // ID del evento "General" para grupos recurring
  totalParticipants?: number; // Número total de participantes únicos (calculado)
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
  splitType: 'equal' | 'custom' | 'items'; // Tipo de división
  customSplits?: {            // Solo si splitType es 'custom'
    [participantId: string]: number; // Monto específico por participante
  };
  items?: ExpenseItem[];      // Items individuales (solo si splitType es 'items')
  receiptPhoto?: string;      // URL de la foto del recibo (opcional)
  location?: {                // Ubicación geográfica del gasto (opcional, para itinerario)
    latitude: number;
    longitude: number;
    address?: string;
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
  EventDetail: { eventId: string; eventName?: string };
  GroupEvents: { groupId: string; groupName: string; groupIcon?: string; groupColor?: string };
  AddExpense: { 
    eventId?: string; 
    groupId?: string;
    expenseId?: string; 
    mode?: 'create' | 'edit';
    prefilledData?: {
      amount?: number;
      description?: string;
      category?: string;
      paidBy?: string;
    };
  };
  ExpenseList: { eventId: string };
  Summary: { eventId: string };
  JoinEvent: { inviteCode: string };
  JoinGroup: { inviteCode?: string };
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
