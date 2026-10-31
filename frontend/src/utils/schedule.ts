const START_MINUTES = 8 * 60; // bắt đầu 8:00
const VISIT_MINUTES = 90;     // mỗi điểm 90 phút
const GAP_MINUTES = 15;       // nghỉ giữa hai điểm

function formatTime(totalMinutes: number): string {
  const hour24 = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

// Giờ mẫu tính theo thứ tự trong ngày, ví dụ '8:00 AM - 9:30 AM'
export function getTimeRange(index: number): string {
  const start = START_MINUTES + index * (VISIT_MINUTES + GAP_MINUTES);
  return `${formatTime(start)} - ${formatTime(start + VISIT_MINUTES)}`;
}