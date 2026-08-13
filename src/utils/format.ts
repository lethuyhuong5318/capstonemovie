export function formatCurrency(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}

export function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  return {
    weekday: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
    day: date.getDate(),
    month: date.getMonth() + 1,
  };
}

export function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}





export function formatRating(rating: number) {
  const rounded = Math.round(rating * 10) / 10;
  const label = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${label}/10`;
}
