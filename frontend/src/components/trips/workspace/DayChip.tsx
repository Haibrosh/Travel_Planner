'use client';

import { useDroppable } from '@dnd-kit/core';
import { dayDndId } from '@/utils/itineraryDnd';
import { getDayColor } from '@/utils/dayColors';

interface DayChipProps {
  dayNum: number;
  dateLabel: string;
  count: number;
  isSelected: boolean;
  onSelect: () => void;
}

// Chip ngày: vừa để chọn ngày, vừa là vùng thả để kéo địa điểm sang ngày khác
export default function DayChip({ dayNum, dateLabel, count, isSelected, onSelect }: DayChipProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dayDndId(dayNum) });
  const color = getDayColor(dayNum);

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      style={{
        ...(isSelected ? { backgroundColor: color } : {}),
        ...(isOver ? { outline: `2px solid ${color}`, outlineOffset: 2 } : {}),
      }}
      className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
        isSelected
          ? 'text-white shadow-xs'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
      }`}
    >
      {!isSelected && (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span>
        Ngày {dayNum} ({dateLabel})
      </span>
      {count > 0 && (
        <span
          className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-extrabold"
          style={
            isSelected
              ? { backgroundColor: '#fff', color }
              : { backgroundColor: color, color: '#fff' }
          }
        >
          {count}
        </span>
      )}
    </button>
  );
}
