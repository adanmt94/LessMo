import AppIntents
import Foundation

/**
 * LessMo App Intents - Integración completa con Siri y Atajos
 * 
 * Intents disponibles:
 * - AddExpenseIntent: Añadir gasto con importe, descripción, categoría
 * - MonthlySpendingIntent: Consultar gasto mensual sin abrir la app
 * - ViewSummaryIntent: Abrir resumen/dashboard
 * - ViewDebtsIntent: Consultar deudas pendientes sin abrir la app
 * - CreateEventIntent: Crear un evento nuevo
 * - OpenEventIntent: Abrir un evento por nombre
 * 
 * Requiere iOS 16+
 */

// MARK: - Category Enum for Siri
@available(iOS 16.0, *)
enum ExpenseCategoryIntent: String, AppEnum {
    case food = "food"
    case transport = "transport"
    case shopping = "shopping"
    case entertainment = "entertainment"
    case health = "health"
    case accommodation = "accommodation"
    case other = "other"
    
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Categoría"
    
    static var caseDisplayRepresentations: [ExpenseCategoryIntent: DisplayRepresentation] = [
        .food: DisplayRepresentation(title: "Comida", subtitle: "Restaurantes, supermercados"),
        .transport: DisplayRepresentation(title: "Transporte", subtitle: "Taxi, metro, gasolina"),
        .shopping: DisplayRepresentation(title: "Compras", subtitle: "Ropa, electrónica"),
        .entertainment: DisplayRepresentation(title: "Ocio", subtitle: "Cine, conciertos"),
        .health: DisplayRepresentation(title: "Salud", subtitle: "Farmacia, médico"),
        .accommodation: DisplayRepresentation(title: "Alojamiento", subtitle: "Hotel, Airbnb"),
        .other: DisplayRepresentation(title: "Otro", subtitle: "Otros gastos"),
    ]
}

// MARK: - Helper: Read widget data
@available(iOS 16.0, *)
func readWidgetData() -> [String: Any]? {
    guard let defaults = UserDefaults(suiteName: "group.com.lessmo.app.widgets"),
          let rawValue = defaults.string(forKey: "widgetData"),
          let jsonData = rawValue.data(using: .utf8),
          let widgetData = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
        return nil
    }
    return widgetData
}

@available(iOS 16.0, *)
func currencySymbol(for code: String) -> String {
    switch code {
    case "USD", "MXN", "ARS", "COP", "CLP": return "$"
    case "GBP": return "£"
    case "JPY", "CNY": return "¥"
    case "BRL": return "R$"
    case "CHF": return "Fr"
    case "SEK", "NOK", "DKK", "ISK": return "kr"
    case "PLN": return "zł"
    case "TRY": return "₺"
    case "INR": return "₹"
    case "KRW": return "₩"
    case "RUB": return "₽"
    default: return "€"
    }
}

// MARK: - Add Expense Intent
@available(iOS 16.0, *)
struct AddExpenseIntent: AppIntent {
    static var title: LocalizedStringResource = "Añadir gasto"
    static var description: IntentDescription = IntentDescription(
        "Añade un gasto rápidamente a LessMo",
        categoryName: "Gastos"
    )
    
    static var openAppWhenRun: Bool = true
    
    @Parameter(title: "Importe", description: "Cantidad del gasto en tu moneda")
    var amount: Double?
    
    @Parameter(title: "Descripción", description: "Descripción del gasto (ej: Café, Taxi)")
    var expenseDescription: String?
    
    @Parameter(title: "Categoría", description: "Categoría del gasto")
    var category: ExpenseCategoryIntent?
    
    static var parameterSummary: some ParameterSummary {
        Summary("Añadir gasto de \(\.$amount) en \(\.$category)") {
            \.$expenseDescription
        }
    }
    
    func perform() async throws -> some IntentResult & OpensIntent {
        var urlString = "lessmo://quick-expense?"
        var params: [String] = []
        
        if let amount = amount {
            params.append("amount=\(amount)")
        }
        if let desc = expenseDescription, !desc.isEmpty {
            let encoded = desc.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? desc
            params.append("description=\(encoded)")
        }
        if let cat = category {
            params.append("category=\(cat.rawValue)")
        }
        
        urlString += params.joined(separator: "&")
        
        let defaults = UserDefaults(suiteName: "group.com.lessmo.app.widgets")
        defaults?.set(urlString, forKey: "pendingIntentURL")
        defaults?.synchronize()
        
        return .result()
    }
}

// MARK: - Monthly Spending Intent (Siri responds without opening app)
@available(iOS 16.0, *)
struct MonthlySpendingIntent: AppIntent {
    static var title: LocalizedStringResource = "¿Cuánto he gastado este mes?"
    static var description: IntentDescription = IntentDescription(
        "Consulta tu gasto mensual sin abrir la app",
        categoryName: "Gastos"
    )
    
    static var openAppWhenRun: Bool = false
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let widgetData = readWidgetData() else {
            return .result(dialog: "No tengo datos disponibles. Abre LessMo primero para sincronizar.")
        }
        
