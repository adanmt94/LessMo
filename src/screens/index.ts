/**
 * Screens index - Exportación centralizada de pantallas
 */

export { HomeScreen } from './HomeScreen';
export { LoginScreen } from './LoginScreen';
export { RegisterScreen } from './RegisterScreen';
export { ForgotPasswordScreen } from './ForgotPasswordScreen';
// NOTA MIGRACIÓN: CreateEventScreen ahora es el contenedor (antiguo CreateGroupScreen)
// La pantalla para crear gastos individuales (antiguo CreateEvent) ahora es AddExpenseScreen
export { CreateEventScreen } from './CreateEventScreen'; // Contenedor de eventos
export { EventDetailScreen } from './EventDetailScreen';
export { AddExpenseScreen } from './AddExpenseScreen'; // Crear gastos individuales
export { SummaryScreen } from './SummaryScreen';
export { EventsScreen } from './EventsScreen';
export { GroupsScreen } from './GroupsScreen';
export { GroupEventsScreen } from './GroupEventsScreen';
export { SettingsScreen } from './SettingsScreen';
export { JoinEventScreen } from './JoinEventScreen';
export { JoinGroupScreen } from './JoinGroupScreen';
export { ChatScreen } from './ChatScreen';
export { PaymentMethodScreen } from './PaymentMethodScreen';
export { StatisticsScreen } from './StatisticsScreen';
export { EditProfileScreen } from './EditProfileScreen';
export { ActivityScreen } from './ActivityScreen';
export { BankConnectionScreen } from './BankConnectionScreen';
export { BankTransactionsScreen } from './BankTransactionsScreen';
export { QRCodePaymentScreen } from './QRCodePaymentScreen';
export { ReminderSettingsScreen } from './ReminderSettingsScreen';
export { ItineraryScreen } from './ItineraryScreen';
export { AnalyticsScreen } from './AnalyticsScreen';
export { PaymentHistoryScreen } from './PaymentHistoryScreen';
export { OnboardingScreen, shouldShowOnboarding, resetOnboarding, markOnboardingComplete } from './OnboardingScreen';
