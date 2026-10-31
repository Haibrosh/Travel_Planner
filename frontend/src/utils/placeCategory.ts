const CATEGORY_LABELS: Record<string, string> = {
  beach: 'Bãi biển',
  landmark: 'Điểm tham quan',
  viewpoint: 'Điểm ngắm cảnh',
  food: 'Ẩm thực',
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}