        let monthTotal = widgetData["monthTotal"] as? Double ?? 0
        let monthExpenses = widgetData["monthExpenses"] as? Int ?? 0
        let currency = widgetData["currency"] as? String ?? "EUR"
        let youOwe = widgetData["youOwe"] as? Double ?? 0
        let owedToYou = widgetData["owedToYou"] as? Double ?? 0
        let symbol = currencySymbol(for: currency)
        
        var response = "Este mes llevas \(String(format: "%.2f", monthTotal))\(symbol) en \(monthExpenses) gasto\(monthExpenses == 1 ? "" : "s")."
        
        if youOwe > 0 {
            response += " Debes \(String(format: "%.2f", youOwe))\(symbol)."
        }
        if owedToYou > 0 {
            response += " Te deben \(String(format: "%.2f", owedToYou))\(symbol)."
        }
        if youOwe == 0 && owedToYou == 0 {
            response += " Estás al día, no debes nada."
        }
        
        return .result(dialog: IntentDialog(stringLiteral: response))
    }
}

// MARK: - View Debts Intent (Siri responds without opening app)
@available(iOS 16.0, *)
struct ViewDebtsIntent: AppIntent {
    static var title: LocalizedStringResource = "¿Cuánto debo?"
    static var description: IntentDescription = IntentDescription(
        "Consulta tus deudas pendientes sin abrir la app",
        categoryName: "Gastos"
    )
    
    static var openAppWhenRun: Bool = false
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let widgetData = readWidgetData() else {
            return .result(dialog: "No tengo datos. Abre LessMo primero.")
        }
        
        let currency = widgetData["currency"] as? String ?? "EUR"
        let youOwe = widgetData["youOwe"] as? Double ?? 0
        let owedToYou = widgetData["owedToYou"] as? Double ?? 0
        let eventsCount = widgetData["eventsCount"] as? Int ?? 0
        let symbol = currencySymbol(for: currency)
        
        var response = ""
        if youOwe > 0 && owedToYou > 0 {
            response = "Debes \(String(format: "%.2f", youOwe))\(symbol) y te deben \(String(format: "%.2f", owedToYou))\(symbol)."
        } else if youOwe > 0 {
            response = "Debes \(String(format: "%.2f", youOwe))\(symbol) en tus eventos."
        } else if owedToYou > 0 {
            response = "Te deben \(String(format: "%.2f", owedToYou))\(symbol). ¡Estás al día con tus pagos!"
        } else {
            response = "No tienes deudas pendientes. ¡Estás al día!"
        }
        
        if eventsCount > 0 {
            response += " Tienes \(eventsCount) evento\(eventsCount == 1 ? " activo" : "s activos")."
        }
        
        return .result(dialog: IntentDialog(stringLiteral: response))
    }
}

// MARK: - View Summary Intent (opens app)
@available(iOS 16.0, *)
struct ViewSummaryIntent: AppIntent {
    static var title: LocalizedStringResource = "Ver resumen de gastos"
    static var description: IntentDescription = IntentDescription(
        "Ver tu resumen de gastos y balance",
        categoryName: "Gastos"
    )
    
    static var openAppWhenRun: Bool = true
    
    func perform() async throws -> some IntentResult & OpensIntent {
        let defaults = UserDefaults(suiteName: "group.com.lessmo.app.widgets")
        defaults?.set("lessmo://dashboard", forKey: "pendingIntentURL")
        defaults?.synchronize()
        return .result()
    }
}

// MARK: - Create Event Intent (opens app)
@available(iOS 16.0, *)
struct CreateEventIntent: AppIntent {
    static var title: LocalizedStringResource = "Crear evento"
    static var description: IntentDescription = IntentDescription(
        "Crea un nuevo evento para compartir gastos",
        categoryName: "Eventos"
    )
    
    static var openAppWhenRun: Bool = true
    
    func perform() async throws -> some IntentResult & OpensIntent {
        let defaults = UserDefaults(suiteName: "group.com.lessmo.app.widgets")
        defaults?.set("lessmo://create-event", forKey: "pendingIntentURL")
        defaults?.synchronize()
        return .result()
    }
}

// MARK: - View Events Intent (opens app)
@available(iOS 16.0, *)
struct ViewEventsIntent: AppIntent {
    static var title: LocalizedStringResource = "Ver mis eventos"
    static var description: IntentDescription = IntentDescription(
        "Ver la lista de eventos activos",
        categoryName: "Eventos"
    )
    
    static var openAppWhenRun: Bool = true
    
    func perform() async throws -> some IntentResult & OpensIntent {
        let defaults = UserDefaults(suiteName: "group.com.lessmo.app.widgets")
        defaults?.set("lessmo://events", forKey: "pendingIntentURL")
        defaults?.synchronize()
        return .result()
    }
}

