/**
 * Settlement Optimization Service
 * Implements graph algorithm to minimize number of transactions needed to settle debts
 * Reduces N transactions to minimum (typically 2-3) using debt flow optimization
 */

import { Expense, Participant, Event } from '../types';

export interface Debt {
  from: string; // participant ID
  to: string; // participant ID
  amount: number;
}

export interface Settlement {
  from: Participant;
  to: Participant;
  amount: number;
}

export interface OptimizationResult {
  traditional: Settlement[];
  optimized: Settlement[];
  savings: {
    transactionsSaved: number;
    percentageReduction: number;
  };
}

/**
 * Calculate traditional settlements (person-to-person based on expenses)
 */
export const calculateTraditionalSettlements = (
  expenses: Expense[],
  participants: Participant[]
): Settlement[] => {
  const settlements: Settlement[] = [];
  const participantMap = new Map(participants.map(p => [p.id, p]));

  // Group by who paid
  for (const expense of expenses) {
    const payer = participantMap.get(expense.paidBy);
    if (!payer) continue;

    if (expense.splitType === 'equal') {
      // Equal split
      const shareAmount = expense.amount / expense.beneficiaries.length;
      
      for (const participantId of expense.beneficiaries) {
        if (participantId === expense.paidBy) continue; // Skip payer
        
        const participant = participantMap.get(participantId);
        if (!participant) continue;

        settlements.push({
          from: participant,
          to: payer,
          amount: shareAmount,
        });
      }
    } else if (expense.splitType === 'custom' && expense.customSplits) {
      // Custom split
      for (const [participantId, amount] of Object.entries(expense.customSplits)) {
        if (participantId === expense.paidBy) continue; // Skip payer
        
        const participant = participantMap.get(participantId);
        if (!participant) continue;

        settlements.push({
          from: participant,
          to: payer,
          amount: amount,
        });
      }
    } else if (expense.splitType === 'items' && expense.items) {
      // Items split
      const itemTotals = new Map<string, number>();
      
      for (const item of expense.items) {
        const perPersonAmount = item.price / item.assignedTo.length;
        
        for (const participantId of item.assignedTo) {
          const current = itemTotals.get(participantId) || 0;
          itemTotals.set(participantId, current + perPersonAmount);
        }
      }

      for (const [participantId, amount] of itemTotals.entries()) {
        if (participantId === expense.paidBy) continue;
        
        const participant = participantMap.get(participantId);
        if (!participant) continue;

        settlements.push({
          from: participant,
          to: payer,
          amount,
        });
      }
    }
  }

  // Aggregate settlements between same pairs
  const aggregatedMap = new Map<string, Settlement>();
  
  for (const settlement of settlements) {
    const key = `${settlement.from.id}_${settlement.to.id}`;
    const existing = aggregatedMap.get(key);
    
    if (existing) {
      existing.amount += settlement.amount;
    } else {
      aggregatedMap.set(key, { ...settlement });
    }
  }

  return Array.from(aggregatedMap.values()).filter(s => s.amount > 0.01);
};

/**
 * Calculate optimized settlements using debt flow algorithm
 * This minimizes the number of transactions needed
 */
