/**
 * Tipos y interfaces principales de Les$Mo
 * 
 * NOMENCLATURA CORRECTA (después de migración):
 * - Group: Contenedor con presupuesto máximo (antes "Event")
 * - GroupEvent: Gasto único con quien paga y quien debe (antes "Expense")
 * 
 * ALIASES DE COMPATIBILIDAD (temporal):
 * - Event = Group (para código legacy)
 * - Expense = GroupEvent (para código legacy)
 */

// Tipos de monedas soportadas
export type Currency = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CNY' | 'MXN' | 'ARS' | 'COP' | 'CLP' | 'BRL';

// Tipo de transacción: gasto o ingreso
export type TransactionType = 'expense' | 'income';

// Categorías de gastos
export type ExpenseCategory = 
  | 'food'          // 🍴 Comida
  | 'transport'     // 🚗 Transporte
  | 'accommodation' // 🏨 Alojamiento
  | 'entertainment' // 🎉 Entretenimiento
  | 'shopping'      // 🛒 Compras
  | 'health'        // 💊 Salud
  | 'other';        // 📱 Otros

// Categorías de ingresos
export type IncomeCategory =
  | 'salary'        // 💰 Salario
  | 'freelance'     // 💻 Freelance
  | 'refund'        // 🔄 Reembolso
  | 'gift'          // 🎁 Regalo
  | 'investment'    // 📈 Inversión
  | 'sale'          // 🏷️ Venta
  | 'other_income'; // 💵 Otros ingresos

// Categoría general (gasto o ingreso)
export type TransactionCategory = ExpenseCategory | IncomeCategory;

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

// ==================== NUEVOS TIPOS (NOMENCLATURA CORRECTA) ====================

/**
 * Group: Contenedor con presupuesto máximo
 * Es el equivalente a un "viaje", "proyecto" o "evento grande"
 * Contiene múltiples GroupEvents (gastos individuales)
 */
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  participantIds: string[];   // IDs de participantes del evento
  eventIds: string[];         // IDs de eventos/gastos del evento
  expenseIds?: string[];      // Alias de eventIds para compatibilidad
  initialBudget: number;      // Presupuesto máximo del evento
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
  type?: 'project' | 'recurring'; // Tipo de evento
  
  // Propiedades de eventos legacy (Firestore)
  memberIds?: string[];       // Alias de participantIds (para eventos viejos)
  totalParticipants?: number; // Contador calculado
  totalEvents?: number;       // Total de eventos/gastos
  groupId?: string;           // Si este evento pertenece a otro (jerarquía)
}

/**
 * GroupEvent: Gasto único (evento individual)
 * Representa una transacción: alguien paga, otros deben
 * Es lo que el usuario llamará "evento" o "gasto"
 */
