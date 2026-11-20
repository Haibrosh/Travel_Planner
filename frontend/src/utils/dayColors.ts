// Bảng màu theo ngày: Ngày 1 xanh dương, Ngày 2 cam, Ngày 3 tím...
export const DAY_COLORS = [
  '#2563EB', // Ngày 1 - xanh dương
  '#F97316', // Ngày 2 - cam
  '#9333EA', // Ngày 3 - tím
  '#0D9488', // Ngày 4 - teal
  '#E11D48', // Ngày 5 - hồng đỏ
  '#CA8A04', // Ngày 6 - vàng đậm
  '#0891B2', // Ngày 7 - cyan
  '#4D7C0F', // Ngày 8 - xanh lá
] as const;

// Quá 8 ngày thì xoay vòng màu
export function getDayColor(dayNumber: number): string {
  const index = (Math.max(1, dayNumber) - 1) % DAY_COLORS.length;
  return DAY_COLORS[index];
}