export const calculateOptimizedSettlements = (
  expenses: Expense[],
  participants: Participant[]
): Settlement[] => {
  const participantMap = new Map(participants.map(p => [p.id, p]));
  
  // Calculate net balance for each participant
  const balances = new Map<string, number>();
  
  // Initialize all participants with 0 balance
  for (const participant of participants) {
    balances.set(participant.id, 0);
  }

  // Calculate balances from expenses
  for (const expense of expenses) {
    // Payer receives money (positive balance)
    const payerBalance = balances.get(expense.paidBy) || 0;
    balances.set(expense.paidBy, payerBalance + expense.amount);

    if (expense.splitType === 'equal') {
      // Equal split - each participant owes their share
      const shareAmount = expense.amount / expense.beneficiaries.length;
      
      for (const participantId of expense.beneficiaries) {
        const participantBalance = balances.get(participantId) || 0;
        balances.set(participantId, participantBalance - shareAmount);
      }
    } else if (expense.splitType === 'custom' && expense.customSplits) {
      // Custom split
      for (const [participantId, amount] of Object.entries(expense.customSplits)) {
        const participantBalance = balances.get(participantId) || 0;
        balances.set(participantId, participantBalance - amount);
      }
    } else if (expense.splitType === 'items' && expense.items) {
      // Items split
      const itemTotals = new Map<string, number>();
      
      for (const item of expense.items) {
        const perPersonAmount = item.price / item.assignedTo.length;
        
        for (const participantId of item.assignedTo) {
          const current = itemTotals.get(participantId) || 0;
          itemTotals.set(participantId, current + perPersonAmount);
        }
      }

      for (const [participantId, amount] of itemTotals.entries()) {
        const participantBalance = balances.get(participantId) || 0;
        balances.set(participantId, participantBalance - amount);
      }
    }
  }

  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  for (const [id, balance] of balances.entries()) {
    if (balance > 0.01) {
      creditors.push({ id, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id, amount: -balance }); // Store as positive
    }
  }

  // Sort by amount descending (greedy approach)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Match creditors with debtors to minimize transactions
  const settlements: Settlement[] = [];
  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const creditorParticipant = participantMap.get(creditor.id);
    const debtorParticipant = participantMap.get(debtor.id);

    if (!creditorParticipant || !debtorParticipant) {
      i++;
      j++;
      continue;
    }

    // Transfer minimum of what creditor is owed and what debtor owes
    const transferAmount = Math.min(creditor.amount, debtor.amount);

    settlements.push({
      from: debtorParticipant,
      to: creditorParticipant,
      amount: transferAmount,
    });

    // Update balances
    creditor.amount -= transferAmount;
    debtor.amount -= transferAmount;

    // Move to next creditor or debtor if fully settled
    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return settlements;
};

/**
 * Compare traditional vs optimized settlements
 */
export const optimizeSettlements = (
  expenses: Expense[],
  participants: Participant[]
): OptimizationResult => {
  const traditional = calculateTraditionalSettlements(expenses, participants);
  const optimized = calculateOptimizedSettlements(expenses, participants);

  const transactionsSaved = traditional.length - optimized.length;
  const percentageReduction =
    traditional.length > 0 ? (transactionsSaved / traditional.length) * 100 : 0;

  return {
    traditional,
    optimized,
    savings: {
      transactionsSaved,
      percentageReduction,
    },
  };
};

/**
 * Visualize debt flow (for UI graphs)
 */
export interface DebtNode {
  id: string;
  name: string;
  balance: number; // positive = owed, negative = owes
  x: number; // position for visualization
  y: number;
}

export interface DebtEdge {
  from: string;
  to: string;
  amount: number;
}

export const generateDebtGraph = (
  settlements: Settlement[]
): { nodes: DebtNode[]; edges: DebtEdge[] } => {
  const nodes = new Map<string, DebtNode>();
  const edges: DebtEdge[] = [];

  // Create nodes
  let xPos = 0;
  for (const settlement of settlements) {
    if (!nodes.has(settlement.from.id)) {
      nodes.set(settlement.from.id, {
        id: settlement.from.id,
        name: settlement.from.name,
        balance: -settlement.amount,
        x: xPos,
        y: 0,
      });
      xPos += 100;
    } else {
      const node = nodes.get(settlement.from.id)!;
      node.balance -= settlement.amount;
    }

    if (!nodes.has(settlement.to.id)) {
      nodes.set(settlement.to.id, {
        id: settlement.to.id,
        name: settlement.to.name,
        balance: settlement.amount,
        x: xPos,
        y: 100,
      });
      xPos += 100;
    } else {
      const node = nodes.get(settlement.to.id)!;
      node.balance += settlement.amount;
    }

    edges.push({
      from: settlement.from.id,
      to: settlement.to.id,
      amount: settlement.amount,
    });
  }

  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
};

/**
 * Get settlement instructions (human-readable)
 */
export const getSettlementInstructions = (
  settlement: Settlement,
  language: 'es' | 'en'
): string => {
  if (language === 'es') {
    return `${settlement.from.name} debe pagar ${settlement.amount.toFixed(2)}€ a ${settlement.to.name}`;
  } else {
    return `${settlement.from.name} must pay ${settlement.amount.toFixed(2)}€ to ${settlement.to.name}`;
  }
};
