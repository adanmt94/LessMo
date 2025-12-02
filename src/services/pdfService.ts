/**
 * PDF Service - Export event data to PDF
 * Generate formatted PDF reports with event summary, expenses, and settlements
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Event, Expense, Participant } from '../types';

export interface PDFExportOptions {
  includeExpenses: boolean;
  includeSettlements: boolean;
  includeStatistics: boolean;
  includePhotos: boolean;
  language: 'es' | 'en';
}

const defaultOptions: PDFExportOptions = {
  includeExpenses: true,
  includeSettlements: true,
  includeStatistics: true,
  includePhotos: false, // Photos increase file size significantly
  language: 'es',
};

/**
 * Export event to PDF
 */
export const exportEventToPDF = async (
  event: Event,
  expenses: Expense[],
  participants: Participant[],
  options: Partial<PDFExportOptions> = {}
): Promise<string> => {
  const opts = { ...defaultOptions, ...options };

  // Generate HTML content
  const html = generatePDFHTML(event, expenses, participants, opts);

  // Create PDF
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  return uri;
};

/**
 * Export and share PDF
 */
export const exportAndSharePDF = async (
  event: Event,
  expenses: Expense[],
  participants: Participant[],
  options: Partial<PDFExportOptions> = {}
): Promise<void> => {
  const uri = await exportEventToPDF(event, expenses, participants, options);

  // Check if sharing is available
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  // Share the PDF
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: options.language === 'es' 
      ? `Resumen - ${event.name}`
      : `Summary - ${event.name}`,
    UTI: 'com.adobe.pdf',
  });
};

/**
 * Generate HTML for PDF
 */