export interface GroupEvent {
  id: string;
  eventId: string;            // ID del evento al que pertenece (se llama eventId por legacy)
  groupId?: string;           // Alias de eventId
  name: string;
  description?: string;
  type?: TransactionType;     // 'expense' (default) o 'income'
  paidBy: string;             // participantId de quien pagó/recibió
  amount: number;
  category: ExpenseCategory | IncomeCategory;
  date: Date;
  currency: Currency;
  participantIds?: string[];  // Participantes que deben (opcional por compatibilidad con datos antiguos)
  beneficiaries?: string[];   // Alias de participantIds (legacy)
  splitType: SplitType;       // Cómo se divide el gasto
  customSplits?: {            // Solo si splitType es 'custom' o 'amount'
    [participantId: string]: number; // Monto por participante
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

// ==================== ALIASES DE COMPATIBILIDAD (TEMPORAL) ====================
// Estos aliases permiten que el código existente siga funcionando
// mientras migramos gradualmente a la nueva nomenclatura

/**
 * @deprecated Usar Group en su lugar
 * Event ahora es alias de Group (contenedor con presupuesto)
 */
export type Event = Group;

/**
 * @deprecated Usar GroupEvent en su lugar
 * Expense ahora es alias de GroupEvent (gasto único)
 */
export type Expense = GroupEvent;

// ==================== PARTICIPANTES ====================

// Interface para participante
export interface Participant {
  id: string;
  eventId: string;            // ID del evento (se llama eventId por legacy)
  groupId?: string;           // Alias de eventId (para nueva nomenclatura)
  userId?: string;            // Opcional, puede ser invitado sin cuenta
  name: string;
  email?: string;
  photoURL?: string;          // URL de la foto del usuario
  individualBudget: number;   // Saldo inicial asignado a este participante
  currentBalance: number;     // Saldo actual después de gastos
  joinedAt: Date;
  isAnonymous?: boolean;      // Si se unió sin registrarse
}

// Interface para item individual de un gasto
export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  assignedTo?: string[];      // participantIds que comparten este item (opcional por compatibilidad)
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
// NOTA: Manteniendo nombres actuales para no romper navegación existente
// TODO: Migrar gradualmente a la nueva nomenclatura
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  
  // Eventos (contenedores con presupuesto)
  CreateEvent: { eventId?: string; groupId?: string; mode?: 'create' | 'edit' } | undefined; // Crea EVENTO (o evento dentro de evento)
  EventDetail: { eventId: string; eventName?: string }; // Detalle de EVENTO con lista de eventos/gastos
  
  // Eventos/Gastos individuales
  AddExpense: { 
    eventId?: string;          // groupId en realidad
    expenseId?: string;       // groupEventId en realidad
    groupId?: string;
    mode?: 'create' | 'edit';
    prefilledData?: {
      amount?: number;
      description?: string;
      category?: string;
      paidBy?: string;
      splitType?: SplitType;
    };
  };
  ExpenseDetail: { expenseId: string; eventId: string }; // Detalle de evento/gasto individual
  
  Summary: { eventId: string }; // Resumen del evento
  JoinEvent: { inviteCode: string }; // Unirse a evento
  JoinGroup: { inviteCode?: string }; // Alias
  
  // LEGACY: Mantener compatibilidad
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
  Expenses: undefined;  // Gastos individuales (sin evento)
  Events: undefined;    // Lista de eventos (antes "eventos")
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

// Etiquetas de categorías de gastos en español
export const CategoryLabels: Record<ExpenseCategory, string> = {
  food: '🍴 Comida',
  transport: '🚗 Transporte',
  accommodation: '🏨 Alojamiento',
  entertainment: '🎉 Entretenimiento',
  shopping: '🛒 Compras',
  health: '💊 Salud',
  other: '📱 Otros',
};

// Etiquetas de categorías de ingresos en español
export const IncomeCategoryLabels: Record<IncomeCategory, string> = {
  salary: '💰 Salario',
  freelance: '💻 Freelance',
  refund: '🔄 Reembolso',
  gift: '🎁 Regalo',
  investment: '📈 Inversión',
  sale: '🏷️ Venta',
  other_income: '💵 Otros ingresos',
};

// Etiquetas combinadas
export const AllCategoryLabels: Record<ExpenseCategory | IncomeCategory, string> = {
  ...CategoryLabels,
  ...IncomeCategoryLabels,
};

// Colores para categorías de gastos (para gráficos)
export const CategoryColors: Record<ExpenseCategory, string> = {
  food: '#EF4444',
  transport: '#3B82F6',
  accommodation: '#8B5CF6',
  entertainment: '#EC4899',
  shopping: '#F59E0B',
  health: '#10B981',
  other: '#6B7280',
};

// Colores para categorías de ingresos
export const IncomeCategoryColors: Record<IncomeCategory, string> = {
  salary: '#059669',
  freelance: '#0891B2',
  refund: '#7C3AED',
  gift: '#DB2777',
  investment: '#0D9488',
  sale: '#D97706',
  other_income: '#4B5563',
};

// Colores combinados
export const AllCategoryColors: Record<ExpenseCategory | IncomeCategory, string> = {
  ...CategoryColors,
  ...IncomeCategoryColors,
};

// Validaciones
export const VALIDATION = {
  MAX_PARTICIPANTS: 20,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 1000000,
  MAX_EVENT_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
};
