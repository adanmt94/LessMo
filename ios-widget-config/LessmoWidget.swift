import WidgetKit
import SwiftUI

/**
 * LessmoWidget - Widget nativo para iOS
 * Muestra balance, deudas, presupuesto y acciones rápidas
 */

// MARK: - Recent Expense Model
struct RecentExpense: Identifiable {
    let id = UUID()
    let description: String
    let amount: Double
    let date: Date
    let category: String
    
    var categoryIcon: String {
        switch category.lowercased() {
        case "comida", "food", "restaurante", "restaurant": return "fork.knife"
        case "transporte", "transport", "taxi", "uber": return "car.fill"
        case "alojamiento", "hotel", "accommodation": return "bed.double.fill"
        case "compras", "shopping": return "bag.fill"
        case "ocio", "entertainment", "diversión": return "gamecontroller.fill"
        case "salud", "health": return "heart.fill"
        case "educación", "education": return "book.fill"
        case "hogar", "home": return "house.fill"
        case "suscripción", "subscription": return "repeat"
        default: return "eurosign.circle.fill"
        }
    }
}

// MARK: - Data Model
struct SimpleEntry: TimelineEntry {
    let date: Date
    let eventName: String
    let totalExpenses: Double
    let userBalance: Double
    let participantsCount: Int
    let currency: String
    let monthTotal: Double
    let monthExpenses: Int
    let pendingPayments: Double
    let budget: Double
    let eventsCount: Int
    let youOwe: Double
    let owedToYou: Double
    let recentExpenses: [RecentExpense]
    let lastUpdate: Date?
    
    static var placeholder: SimpleEntry {
        SimpleEntry(
            date: Date(),
            eventName: "Viaje a Madrid",
            totalExpenses: 450.50,
            userBalance: -125.30,
            participantsCount: 5,
            currency: "EUR",
            monthTotal: 320.0,
            monthExpenses: 12,
            pendingPayments: 45.0,
            budget: 1000.0,
            eventsCount: 3,
            youOwe: 125.30,
            owedToYou: 0,
            recentExpenses: [
                RecentExpense(description: "Cena grupo", amount: 65.00, date: Date(), category: "comida"),
                RecentExpense(description: "Taxi", amount: 12.50, date: Date().addingTimeInterval(-3600), category: "transporte"),
                RecentExpense(description: "Supermercado", amount: 34.20, date: Date().addingTimeInterval(-7200), category: "compras")
            ],
            lastUpdate: Date()
        )
    }
    
    static var empty: SimpleEntry {
        SimpleEntry(
            date: Date(),
            eventName: "",
            totalExpenses: 0,
            userBalance: 0,
            participantsCount: 0,
            currency: "EUR",
            monthTotal: 0,
            monthExpenses: 0,
            pendingPayments: 0,
            budget: 0,
            eventsCount: 0,
            youOwe: 0,
            owedToYou: 0,
            recentExpenses: [],
            lastUpdate: nil
        )
    }
    
    var isEmpty: Bool { eventName.isEmpty || eventName == "Sin eventos" || eventName == "No hay eventos" }
    
    var currencySymbol: String {
        switch currency {
        case "USD": return "$"
        case "GBP": return "£"
        case "MXN": return "$"
        case "JPY", "CNY": return "¥"
        case "BRL": return "R$"
        case "ARS", "COP", "CLP": return "$"
        default: return "€"
        }
    }
    
    var budgetRemaining: Double {
        budget > 0 ? max(0, budget - totalExpenses) : 0
    }
    
    var budgetProgress: Double {
        budget > 0 ? min(1.0, totalExpenses / budget) : 0
    }
    
    func formatAmount(_ amount: Double) -> String {
        if amount == 0 { return "0\(currencySymbol)" }
        if amount >= 1000 {
            return String(format: "%.0f%@", amount, currencySymbol)
        }
        return String(format: "%.2f%@", amount, currencySymbol)
    }
    
    var lastUpdateText: String {
        guard let lastUpdate = lastUpdate else { return "" }
        let diff = Date().timeIntervalSince(lastUpdate)
        if diff < 60 { return "ahora" }
        if diff < 3600 { return "hace \(Int(diff / 60))min" }
        if diff < 86400 { return "hace \(Int(diff / 3600))h" }
        return "hace \(Int(diff / 86400))d"
    }
}

