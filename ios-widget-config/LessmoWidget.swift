import WidgetKit
import SwiftUI

/**
 * LessmoWidget - Widget nativo para iOS
 * Muestra el resumen de gastos del evento más reciente
 */
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(
            date: Date(),
            eventName: "Viaje a Madrid",
            totalExpenses: 450.50,
            userBalance: -125.30,
            participantsCount: 5
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(
            date: Date(),
            eventName: "Viaje a Madrid",
            totalExpenses: 450.50,
            userBalance: -125.30,
            participantsCount: 5
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []
        
        // Leer datos compartidos desde el App Group
        if let sharedDefaults = UserDefaults(suiteName: "group.com.lessmo.app.widgets"),
           let widgetData = sharedDefaults.dictionary(forKey: "widgetData") {
            
            let eventName = widgetData["eventName"] as? String ?? "Sin eventos"
            let totalExpenses = widgetData["totalExpenses"] as? Double ?? 0.0
            let userBalance = widgetData["userBalance"] as? Double ?? 0.0
            let participantsCount = widgetData["participantsCount"] as? Int ?? 0
            
            let entry = SimpleEntry(
                date: Date(),
                eventName: eventName,
                totalExpenses: totalExpenses,
                userBalance: userBalance,
                participantsCount: participantsCount
            )
            entries.append(entry)
        } else {
            // Datos de ejemplo si no hay datos reales
            let entry = SimpleEntry(
                date: Date(),
                eventName: "No hay eventos",
                totalExpenses: 0.0,
                userBalance: 0.0,
                participantsCount: 0
            )
            entries.append(entry)
        }

        // Actualizar cada 15 minutos
        let currentDate = Date()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: entries, policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let eventName: String
    let totalExpenses: Double
    let userBalance: Double
    let participantsCount: Int
}

/**
 * Vista del Widget - Small (systemSmall)
 */
struct LessmoWidgetEntryViewSmall: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Header
            HStack {
                Image(systemName: "eurosign.circle.fill")
                    .foregroundColor(.blue)
                    .font(.system(size: 20))
                Text("LessMo")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.primary)
            }
            
            Spacer()
            
            // Evento
            Text(entry.eventName)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.secondary)
                .lineLimit(1)
            
            // Balance
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(entry.userBalance >= 0 ? "+" : "")
                    .font(.system(size: 12))
                Text(String(format: "%.2f", entry.userBalance))
                    .font(.system(size: 20, weight: .bold))
                Text("€")
                    .font(.system(size: 12))
            }
            .foregroundColor(entry.userBalance >= 0 ? .green : .red)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

/**
 * Vista del Widget - Medium (systemMedium)
 */
struct LessmoWidgetEntryViewMedium: View {
    var entry: Provider.Entry

    var body: some View {
        HStack(spacing: 16) {
            // Columna izquierda
            VStack(alignment: .leading, spacing: 8) {
                // Header
                HStack {
                    Image(systemName: "eurosign.circle.fill")
                        .foregroundColor(.blue)
                        .font(.system(size: 24))
                    Text("LessMo")
                        .font(.system(size: 16, weight: .bold))
                }
                
                Spacer()
                
                // Evento
                Text(entry.eventName)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                // Balance
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(entry.userBalance >= 0 ? "+" : "")
                        .font(.system(size: 14))
                    Text(String(format: "%.2f", entry.userBalance))
                        .font(.system(size: 24, weight: .bold))
                    Text("€")
                        .font(.system(size: 14))
                }
                .foregroundColor(entry.userBalance >= 0 ? .green : .red)
            }
            
            // Columna derecha
            VStack(alignment: .leading, spacing: 12) {
                // Total gastos
                VStack(alignment: .leading, spacing: 4) {
                    Text("Total gastos")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text(String(format: "%.2f", entry.totalExpenses))
                            .font(.system(size: 18, weight: .semibold))
                        Text("€")
                            .font(.system(size: 11))
                    }
                }
                
                // Participantes
                HStack(spacing: 4) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                    Text("\(entry.participantsCount)")
                        .font(.system(size: 16, weight: .semibold))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
    }
}