const generatePDFHTML = (
  event: Event,
  expenses: Expense[],
  participants: Participant[],
  options: PDFExportOptions
): string => {
  const { language } = options;

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalParticipants = participants.length;
  const averagePerPerson = totalParticipants > 0 ? totalExpenses / totalParticipants : 0;

  // Category breakdown
  const categoryTotals = new Map<string, number>();
  for (const expense of expenses) {
    const current = categoryTotals.get(expense.category) || 0;
    categoryTotals.set(expense.category, current + expense.amount);
  }

  // Calculate settlements
  const settlements = calculateSettlements(participants, expenses);

  // Format dates
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get category emoji and name
  const getCategoryInfo = (category: string) => {
    const categories: Record<string, { emoji: string; nameEs: string; nameEn: string }> = {
      food: { emoji: '🍔', nameEs: 'Comida', nameEn: 'Food' },
      transport: { emoji: '🚗', nameEs: 'Transporte', nameEn: 'Transport' },
      accommodation: { emoji: '🏨', nameEs: 'Alojamiento', nameEn: 'Accommodation' },
      entertainment: { emoji: '🎉', nameEs: 'Entretenimiento', nameEn: 'Entertainment' },
      shopping: { emoji: '🛍️', nameEs: 'Compras', nameEn: 'Shopping' },
      other: { emoji: '📦', nameEs: 'Otros', nameEn: 'Other' },
    };
    const info = categories[category] || categories.other;
    return {
      emoji: info.emoji,
      name: language === 'es' ? info.nameEs : info.nameEn,
    };
  };

  // Build HTML
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #1f2937;
      padding: 20px;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #6366F1;
    }
    
    .header h1 {
      font-size: 28px;
      color: #6366F1;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .summary-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 15px;
      border: 1px solid #e5e7eb;
    }
    
    .summary-card .label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .summary-card .value {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
    }
    
    .summary-card .value.primary {
      color: #6366F1;
    }
    
    .summary-card .value.green {
      color: #10B981;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    .table th {
      background: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #4b5563;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #d1d5db;
    }
    
    .table td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .table tr:last-child td {
      border-bottom: none;
    }
    
    .category-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      background: #e0e7ff;
      color: #4338ca;
    }
    
    .amount {
      font-weight: 600;
      color: #10B981;
      text-align: right;
    }
    
    .amount.negative {
      color: #EF4444;
    }
    
    .participant-name {
      font-weight: 500;
    }
    
    .chart-bar {
      height: 24px;
      background: linear-gradient(90deg, #6366F1, #8B5CF6);
      border-radius: 4px;
      position: relative;
      margin: 5px 0;
    }
    
    .chart-bar-label {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: white;
      font-size: 11px;
      font-weight: 600;
    }
    
    .settlement-card {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
    }
    
    .settlement-card .from-to {
      font-size: 13px;
      margin-bottom: 5px;
    }
    
    .settlement-card .amount {
      font-size: 16px;
      font-weight: bold;
      color: #10B981;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }
    
    .footer .app-name {
      font-weight: 600;
      color: #6366F1;
      margin-bottom: 5px;
    }
    
    @media print {
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>📊 ${event.name}</h1>
    <div class="subtitle">${event.startDate ? formatDate((event.startDate instanceof Date ? event.startDate : new Date(event.startDate)).toISOString()) : ''} - ${event.endDate ? formatDate((event.endDate instanceof Date ? event.endDate : new Date(event.endDate)).toISOString()) : ''}</div>
    <div class="subtitle">${language === 'es' ? 'Generado el' : 'Generated on'} ${formatDate(new Date().toISOString())}</div>
  </div>

  <!-- Summary Grid -->
  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">${language === 'es' ? 'Total Gastado' : 'Total Spent'}</div>
      <div class="value primary">${totalExpenses.toFixed(2)}€</div>
    </div>
    <div class="summary-card">
      <div class="label">${language === 'es' ? 'Participantes' : 'Participants'}</div>
      <div class="value">${totalParticipants}</div>
    </div>
    <div class="summary-card">
      <div class="label">${language === 'es' ? 'Promedio/Persona' : 'Average/Person'}</div>
      <div class="value green">${averagePerPerson.toFixed(2)}€</div>
    </div>
  </div>

  ${options.includeStatistics ? `
  <!-- Category Statistics -->
  <div class="section">
    <h2 class="section-title">${language === 'es' ? '📊 Gastos por Categoría' : '📊 Expenses by Category'}</h2>
    ${Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => {
        const percentage = (amount / totalExpenses) * 100;
        const info = getCategoryInfo(category);
        return `
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>${info.emoji} ${info.name}</span>
            <span style="font-weight: 600;">${amount.toFixed(2)}€ (${percentage.toFixed(1)}%)</span>
          </div>
          <div class="chart-bar" style="width: ${percentage}%; min-width: 80px;">
            <div class="chart-bar-label">${percentage.toFixed(0)}%</div>
          </div>
        </div>
        `;
      }).join('')}
  </div>
  ` : ''}

  ${options.includeExpenses ? `
  <!-- Expenses List -->
  <div class="section page-break">
    <h2 class="section-title">${language === 'es' ? '💳 Listado de Gastos' : '💳 Expenses List'} (${expenses.length})</h2>
    <table class="table">
      <thead>
        <tr>
          <th>${language === 'es' ? 'Fecha' : 'Date'}</th>
          <th>${language === 'es' ? 'Descripción' : 'Description'}</th>
          <th>${language === 'es' ? 'Categoría' : 'Category'}</th>
          <th>${language === 'es' ? 'Pagado por' : 'Paid by'}</th>
          <th style="text-align: right;">${language === 'es' ? 'Monto' : 'Amount'}</th>
        </tr>
      </thead>
      <tbody>
        ${expenses
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(expense => {
            const paidBy = participants.find(p => p.id === expense.paidBy);
            const info = getCategoryInfo(expense.category);
            const dateStr = expense.date instanceof Date ? expense.date.toISOString() : expense.date;
            return `
            <tr>
              <td>${formatDate(dateStr)}<br><small style="color: #6b7280;">${formatTime(dateStr)}</small></td>
              <td>${expense.description}</td>
              <td><span class="category-badge">${info.emoji} ${info.name}</span></td>
              <td class="participant-name">${paidBy?.name || 'Unknown'}</td>
              <td class="amount">${expense.amount.toFixed(2)}€</td>
            </tr>
            `;
          }).join('')}
      </tbody>
    </table>
    <div style="text-align: right; padding: 15px; background: #f9fafb; border-radius: 8px; font-weight: bold; font-size: 14px;">
      ${language === 'es' ? 'Total:' : 'Total:'} <span style="color: #6366F1; font-size: 18px;">${totalExpenses.toFixed(2)}€</span>
    </div>
  </div>
  ` : ''}

  ${options.includeSettlements ? `
  <!-- Settlements -->
  <div class="section page-break">
    <h2 class="section-title">${language === 'es' ? '💰 Liquidaciones Optimizadas' : '💰 Optimized Settlements'}</h2>
    <p style="margin-bottom: 15px; color: #6b7280; font-size: 11px;">
      ${language === 'es' 
        ? 'Transferencias mínimas necesarias para liquidar todas las deudas:'
        : 'Minimum transfers needed to settle all debts:'}
    </p>
    ${settlements.map(settlement => `
      <div class="settlement-card">
        <div class="from-to">
          <strong>${settlement.from}</strong> ${language === 'es' ? 'paga a' : 'pays'} <strong>${settlement.to}</strong>
        </div>
        <div class="amount">${settlement.amount.toFixed(2)}€</div>
      </div>
    `).join('')}
    ${settlements.length === 0 ? `
      <div style="text-align: center; padding: 30px; color: #6b7280;">
        ✅ ${language === 'es' ? 'Todas las cuentas están saldadas' : 'All accounts are settled'}
      </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- Participants -->
  <div class="section page-break">
    <h2 class="section-title">${language === 'es' ? '👥 Participantes' : '👥 Participants'} (${totalParticipants})</h2>
    <table class="table">
      <thead>
        <tr>
          <th>${language === 'es' ? 'Nombre' : 'Name'}</th>
          <th>${language === 'es' ? 'Email' : 'Email'}</th>
          <th style="text-align: right;">${language === 'es' ? 'Pagó' : 'Paid'}</th>
          <th style="text-align: right;">${language === 'es' ? 'Debe' : 'Owes'}</th>
          <th style="text-align: right;">${language === 'es' ? 'Balance' : 'Balance'}</th>
        </tr>
      </thead>
      <tbody>
        ${participants.map(participant => {
          const paid = expenses.filter(e => e.paidBy === participant.id).reduce((sum, e) => sum + e.amount, 0);
          const owes = expenses
            .filter(e => e.beneficiaries.includes(participant.id))
            .reduce((sum, e) => {
              // Calculate participant's share based on split type
              if (e.splitType === 'equal') {
                return sum + (e.amount / e.beneficiaries.length);
              } else if (e.splitType === 'custom' && e.customSplits) {
                return sum + (e.customSplits[participant.id] || 0);
              } else if (e.splitType === 'items' && e.items) {
                const itemShare = e.items.reduce((itemSum, item) => {
                  if (item.assignedTo.includes(participant.id)) {
                    return itemSum + (item.price / item.assignedTo.length);
                  }
                  return itemSum;
                }, 0);
                return sum + itemShare;
              }
              return sum;
            }, 0);
          const balance = paid - owes;
          
          return `
          <tr>
            <td class="participant-name">${participant.name}</td>
            <td style="color: #6b7280;">${participant.email || '-'}</td>
            <td class="amount">${paid.toFixed(2)}€</td>
            <td class="amount">${owes.toFixed(2)}€</td>
            <td class="amount ${balance < 0 ? 'negative' : ''}">${balance >= 0 ? '+' : ''}${balance.toFixed(2)}€</td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="app-name">LessMo - ${language === 'es' ? 'Gestión de Gastos Compartidos' : 'Shared Expense Management'}</div>
    <div>${language === 'es' ? 'Documento generado automáticamente' : 'Automatically generated document'}</div>
  </div>
</body>
</html>
  `;
};

/**
 * Calculate settlements (simplified algorithm)
 */
const calculateSettlements = (
  participants: Participant[],
  expenses: Expense[]
): Array<{ from: string; to: string; amount: number }> => {
  const settlements: Array<{ from: string; to: string; amount: number }> = [];

  // Calculate balances
  const balances = new Map<string, number>();
  
  for (const participant of participants) {
    // Amount paid
    const paid = expenses
      .filter(e => e.paidBy === participant.id)
      .reduce((sum, e) => sum + e.amount, 0);

    // Amount owed
    const owes = expenses
      .filter(e => e.beneficiaries.includes(participant.id))
      .reduce((sum, e) => {
        // Calculate participant's share based on split type
        if (e.splitType === 'equal') {
          return sum + (e.amount / e.beneficiaries.length);
        } else if (e.splitType === 'custom' && e.customSplits) {
          return sum + (e.customSplits[participant.id] || 0);
        } else if (e.splitType === 'items' && e.items) {
          const itemShare = e.items.reduce((itemSum, item) => {
            if (item.assignedTo.includes(participant.id)) {
              return itemSum + (item.price / item.assignedTo.length);
            }
            return itemSum;
          }, 0);
          return sum + itemShare;
        }
        return sum;
      }, 0);

    balances.set(participant.id, paid - owes);
  }

  // Create debtor/creditor lists
  const debtors: Array<{ id: string; name: string; amount: number }> = [];
  const creditors: Array<{ id: string; name: string; amount: number }> = [];

  for (const participant of participants) {
    const balance = balances.get(participant.id) || 0;
    if (balance < -0.01) {
      debtors.push({ id: participant.id, name: participant.name, amount: -balance });
    } else if (balance > 0.01) {
      creditors.push({ id: participant.id, name: participant.name, amount: balance });
    }
  }

  // Match debtors with creditors
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount,
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
};