// MARK: - Provider
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        .placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        completion(.placeholder)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry: SimpleEntry
        
        if let sharedDefaults = UserDefaults(suiteName: "group.com.lessmo.app.widgets"),
           let rawValue = sharedDefaults.string(forKey: "widgetData"),
           let jsonData = rawValue.data(using: .utf8),
           let widgetData = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
            
            // Parse recent expenses
            var expenses: [RecentExpense] = []
            if let rawExpenses = widgetData["recentExpenses"] as? [[String: Any]] {
                let dateFormatter = ISO8601DateFormatter()
                dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                for raw in rawExpenses.prefix(5) {
                    let desc = raw["description"] as? String ?? "Gasto"
                    let amount = raw["amount"] as? Double ?? 0
                    let dateStr = raw["date"] as? String ?? ""
                    let cat = raw["category"] as? String ?? ""
                    let date = dateFormatter.date(from: dateStr) ?? Date()
                    expenses.append(RecentExpense(description: desc, amount: amount, date: date, category: cat))
                }
            }
            
            // Parse last update
            var lastUpdate: Date? = nil
            if let lastUpdateStr = widgetData["lastUpdate"] as? String {
                let df = ISO8601DateFormatter()
                df.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                lastUpdate = df.date(from: lastUpdateStr)
            }
            
            entry = SimpleEntry(
                date: Date(),
                eventName: widgetData["eventName"] as? String ?? "Sin eventos",
                totalExpenses: widgetData["totalExpenses"] as? Double ?? 0.0,
                userBalance: widgetData["userBalance"] as? Double ?? 0.0,
                participantsCount: widgetData["participantsCount"] as? Int ?? 0,
                currency: widgetData["currency"] as? String ?? "EUR",
                monthTotal: widgetData["monthTotal"] as? Double ?? 0.0,
                monthExpenses: widgetData["monthExpenses"] as? Int ?? 0,
                pendingPayments: widgetData["pendingPayments"] as? Double ?? 0.0,
                budget: widgetData["budget"] as? Double ?? 0.0,
                eventsCount: widgetData["eventsCount"] as? Int ?? 0,
                youOwe: widgetData["youOwe"] as? Double ?? 0.0,
                owedToYou: widgetData["owedToYou"] as? Double ?? 0.0,
                recentExpenses: expenses,
                lastUpdate: lastUpdate
            )
        } else {
            entry = .empty
        }

        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
}

// MARK: - Color Palette
extension Color {
    static let widgetAccent = Color(red: 0.35, green: 0.47, blue: 1.0)
    static let widgetPositive = Color(red: 0.2, green: 0.78, blue: 0.55)
    static let widgetNegative = Color(red: 0.95, green: 0.3, blue: 0.35)
    static let widgetCard = Color(red: 0.949, green: 0.949, blue: 0.969)
}

// MARK: - Small Widget
struct LessmoWidgetEntryViewSmall: View {
    var entry: SimpleEntry

    var body: some View {
        if entry.isEmpty {
            emptyState
                .widgetURL(URL(string: "lessmo://add-expense"))
        } else {
            dataView
                .widgetURL(URL(string: "lessmo://dashboard"))
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 6) {
            Image(systemName: "plus.circle.fill")
                .font(.system(size: 28))
                .foregroundStyle(.linearGradient(
                    colors: [.widgetAccent, .widgetAccent.opacity(0.6)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                ))
            Text("Añadir gasto")
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var dataView: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 5) {
                Image(systemName: "chart.pie.fill")
                    .font(.system(size: 11))
                    .foregroundStyle(.linearGradient(
                        colors: [.widgetAccent, .purple],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    ))
                Text("LessMo")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundColor(.secondary)
                Spacer()
                if !entry.lastUpdateText.isEmpty {
                    Text(entry.lastUpdateText)
                        .font(.system(size: 8, weight: .medium, design: .rounded))
                        .foregroundColor(.secondary.opacity(0.7))
                }
            }
            
            Spacer()
            
            // Gastado este mes - main number
            Text("Gastado este mes")
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundColor(.secondary)
            
            HStack(alignment: .firstTextBaseline, spacing: 1) {
                Text(String(format: "%.2f", entry.monthTotal))
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                Text(entry.currencySymbol)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
            }
            .foregroundColor(.primary)
            .padding(.top, 1)
            
            // Event debts summary
            if entry.youOwe > 0 {
                HStack(spacing: 3) {
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 8))
                    Text("Debes \(entry.formatAmount(entry.youOwe))")
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                }
                .foregroundColor(.widgetNegative)
                .padding(.top, 3)
            } else if entry.owedToYou > 0 {
                HStack(spacing: 3) {
                    Image(systemName: "arrow.down.left")
                        .font(.system(size: 8))
                    Text("Te deben \(entry.formatAmount(entry.owedToYou))")
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                }
                .foregroundColor(.widgetPositive)
                .padding(.top, 3)
            } else if entry.eventsCount > 0 {
                HStack(spacing: 3) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 8))
                    Text("Estás al día")
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                }
                .foregroundColor(.widgetPositive)
                .padding(.top, 3)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

