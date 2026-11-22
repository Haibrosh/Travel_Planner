'use client';

import { ChecklistTab as ChecklistPanel } from '@/components/trip-workspace/ChecklistTab';

export default function ChecklistTab() {
  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <ChecklistPanel />
    </div>
  );
}