// MARK: - Budget Status Intent (Siri responds without opening app)
@available(iOS 16.0, *)
struct BudgetStatusIntent: AppIntent {
    static var title: LocalizedStringResource = "¿Cómo va mi presupuesto?"
    static var description: IntentDescription = IntentDescription(
        "Consulta el estado de tu presupuesto",
        categoryName: "Gastos"
    )
    
    static var openAppWhenRun: Bool = false
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let widgetData = readWidgetData() else {
            return .result(dialog: "No tengo datos. Abre LessMo primero.")
        }
        
        let budget = widgetData["budget"] as? Double ?? 0
        let monthTotal = widgetData["monthTotal"] as? Double ?? 0
        let currency = widgetData["currency"] as? String ?? "EUR"
        let symbol = currencySymbol(for: currency)
        
        if budget <= 0 {
            return .result(dialog: IntentDialog(stringLiteral: "No tienes un presupuesto configurado. Llevas \(String(format: "%.2f", monthTotal))\(symbol) gastados este mes."))
        }
        
        let remaining = budget - monthTotal
        let percentage = Int((monthTotal / budget) * 100)
        
        var response = "Tu presupuesto es de \(String(format: "%.2f", budget))\(symbol). "
        response += "Llevas \(String(format: "%.2f", monthTotal))\(symbol) gastados (\(percentage)%). "
        
        if remaining > 0 {
            response += "Te quedan \(String(format: "%.2f", remaining))\(symbol)."
        } else {
            response += "¡Cuidado! Has sobrepasado tu presupuesto por \(String(format: "%.2f", abs(remaining)))\(symbol)."
        }
        
        return .result(dialog: IntentDialog(stringLiteral: response))
    }
}

// MARK: - App Shortcuts Provider (iOS 16+)
@available(iOS 16.0, *)
struct LessmoShortcutsProvider: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        // 1. Añadir gasto
        AppShortcut(
            intent: AddExpenseIntent(),
            phrases: [
                "Añadir gasto en \(.applicationName)",
                "Gasto rápido en \(.applicationName)",
                "Registrar gasto en \(.applicationName)",
                "Nuevo gasto en \(.applicationName)",
                "Apuntar gasto en \(.applicationName)",
                "Anotar gasto en \(.applicationName)",
            ],
            shortTitle: "Añadir gasto",
            systemImageName: "plus.circle.fill"
        )
        
        // 2. Consultar gasto mensual (voz, sin abrir app)
        AppShortcut(
            intent: MonthlySpendingIntent(),
            phrases: [
                "¿Cuánto he gastado en \(.applicationName)?",
                "¿Cuánto llevo gastado este mes en \(.applicationName)?",
                "Resumen de gastos en \(.applicationName)",
                "Mis gastos en \(.applicationName)",
                "¿Cuánto llevo gastado en \(.applicationName)?",
                "Gastos del mes en \(.applicationName)",
            ],
            shortTitle: "Ver gastos del mes",
            systemImageName: "chart.pie.fill"
        )
        
        // 3. Consultar deudas (voz, sin abrir app)
        AppShortcut(
            intent: ViewDebtsIntent(),
            phrases: [
                "¿Cuánto debo en \(.applicationName)?",
                "Mis deudas en \(.applicationName)",
                "¿Qué debo en \(.applicationName)?",
                "¿Me deben algo en \(.applicationName)?",
                "Deudas pendientes en \(.applicationName)",
            ],
            shortTitle: "Ver deudas",
            systemImageName: "arrow.left.arrow.right"
        )
        
        // 4. Estado del presupuesto (voz, sin abrir app)
        AppShortcut(
            intent: BudgetStatusIntent(),
            phrases: [
                "¿Cómo va mi presupuesto en \(.applicationName)?",
                "Estado del presupuesto en \(.applicationName)",
                "¿Cuánto me queda de presupuesto en \(.applicationName)?",
                "Presupuesto en \(.applicationName)",
            ],
            shortTitle: "Ver presupuesto",
            systemImageName: "gauge.medium"
        )
        
        // 5. Abrir resumen (abre la app)
        AppShortcut(
            intent: ViewSummaryIntent(),
            phrases: [
                "Abrir resumen en \(.applicationName)",
                "Ver balance en \(.applicationName)",
                "Abrir \(.applicationName)",
                "Dashboard de \(.applicationName)",
            ],
            shortTitle: "Ver resumen",
            systemImageName: "chart.bar.fill"
        )
        
        // 6. Crear evento (abre la app)
        AppShortcut(
            intent: CreateEventIntent(),
            phrases: [
                "Crear evento en \(.applicationName)",
                "Nuevo evento en \(.applicationName)",
                "Nuevo viaje en \(.applicationName)",
            ],
            shortTitle: "Crear evento",
            systemImageName: "calendar.badge.plus"
        )
        
        // 7. Ver eventos (abre la app)
        AppShortcut(
            intent: ViewEventsIntent(),
            phrases: [
                "Mis eventos en \(.applicationName)",
                "Ver eventos en \(.applicationName)",
                "Eventos activos en \(.applicationName)",
            ],
            shortTitle: "Ver eventos",
            systemImageName: "calendar"
        )
    }
}
