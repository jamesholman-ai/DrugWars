export type FinanceLogKind =
  | 'debt_payment'
  | 'debt_interest'
  | 'business_income'
  | 'payroll_paid'
  | 'property_upkeep'
  | 'property_rent'
  | 'business_upkeep'
  | 'laundered'
  | 'bribe_legal'
  | 'store_effect'
  | 'borrow'
  | 'rank_up';

export interface FinanceLogEntry {
  id: string;
  day: number;
  kind: FinanceLogKind;
  amount: number;
  message: string;
}

export const FINANCE_LOG_KIND_LABELS: Record<FinanceLogKind, string> = {
  debt_payment: 'Debt payment',
  debt_interest: 'Interest charged',
  business_income: 'Business income',
  payroll_paid: 'Payroll',
  property_upkeep: 'Property upkeep',
  property_rent: 'Property rent',
  business_upkeep: 'Business upkeep',
  laundered: 'Laundered',
  bribe_legal: 'Legal / bribe',
  store_effect: 'Store effect',
  borrow: 'Borrowed',
  rank_up: 'Rank promotion',
};
