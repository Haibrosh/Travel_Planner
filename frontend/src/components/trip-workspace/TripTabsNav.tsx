'use client';

import React from 'react';

export type TripTabType = 'timeline' | 'budget' | 'checklist' | 'members' | 'settings';

export interface TripTabsNavProps {
  activeTab: TripTabType;
  onChangeTab: (tab: TripTabType) => void;
}

export const TripTabsNav: React.FC<TripTabsNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: TripTabType; label: string }[] = [
    { id: 'timeline', label: 'Lịch trình' },
    { id: 'budget', label: 'Chi tiêu' },
    { id: 'checklist', label: 'Hành lý' },
    { id: 'members', label: 'Bạn bè' },
    { id: 'settings', label: 'Cài đặt' },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-full overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`flex-1 shrink-0 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              isActive
                ? 'bg-[#14B8A6] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};