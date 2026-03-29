import WidgetKit
import SwiftUI

/**
 * LessmoWidget - Widget nativo para iOS
 * Diseño moderno 2025 con glassmorphism y gradientes
 */

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
            pendingPayments: 45.0
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
            pendingPayments: 0
        )
    }
    
    var isEmpty: Bool { eventName.isEmpty || eventName == "Sin eventos" || eventName == "No hay eventos" }
    
    var currencySymbol: String {
        switch currency {
        case "USD": return "$"
        case "GBP": return "£"
        case "MXN": return "$"
        default: return "€"
        }
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
            
            entry = SimpleEntry(
                date: Date(),
                eventName: widgetData["eventName"] as? String ?? "Sin eventos",
                totalExpenses: widgetData["totalExpenses"] as? Double ?? 0.0,
                userBalance: widgetData["userBalance"] as? Double ?? 0.0,
                participantsCount: widgetData["participantsCount"] as? Int ?? 0,
                currency: widgetData["currency"] as? String ?? "EUR",
                monthTotal: widgetData["monthTotal"] as? Double ?? 0.0,
                monthExpenses: widgetData["monthExpenses"] as? Int ?? 0,
                pendingPayments: widgetData["pendingPayments"] as? Double ?? 0.0
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
    static let widgetCard = Color(UIColor.secondarySystemGroupedBackground)
}

// MARK: - Small Widget
struct LessmoWidgetEntryViewSmall: View {
    var entry: SimpleEntry

    var body: some View {
        if entry.isEmpty {
            emptyState
        } else {
            dataView
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "plus.circle.fill")
                .font(.system(size: 32))
                .foregroundStyle(.linearGradient(
                    colors: [.widgetAccent, .widgetAccent.opacity(0.6)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                ))
            Text("Añadir evento")
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var dataView: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 6) {
                Image(systemName: "chart.pie.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(.linearGradient(
                        colors: [.widgetAccent, .purple],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    ))
                Text("LessMo")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundColor(.secondary)
                Spacer()
            }
            
            Spacer()
            
            Text(entry.eventName)
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundColor(.secondary)
                .lineLimit(1)
            
            HStack(alignment: .firstTextBaseline, spacing: 1) {
                Text(entry.userBalance >= 0 ? "+" : "")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                Text(String(format: "%.2f", abs(entry.userBalance)))
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                Text(entry.currencySymbol)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
            }
            .foregroundColor(entry.userBalance >= 0 ? .widgetPositive : .widgetNegative)
            .padding(.top, 2)
            
            HStack(spacing: 4) {
                Image(systemName: "person.2.fill")
                    .font(.system(size: 9))
                Text("\(entry.participantsCount)")
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
            }
            .foregroundColor(.secondary)
            .padding(.top, 4)
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
            Image(systemName: "plus.circle.fill")
                .font(.system(size: 40))
                .foregroundStyle(.linearGradient(
                    colors: [.widgetAccent, .widgetAccent.opacity(0.6)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                ))
            VStack(alignment: .leading, spacing: 4) {
                Text("Crea un evento")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                Text("Empieza a gestionar gastos compartidos")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var dataView: some View {
        HStack(spacing: 0) {
            // Left column - Balance
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 6) {
                    Image(systemName: "chart.pie.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(.linearGradient(
                            colors: [.widgetAccent, .purple],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ))
                    Text("LessMo")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(entry.eventName)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                
                HStack(alignment: .firstTextBaseline, spacing: 1) {
                    Text(entry.userBalance >= 0 ? "+" : "")
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                    Text(String(format: "%.2f", abs(entry.userBalance)))
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                    Text(entry.currencySymbol)
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                }
                .foregroundColor(entry.userBalance >= 0 ? .widgetPositive : .widgetNegative)
                .padding(.top, 2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            
            // Divider
            RoundedRectangle(cornerRadius: 1)
                .fill(Color.secondary.opacity(0.2))
                .frame(width: 1)
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
            
            // Right column - Stats
            VStack(alignment: .leading, spacing: 10) {
                StatRow(
                    icon: "creditcard.fill",
                    label: "Este mes",
                    value: String(format: "%.0f%@", entry.monthTotal, entry.currencySymbol),
                    color: .widgetAccent
                )
                
                StatRow(
                    icon: "arrow.up.arrow.down",
                    label: "Gastos",
                    value: "\(entry.monthExpenses)",
                    color: .orange
                )
                
                StatRow(
                    icon: "person.2.fill",
                    label: "Personas",
                    value: "\(entry.participantsCount)",
                    color: .purple
                )
            }
            .frame(maxWidth: .infinity, alignment: .leading)
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
                .font(.system(size: 48))
                .foregroundStyle(.linearGradient(
                    colors: [.widgetAccent, .purple],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                ))
            Text("¡Bienvenido a LessMo!")
                .font(.system(size: 18, weight: .bold, design: .rounded))
            Text("Crea tu primer evento para ver\ntus gastos aquí")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var dataView: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "chart.pie.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(.linearGradient(
                            colors: [.widgetAccent, .purple],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ))
                    Text("LessMo")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                }
                Spacer()
                Text(entry.date, style: .time)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundColor(.secondary)
            }
            
            // Event name
            Text(entry.eventName)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundColor(.secondary)
                .lineLimit(1)
                .padding(.top, 8)
            
            Spacer()
            
            // Main balance card
            VStack(alignment: .leading, spacing: 4) {
                Text("Tu balance")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundColor(.secondary)
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(entry.userBalance >= 0 ? "+" : "")
                        .font(.system(size: 18, weight: .medium, design: .rounded))
                    Text(String(format: "%.2f", abs(entry.userBalance)))
                        .font(.system(size: 38, weight: .bold, design: .rounded))
                    Text(entry.currencySymbol)
                        .font(.system(size: 18, weight: .semibold, design: .rounded))
                }
                .foregroundColor(entry.userBalance >= 0 ? .widgetPositive : .widgetNegative)
            }
            
            Spacer()
            
            // Stats grid
            HStack(spacing: 12) {
                StatCard(
                    icon: "creditcard.fill",
                    label: "Gastos mes",
                    value: String(format: "%.0f%@", entry.monthTotal, entry.currencySymbol),
                    color: .widgetAccent
                )
                
                StatCard(
                    icon: "person.2.fill",
                    label: "Personas",
                    value: "\(entry.participantsCount)",
                    color: .purple
                )
                
                if entry.pendingPayments > 0 {
                    StatCard(
                        icon: "exclamationmark.circle.fill",
                        label: "Pendiente",
                        value: String(format: "%.0f%@", entry.pendingPayments, entry.currencySymbol),
                        color: .widgetNegative
                    )
                } else {
                    StatCard(
                        icon: "checkmark.circle.fill",
                        label: "Estado",
                        value: "Al día",
                        color: .widgetPositive
                    )
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
