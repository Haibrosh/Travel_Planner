export interface TripDay {
  key: string;   // 'YYYY-MM-DD'
  label: string; // '14/11' (theo Figma)
}

const pad = (n: number) => String(n).padStart(2, '0');

// Parse tay 'YYYY-MM-DD' để tránh lệch múi giờ của new Date('YYYY-MM-DD')
function parseDate(dateStr: string): Date | null {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function getTripDays(startDate: string, endDate: string, maxDays = 31): TripDay[] {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start) return [];

  const last = end && end >= start ? end : start;
  const days: TripDay[] = [];
  const cursor = new Date(start);

  while (cursor <= last && days.length < maxDays) {
    days.push({
      key: `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`,
      label: `${cursor.getDate()}/${cursor.getMonth() + 1}`,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}