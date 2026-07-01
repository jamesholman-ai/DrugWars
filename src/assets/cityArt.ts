/**
 * Time-of-day and weather helpers for art variant selection.
 * City imagery is resolved via `src/assets/imageRegistry.ts` only.
 */

export function getTimeOfDayLabel(day: number): 'Night' | 'Morning' | 'Afternoon' | 'Evening' {
  const hour = (day * 7 + 14) % 24;
  if (hour >= 18 || hour < 6) return 'Night';
  if (hour >= 12) return 'Afternoon';
  if (hour >= 6) return 'Morning';
  return 'Evening';
}

export function getWeatherLabel(cityId: string): string {
  const coastal = ['miami', 'los_angeles', 'seattle', 'san_francisco', 'boston'];
  if (coastal.includes(cityId)) return 'Clear';
  if (cityId === 'seattle') return 'Overcast';
  if (cityId === 'las_vegas') return 'Dry';
  return 'Clear';
}
