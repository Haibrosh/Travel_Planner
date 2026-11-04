// Bỏ dấu tiếng Việt + chữ thường, dùng để tìm kiếm không phân biệt dấu
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd');
}