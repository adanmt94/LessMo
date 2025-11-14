/**
 * exportUtils - Utilidades para exportar datos
 */

import * as XLSX from 'xlsx';
import { writeAsStringAsync, cacheDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Event, Expense, Participant } from '../types';

/**
 * Exportar gastos de un evento a Excel
 */
export const exportExpensesToExcel = async (
  event: Event,
  expenses: Expense[],
  participants: Participant[]
): Promise<void> => {
  try {
    // Crear mapas para acceso rápido
    const participantsMap = new Map(participants.map(p => [p.id, p]));

    // Preparar datos de gastos
    const expensesData = expenses.map(expense => {
      const payer = participantsMap.get(expense.paidBy);
      const beneficiaries = expense.splitType === 'equal'
        ? participants.map(p => p.name).join(', ')
        : Object.keys(expense.customSplits || {})
            .map(id => participantsMap.get(id)?.name)
            .filter(Boolean)
            .join(', ');

      return {
        'Fecha': new Date(expense.date).toLocaleDateString('es-ES'),
        'Descripción': expense.description,
        'Monto': `${expense.amount.toFixed(2)} ${event.currency}`,
        'Pagado por': payer?.name || 'Desconocido',
        'Tipo de división': expense.splitType === 'equal' ? 'Igual' : 'Personalizado',
        'Beneficiarios': beneficiaries,
        'Categoría': expense.category || 'General',
      };
    });

    // Preparar datos de participantes
    const participantsData = participants.map(p => {
      const paid = expenses
        .filter(e => e.paidBy === p.id)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const owed = expenses.reduce((sum, expense) => {
        if (expense.splitType === 'equal') {
          return sum + (expense.amount / participants.length);
        } else if (expense.customSplits && expense.customSplits[p.id]) {
          return sum + expense.customSplits[p.id];
        }
        return sum;
      }, 0);

      const balance = paid - owed;

      return {
        'Nombre': p.name,
        'Email': p.email || 'N/A',
        'Total Pagado': `${paid.toFixed(2)} ${event.currency}`,
        'Total Debe': `${owed.toFixed(2)} ${event.currency}`,
        'Balance': `${balance.toFixed(2)} ${event.currency}`,
        'Estado': balance > 0.01 ? 'Le deben' : balance < -0.01 ? 'Tiene deudas' : 'A mano',
      };
    });

    // Crear hojas
    const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
    const participantsSheet = XLSX.utils.json_to_sheet(participantsData);

    // Crear resumen del evento
    const summaryData = [{
      'Nombre del Evento': event.name,
      'Descripción': event.description || 'Sin descripción',
      'Presupuesto Inicial': `${event.initialBudget.toFixed(2)} ${event.currency}`,
      'Total Gastado': `${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)} ${event.currency}`,
      'Número de Gastos': expenses.length,
      'Número de Participantes': participants.length,
      'Fecha de Creación': new Date(event.createdAt).toLocaleDateString('es-ES'),
      'Estado': event.status === 'active' ? 'Activo' : event.status === 'completed' ? 'Completado' : 'Archivado',
    }];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Gastos');
    XLSX.utils.book_append_sheet(workbook, participantsSheet, 'Participantes');

    // Convertir a base64
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

    // Guardar archivo
    const fileName = `${event.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;
    const fileUri = cacheDirectory + fileName;

    // Escribir contenido en base64
    await writeAsStringAsync(fileUri, wbout, {
      encoding: 'base64',
    });

    // Compartir archivo
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Exportar ${event.name}`,
        UTI: 'com.microsoft.excel.xlsx',
      });
    } else {
      throw new Error('La función de compartir no está disponible en este dispositivo');
    }

    console.log('✅ Archivo exportado exitosamente:', fileName);
  } catch (error: any) {
    console.error('❌ Error exportando a Excel:', error);
    throw new Error(error.message || 'No se pudo exportar el archivo');
  }
};

/**
 * Exporta todos los eventos del usuario a un archivo Excel
 */
export const exportAllEventsToExcel = async (
  events: Event[],
  allExpenses: Record<string, Expense[]>,
  allParticipants: Record<string, Participant[]>
): Promise<void> => {
  try {
    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Objeto para mantener track de nombres de hojas y evitar duplicados
    const usedSheetNames = new Set<string>();

    // Para cada evento, crear una hoja
    events.forEach((event, index) => {
      const expenses = allExpenses[event.id] || [];
      const participants = allParticipants[event.id] || [];

      // Preparar datos del evento
      const eventData = [
        ['Evento', event.name],
        ['Descripción', event.description || 'N/A'],
        ['Fecha de creación', new Date(event.createdAt).toLocaleDateString('es-ES')],
        ['Presupuesto inicial', `${event.initialBudget || 0} ${event.currency || 'EUR'}`],
        ['Total gastado', `${expenses.reduce((sum, exp) => sum + exp.amount, 0)} ${event.currency || 'EUR'}`],
        [],
        ['Descripción', 'Cantidad', 'Categoría', 'Fecha', 'Pagado por'],
        ...expenses.map(expense => [
          expense.description,
          expense.amount,
          expense.category || 'Sin categoría',
          new Date(expense.date).toLocaleDateString('es-ES'),
          participants.find(p => p.id === expense.paidBy)?.name || 'Desconocido',
        ]),
        [],
        ['Participantes', 'Email'],
        ...participants.map(participant => [
          participant.name,
          participant.email || 'N/A',
        ]),
      ];

      // Crear hoja y agregar al libro
      const sheet = XLSX.utils.aoa_to_sheet(eventData);
      
      // Generar nombre único para la hoja (Excel limita a 31 caracteres)
      let sheetName = event.name.substring(0, 28); // Dejar espacio para sufijo
      let counter = 1;
      let finalSheetName = sheetName;
      
      // Si el nombre ya existe, añadir un número
      while (usedSheetNames.has(finalSheetName)) {
        finalSheetName = `${sheetName}_${counter}`;
        counter++;
        // Asegurar que no exceda 31 caracteres
        if (finalSheetName.length > 31) {
          sheetName = event.name.substring(0, 28 - counter.toString().length);
          finalSheetName = `${sheetName}_${counter}`;
        }
      }
      
      usedSheetNames.add(finalSheetName);
      XLSX.utils.book_append_sheet(workbook, sheet, finalSheetName);
    });

    // Convertir a base64
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

    // Guardar archivo
    const fileName = `LessMo_Todos_los_eventos_${Date.now()}.xlsx`;
    const fileUri = cacheDirectory + fileName;

    // Escribir contenido en base64
    await writeAsStringAsync(fileUri, wbout, {
      encoding: 'base64',
    });

    // Compartir archivo
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar todos los eventos',
        UTI: 'com.microsoft.excel.xlsx',
      });
    } else {
      throw new Error('La función de compartir no está disponible en este dispositivo');
    }

    console.log('✅ Todos los eventos exportados exitosamente');
  } catch (error: any) {
    console.error('❌ Error exportando todos los eventos:', error);
    throw new Error(error.message || 'No se pudo exportar el archivo');
  }
};
