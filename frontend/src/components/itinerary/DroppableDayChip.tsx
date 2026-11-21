'use client';

import { useDroppable } from '@dnd-kit/core';
import { DAY_DROP_PREFIX } from '@/utils/itineraryDnd';

interface DroppableDayChipProps {
  dayNum: number;
  label: string; // vd: 'Ngày 1 (14/11)'
  count: number;
  color: string; // màu của ngày
  isSelected: boolean;
  onClick: () => void;
}

export default function DroppableDayChip({
  dayNum,
  label,
  count,
  color,
  isSelected,
  onClick,
}: DroppableDayChipProps) {
  // Thả thẻ vào chip -> chuyển địa điểm sang cuối ngày đó
  const { setNodeRef, isOver } = useDroppable({ id: `${DAY_DROP_PREFIX}${dayNum}` });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      style={isSelected ? { backgroundColor: color } : undefined}
      className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
        isSelected
          ? 'text-white shadow-xs'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
      } ${isOver ? 'ring-2 ring-offset-1 ring-teal-500 scale-105' : ''}`}
    >
      {/* Chấm màu để nhận biết màu ngày */}
      {!isSelected && (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span>{label}</span>
      {count > 0 && (
        <span
          style={isSelected ? undefined : { backgroundColor: color }}
          className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-extrabold ${
            isSelected ? 'bg-white text-zinc-900' : 'text-white'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}