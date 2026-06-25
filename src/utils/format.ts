export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

export function formatStat(value: number, max = 100): string {
  return `${value}/${max}`;
}
