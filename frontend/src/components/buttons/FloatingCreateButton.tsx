'use client';

import React from 'react';
import { Plus } from 'lucide-react';

export interface FloatingCreateButtonProps {
  onClick?: () => void;
}

export const FloatingCreateButton: React.FC<FloatingCreateButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        boxShadow: '0px 10px 25px rgba(15, 118, 110, 0.35)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
      className="fixed bottom-8 right-8 sm:right-12 z-40 h-[52px] px-6 rounded-full bg-[#0F766E] hover:bg-[#115E59] active:scale-95 flex items-center gap-2.5 text-white transition-all cursor-pointer"
    >
      <Plus className="w-5 h-5 stroke-[2.5]" />
      <span className="text-[15px] font-bold tracking-normal">Chuyến đi mới</span>
    </button>
  );
};