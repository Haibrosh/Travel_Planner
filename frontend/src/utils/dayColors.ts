// Bảng màu theo ngày: Ngày 1 xanh dương, Ngày 2 cam, Ngày 3 tím...
export const DAY_COLORS = [
  '#2563eb', // blue
  '#ea580c', // orange
  '#9333ea', // purple
  '#16a34a', // green
  '#dc2626', // red
  '#0891b2', // cyan
  '#ca8a04', // yellow
] as const;

// Quay vòng khi chuyến đi dài hơn số màu
export function getDayColor(dayNumber: number): string {
  const index = (Math.max(1, dayNumber) - 1) % DAY_COLORS.length;
  return DAY_COLORS[index];
}