/**
 * Vista del Widget - Large (systemLarge)
 */
struct LessmoWidgetEntryViewLarge: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Image(systemName: "eurosign.circle.fill")
                    .foregroundColor(.blue)
                    .font(.system(size: 32))
                Text("LessMo")
                    .font(.system(size: 20, weight: .bold))
                Spacer()
                Text(entry.date, style: .time)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            
            Divider()
            
            // Evento
            VStack(alignment: .leading, spacing: 4) {
                Text("Evento actual")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                Text(entry.eventName)
                    .font(.system(size: 18, weight: .semibold))
                    .lineLimit(2)
            }
            
            Spacer()
            
            // Balance principal
            VStack(alignment: .leading, spacing: 4) {
                Text("Tu balance")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(entry.userBalance >= 0 ? "+" : "")
                        .font(.system(size: 20))
                    Text(String(format: "%.2f", entry.userBalance))
                        .font(.system(size: 40, weight: .bold))
                    Text("€")
                        .font(.system(size: 20))
                }
                .foregroundColor(entry.userBalance >= 0 ? .green : .red)
            }
            
            Spacer()
            
            // Estadísticas
            HStack(spacing: 24) {
                // Total gastos
                VStack(alignment: .leading, spacing: 4) {
                    Text("Total gastos")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text(String(format: "%.2f", entry.totalExpenses))
                            .font(.system(size: 20, weight: .semibold))
                        Text("€")
                            .font(.system(size: 11))
                    }
                }
                
                // Participantes
                VStack(alignment: .leading, spacing: 4) {
                    Text("Participantes")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                    HStack(spacing: 4) {
                        Image(systemName: "person.2.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.blue)
                        Text("\(entry.participantsCount)")
                            .font(.system(size: 20, weight: .semibold))
                    }
                }
            }
        }
        .padding()
    }
}

/**
 * Definición del Widget con soporte para 3 tamaños
 */
@main
struct LessmoWidget: Widget {
    let kind: String = "LessmoWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                // iOS 17+ usa ContainerBackground
                GeometryReader { geometry in
                    if geometry.size.width < 200 {
                        LessmoWidgetEntryViewSmall(entry: entry)
                            .containerBackground(.fill.tertiary, for: .widget)
                    } else if geometry.size.width < 400 {
                        LessmoWidgetEntryViewMedium(entry: entry)
                            .containerBackground(.fill.tertiary, for: .widget)
                    } else {
                        LessmoWidgetEntryViewLarge(entry: entry)
                            .containerBackground(.fill.tertiary, for: .widget)
                    }
                }
            } else {
                // iOS 14-16 usa padding manual
                GeometryReader { geometry in
                    if geometry.size.width < 200 {
                        LessmoWidgetEntryViewSmall(entry: entry)
                    } else if geometry.size.width < 400 {
                        LessmoWidgetEntryViewMedium(entry: entry)
                    } else {
                        LessmoWidgetEntryViewLarge(entry: entry)
                    }
                }
            }
        }
        .configurationDisplayName("LessMo Widget")
        .description("Consulta rápidamente el balance de tu evento actual")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

/**
 * Preview para desarrollo
 */
struct LessmoWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Small
            LessmoWidgetEntryViewSmall(entry: SimpleEntry(
                date: Date(),
                eventName: "Viaje a Madrid",
                totalExpenses: 450.50,
                userBalance: -125.30,
                participantsCount: 5
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            
            // Medium
            LessmoWidgetEntryViewMedium(entry: SimpleEntry(
                date: Date(),
                eventName: "Cena de cumpleaños",
                totalExpenses: 280.00,
                userBalance: 45.50,
                participantsCount: 8
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            
            // Large
            LessmoWidgetEntryViewLarge(entry: SimpleEntry(
                date: Date(),
                eventName: "Fin de semana en la playa",
                totalExpenses: 1200.00,
                userBalance: -350.75,
                participantsCount: 12
            ))
            .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }
}
