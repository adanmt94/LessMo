import AppIntents
import Foundation

/**
 * LessMo App Intents - Integración con Siri y Atajos
 * 
 * Permite:
 * - "Oye Siri, añade un gasto de 15€ en comida"
 * - "Oye Siri, gasto rápido en LessMo"
 * - "Oye Siri, ¿cuánto he gastado este mes?"
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

// MARK: - Add Expense Intent
@available(iOS 16.0, *)
struct AddExpenseIntent: AppIntent {
    static var title: LocalizedStringResource = "Añadir gasto"
    static var description: IntentDescription = IntentDescription(
        "Añade un gasto rápidamente a LessMo",
        categoryName: "Gastos"
    )
    
    /// Opens the app to confirm before saving
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
        // Build deep link with params
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
        
        // The app will open via the deep link and show QuickExpenseScreen
        if let url = URL(string: urlString) {
            // Store the URL for the app to pick up
            let defaults = UserDefaults(suiteName: "group.com.lessmo.app.widgets")
            defaults?.set(urlString, forKey: "pendingIntentURL")
            defaults?.synchronize()
        }
        
        return .result()
    }
}

// MARK: - View Summary Intent
@available(iOS 16.0, *)
struct ViewSummaryIntent: AppIntent {
    static var title: LocalizedStringResource = "Ver resumen de gastos"
    static var description: IntentDescription = IntentDescription(
        "Ver cuánto has gastado este mes",
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

// MARK: - Quick View Intent (doesn't open app - returns info via Siri)
@available(iOS 16.0, *)
struct MonthlySpendingIntent: AppIntent {
    static var title: LocalizedStringResource = "¿Cuánto he gastado este mes?"
    static var description: IntentDescription = IntentDescription(
        "Consulta tu gasto mensual sin abrir la app",
        categoryName: "Gastos"
    )
    
    static var openAppWhenRun: Bool = false
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Read from shared UserDefaults (widget data)
        guard let defaults = UserDefaults(suiteName: "group.com.lessmo.app.widgets"),
              let rawValue = defaults.string(forKey: "widgetData"),
              let jsonData = rawValue.data(using: .utf8),
              let widgetData = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
            return .result(dialog: "No tengo datos disponibles. Abre LessMo primero para sincronizar.")
        }
        
        let monthTotal = widgetData["monthTotal"] as? Double ?? 0
        let monthExpenses = widgetData["monthExpenses"] as? Int ?? 0
        let currency = widgetData["currency"] as? String ?? "EUR"
        let youOwe = widgetData["youOwe"] as? Double ?? 0
        let owedToYou = widgetData["owedToYou"] as? Double ?? 0
        
        let symbol: String
        switch currency {
        case "USD": symbol = "$"
        case "GBP": symbol = "£"
        case "MXN": symbol = "$"
        default: symbol = "€"
        }
        
        var response = "Este mes llevas \(String(format: "%.2f", monthTotal))\(symbol) en \(monthExpenses) gasto\(monthExpenses == 1 ? "" : "s")."
        
        if youOwe > 0 {
            response += " Debes \(String(format: "%.2f", youOwe))\(symbol)."
        }
        if owedToYou > 0 {
            response += " Te deben \(String(format: "%.2f", owedToYou))\(symbol)."
        }
        
        return .result(dialog: IntentDialog(stringLiteral: response))
    }
}

// MARK: - App Shortcuts Provider (iOS 16+)
@available(iOS 16.0, *)
struct LessmoShortcutsProvider: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddExpenseIntent(),
            phrases: [
                "Añadir gasto en \(.applicationName)",
                "Gasto rápido en \(.applicationName)",
                "Añade un gasto de \(\.$amount) en \(.applicationName)",
                "Registrar gasto en \(.applicationName)",
                "Nuevo gasto en \(.applicationName)",
                "Apuntar gasto en \(.applicationName)",
            ],
            shortTitle: "Añadir gasto",
            systemImageName: "plus.circle.fill"
        )
        
        AppShortcut(
            intent: MonthlySpendingIntent(),
            phrases: [
                "¿Cuánto he gastado en \(.applicationName)?",
                "¿Cuánto llevo gastado este mes en \(.applicationName)?",
                "Resumen de gastos en \(.applicationName)",
                "Mis gastos en \(.applicationName)",
            ],
            shortTitle: "Ver gastos del mes",
            systemImageName: "chart.pie.fill"
        )
        
        AppShortcut(
            intent: ViewSummaryIntent(),
            phrases: [
                "Abrir resumen en \(.applicationName)",
                "Ver balance en \(.applicationName)",
                "¿Cuánto debo en \(.applicationName)?",
            ],
            shortTitle: "Ver resumen",
            systemImageName: "chart.bar.fill"
        )
    }
}