// MARK: - Medium Widget
struct LessmoWidgetEntryViewMedium: View {
    var entry: SimpleEntry

    var body: some View {
        if entry.isEmpty {
            emptyState
        } else {
            dataView
        }
    }
    
    private var emptyState: some View {
        HStack(spacing: 16) {
            Link(destination: URL(string: "lessmo://add-expense")!) {
                VStack(spacing: 8) {
                    Image(systemName: "bolt.circle.fill")
                        .font(.system(size: 36))
                        .foregroundStyle(.linearGradient(
                            colors: [.widgetAccent, .widgetAccent.opacity(0.6)],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ))
                    Text("Gasto rápido")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            
            RoundedRectangle(cornerRadius: 1)
                .fill(Color.secondary.opacity(0.2))
                .frame(width: 1)
                .padding(.vertical, 8)
            
            Link(destination: URL(string: "lessmo://create-event")!) {
                VStack(spacing: 8) {
                    Image(systemName: "calendar.badge.plus")
                        .font(.system(size: 36))
                        .foregroundStyle(.linearGradient(
                            colors: [.purple, .widgetAccent],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ))
                    Text("Crear evento")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var dataView: some View {
        HStack(spacing: 0) {
            // Left column - Balance + debts → opens dashboard
            Link(destination: URL(string: "lessmo://dashboard")!) {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 5) {
                        Image(systemName: "chart.pie.fill")
                            .font(.system(size: 13))
                            .foregroundStyle(.linearGradient(
                                colors: [.widgetAccent, .purple],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            ))
                        Text("LessMo")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Text("Gastado este mes")
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                        .foregroundColor(.secondary)
                    
                    HStack(alignment: .firstTextBaseline, spacing: 1) {
                        Text(String(format: "%.2f", entry.monthTotal))
                            .font(.system(size: 26, weight: .bold, design: .rounded))
                        Text(entry.currencySymbol)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                    }
                    .foregroundColor(.primary)
                    .padding(.top, 1)
                    
                    // Owe/Owed summary
                    HStack(spacing: 12) {
                        if entry.youOwe > 0 {
                            HStack(spacing: 2) {
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 8))
                                Text("Debes \(entry.formatAmount(entry.youOwe))")
                                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                            }
                            .foregroundColor(.widgetNegative)
                        }
                        if entry.owedToYou > 0 {
                            HStack(spacing: 2) {
                                Image(systemName: "arrow.down.left")
                                    .font(.system(size: 8))
                                Text("Te deben \(entry.formatAmount(entry.owedToYou))")
                                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                            }
                            .foregroundColor(.widgetPositive)
                        }
                        if entry.youOwe == 0 && entry.owedToYou == 0 && entry.eventsCount > 0 {
                            HStack(spacing: 2) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 8))
                                Text("Al día")
                                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                            }
                            .foregroundColor(.widgetPositive)
                        }
                    }
                    .padding(.top, 4)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            }
            
            // Divider
            RoundedRectangle(cornerRadius: 1)
                .fill(Color.secondary.opacity(0.2))
                .frame(width: 1)
                .padding(.vertical, 8)
                .padding(.horizontal, 10)
            
            // Right column - Stats + actions
            VStack(alignment: .leading, spacing: 8) {
                Link(destination: URL(string: "lessmo://events")!) {
                    HStack(spacing: 6) {
                        Image(systemName: "calendar")
                            .font(.system(size: 11))
                            .foregroundColor(.orange)
                            .frame(width: 14)
                        VStack(alignment: .leading, spacing: 0) {
                            Text("Eventos")
                                .font(.system(size: 9, weight: .medium, design: .rounded))
                                .foregroundColor(.secondary)
                            Text("\(entry.eventsCount) activo\(entry.eventsCount == 1 ? "" : "s")")
                                .font(.system(size: 12, weight: .bold, design: .rounded))
                        }
                    }
                }
                
                Link(destination: URL(string: "lessmo://dashboard")!) {
                    HStack(spacing: 6) {
                        Image(systemName: "creditcard.fill")
                            .font(.system(size: 11))
                            .foregroundColor(.widgetAccent)
                            .frame(width: 14)
                        VStack(alignment: .leading, spacing: 0) {
                            Text("Este mes")
                                .font(.system(size: 9, weight: .medium, design: .rounded))
                                .foregroundColor(.secondary)
                            Text(entry.formatAmount(entry.monthTotal))
                                .font(.system(size: 12, weight: .bold, design: .rounded))
                        }
                    }
                }
                
                if entry.budget > 0 {
                    Link(destination: URL(string: "lessmo://events")!) {
                        HStack(spacing: 6) {
                            Image(systemName: "gauge.medium")
                                .font(.system(size: 11))
                                .foregroundColor(entry.budgetProgress > 0.8 ? .widgetNegative : .widgetPositive)
                                .frame(width: 14)
                            VStack(alignment: .leading, spacing: 0) {
                                Text("Presupuesto")
                                    .font(.system(size: 9, weight: .medium, design: .rounded))
                                    .foregroundColor(.secondary)
                                Text("\(entry.formatAmount(entry.budgetRemaining)) libre")
                                    .font(.system(size: 12, weight: .bold, design: .rounded))
                            }
                        }
                    }
                } else {
                    Link(destination: URL(string: "lessmo://add-expense")!) {
                        HStack(spacing: 6) {
                            Image(systemName: "bolt.fill")
                                .font(.system(size: 11))
                                .foregroundColor(.purple)
                                .frame(width: 14)
                            VStack(alignment: .leading, spacing: 0) {
                                Text("Rápido")
                                    .font(.system(size: 9, weight: .medium, design: .rounded))
                                    .foregroundColor(.secondary)
                                Text("Añadir gasto")
                                    .font(.system(size: 12, weight: .bold, design: .rounded))
                            }
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
        .padding(14)
    }
}

// MARK: - Large Widget
struct LessmoWidgetEntryViewLarge: View {
    var entry: SimpleEntry

    var body: some View {
        if entry.isEmpty {
            emptyState
        } else {
            dataView
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.bar.doc.horizontal.fill")
                .font(.system(size: 44))
                .foregroundStyle(.linearGradient(
                    colors: [.widgetAccent, .purple],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                ))
            Text("¡Bienvenido a LessMo!")
                .font(.system(size: 18, weight: .bold, design: .rounded))
            Text("Crea tu primer evento o\nañade un gasto rápido")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            HStack(spacing: 12) {
                Link(destination: URL(string: "lessmo://create-event")!) {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar.badge.plus")
                            .font(.system(size: 12))
                        Text("Crear evento")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                    }
                    .foregroundColor(.widgetAccent)
                }
                
                Link(destination: URL(string: "lessmo://add-expense")!) {
                    HStack(spacing: 4) {
                        Image(systemName: "bolt.circle.fill")
                            .font(.system(size: 12))
                        Text("Gasto rápido")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                    }
                    .foregroundColor(.widgetAccent)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var dataView: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            Link(destination: URL(string: "lessmo://dashboard")!) {
                HStack {
                    HStack(spacing: 8) {
                        Image(systemName: "chart.pie.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(.linearGradient(
                                colors: [.widgetAccent, .purple],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            ))
                        Text("LessMo")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                    }
                    Spacer()
                    if !entry.lastUpdateText.isEmpty {
                        Text(entry.lastUpdateText)
                            .font(.system(size: 10, weight: .medium, design: .rounded))
                            .foregroundColor(.secondary.opacity(0.7))
                    }
                }
            }
            
            // Gastado este mes + events info
            Link(destination: URL(string: "lessmo://dashboard")!) {
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Gastado este mes")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundColor(.secondary)
                            .padding(.top, 8)
                        HStack(alignment: .firstTextBaseline, spacing: 2) {
                            Text(String(format: "%.2f", entry.monthTotal))
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                            Text(entry.currencySymbol)
                                .font(.system(size: 14, weight: .semibold, design: .rounded))
                        }
                        .foregroundColor(.primary)
                    }
                    
                    Spacer()
                    
                    // Right side: events info
                    VStack(alignment: .trailing, spacing: 2) {
                        if entry.eventsCount > 0 {
                            Text("\(entry.eventsCount) evento\(entry.eventsCount == 1 ? "" : "s")")
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .foregroundColor(.secondary)
                        }
                        Text("\(entry.monthExpenses) gasto\(entry.monthExpenses == 1 ? "" : "s")")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                    }
                }
            }
            
            // Debts row
            HStack(spacing: 16) {
                if entry.owedToYou > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.down.left")
                            .font(.system(size: 9))
                        Text("Te deben \(entry.formatAmount(entry.owedToYou))")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                    }
                    .foregroundColor(.widgetPositive)
                }
                if entry.youOwe > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.up.right")
                            .font(.system(size: 9))
                        Text("Debes \(entry.formatAmount(entry.youOwe))")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                    }
                    .foregroundColor(.widgetNegative)
                }
                if entry.youOwe == 0 && entry.owedToYou == 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 10))
                        Text("Estás al día")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                    }
                    .foregroundColor(.widgetPositive)
                }
            }
            .padding(.top, 6)
            
            // Budget progress bar (if budget set)
            if entry.budget > 0 {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Presupuesto")
                            .font(.system(size: 10, weight: .medium, design: .rounded))
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(entry.formatAmount(entry.budgetRemaining)) restante")
                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                            .foregroundColor(entry.budgetProgress > 0.8 ? .widgetNegative : .widgetPositive)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.secondary.opacity(0.15))
                                .frame(height: 6)
                            RoundedRectangle(cornerRadius: 3)
                                .fill(entry.budgetProgress > 0.8
                                    ? Color.widgetNegative
                                    : entry.budgetProgress > 0.5
                                        ? Color.orange
                                        : Color.widgetPositive)
                                .frame(width: geo.size.width * entry.budgetProgress, height: 6)
                        }
                    }
                    .frame(height: 6)
                }
                .padding(.top, 8)
            }
            
            // Divider
            RoundedRectangle(cornerRadius: 1)
                .fill(Color.secondary.opacity(0.15))
                .frame(height: 1)
                .padding(.top, 10)
            
            // Recent expenses section
            if !entry.recentExpenses.isEmpty {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Últimos gastos")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundColor(.secondary)
                        .padding(.top, 8)
                        .padding(.bottom, 6)
                    
                    ForEach(entry.recentExpenses.prefix(3)) { expense in
                        HStack(spacing: 8) {
                            Image(systemName: expense.categoryIcon)
                                .font(.system(size: 10))
                                .foregroundColor(.widgetAccent)
                                .frame(width: 16, height: 16)
                            
                            Text(expense.description)
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .lineLimit(1)
                            
                            Spacer()
                            
                            Text(entry.formatAmount(expense.amount))
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                        }
                        .padding(.vertical, 3)
                    }
                }
            } else {
                Spacer()
                HStack {
                    Spacer()
                    VStack(spacing: 4) {
                        Image(systemName: "tray")
                            .font(.system(size: 16))
                            .foregroundColor(.secondary.opacity(0.5))
                        Text("Sin gastos recientes")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundColor(.secondary.opacity(0.5))
                    }
                    Spacer()
                }
            }
            
            Spacer()
            
            // Bottom action bar
            HStack(spacing: 8) {
                Link(destination: URL(string: "lessmo://add-expense")!) {
                    HStack(spacing: 4) {
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 11))
                        Text("Añadir gasto")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(
                        LinearGradient(
                            colors: [.widgetAccent, .purple],
                            startPoint: .leading, endPoint: .trailing
                        )
                    )
                    .cornerRadius(8)
                }
                
                Link(destination: URL(string: "lessmo://events")!) {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .font(.system(size: 11))
                        Text("Eventos")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                    }
                    .foregroundColor(.widgetAccent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(Color.widgetAccent.opacity(0.12))
                    .cornerRadius(8)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

// MARK: - Reusable Components
struct StatRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundColor(color)
                .frame(width: 16)
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
            }
        }
    }
}

struct StatCard: View {
    let icon: String
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundColor(.secondary)
            Text(value)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color.widgetCard.opacity(0.6))
        .cornerRadius(10)
    }
}

// MARK: - Main View Switcher
struct LessmoWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: SimpleEntry

    var body: some View {
        switch family {
        case .systemSmall:
            LessmoWidgetEntryViewSmall(entry: entry)
        case .systemMedium:
            LessmoWidgetEntryViewMedium(entry: entry)
        case .systemLarge:
            LessmoWidgetEntryViewLarge(entry: entry)
        default:
            LessmoWidgetEntryViewSmall(entry: entry)
        }
    }
}

// MARK: - Widget Definition
struct LessmoWidget: Widget {
    let kind: String = "LessmoWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                LessmoWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                LessmoWidgetEntryView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("LessMo")
        .description("Balance y gastos de tu evento actual")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Previews
struct LessmoWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            LessmoWidgetEntryViewSmall(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Small")
            
            LessmoWidgetEntryViewMedium(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium")
            
            LessmoWidgetEntryViewLarge(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemLarge))
                .previewDisplayName("Large")
            
            LessmoWidgetEntryViewSmall(entry: .empty)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Small - Empty")
        }
    }
}
