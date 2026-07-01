import { GameState } from '../types/game';
import { getDailyPayroll } from './crewBonuses';
import { getPortfolioSummary } from './businessManagementSystem';
import {
  getDailyPropertyRent,
  getDailyPropertyUpkeep,
} from './safehouseSystem';
import { getNextDayInterest } from './financeSystem';

export interface DailyExpenseLine {
  key: string;
  label: string;
  amount: number;
}

export interface DailyExpenseBreakdown {
  income: DailyExpenseLine[];
  expenses: DailyExpenseLine[];
  totalIncome: number;
  totalExpenses: number;
  dailyNet: number;
  tomorrow: {
    debtInterest: number;
    payroll: number;
    propertyRent: number;
    propertyUpkeep: number;
    businessUpkeep: number;
  };
}

export function getDailyExpenseBreakdown(state: GameState): DailyExpenseBreakdown {
  const portfolio = getPortfolioSummary(state);
  const payroll = getDailyPayroll(state);
  const propertyRent = getDailyPropertyRent(state);
  const propertyUpkeep = getDailyPropertyUpkeep(state);
  const debtInterest = getNextDayInterest(state);

  const income: DailyExpenseLine[] = [];
  if (portfolio.income > 0) {
    income.push({ key: 'business_income', label: 'Business income', amount: portfolio.income });
  }
  if (portfolio.launder > 0) {
    income.push({ key: 'laundering', label: 'Laundering', amount: portfolio.launder });
  }

  const expenses: DailyExpenseLine[] = [];
  if (payroll > 0) {
    expenses.push({ key: 'payroll', label: 'Crew payroll', amount: payroll });
  }
  if (portfolio.upkeep > 0) {
    expenses.push({ key: 'business_upkeep', label: 'Business upkeep', amount: portfolio.upkeep });
  }
  if (propertyRent > 0) {
    expenses.push({ key: 'property_rent', label: 'Property rent', amount: propertyRent });
  }
  if (propertyUpkeep > 0) {
    expenses.push({ key: 'property_upkeep', label: 'Property upkeep', amount: propertyUpkeep });
  }
  if (debtInterest > 0) {
    expenses.push({ key: 'debt_interest', label: 'Debt interest', amount: debtInterest });
  }

  const totalIncome = income.reduce((s, l) => s + l.amount, 0);
  const totalExpenses = expenses.reduce((s, l) => s + l.amount, 0);

  return {
    income,
    expenses,
    totalIncome,
    totalExpenses,
    dailyNet: totalIncome - totalExpenses,
    tomorrow: {
      debtInterest,
      payroll,
      propertyRent,
      propertyUpkeep,
      businessUpkeep: portfolio.upkeep,
    },
  };
}

export function formatDailyNet(net: number): string {
  const sign = net >= 0 ? '+' : '−';
  return `${sign}$${Math.abs(net).toLocaleString()}/day`;
}
