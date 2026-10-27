const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDay(date: string): string {
  // A data já é o calendário local do destino, não um instante no fuso do dispositivo.
  return dayFormatter.format(new Date(`${date}T12:00:00Z`));
}
