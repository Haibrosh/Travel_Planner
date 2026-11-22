'use client';

import { useState } from 'react';
import type { TripResponse } from '@/types/trip';
import type { ExpenseItem } from '@/components/cards/TotalExpenseCard';
import { TripBudgetPanel } from '@/components/trip-workspace/TripBudgetPanel';

interface BudgetTabProps {
  trip: TripResponse;
}

export default function BudgetTab({ trip }: BudgetTabProps) {
  const [budget, setBudget] = useState<number>(5000000);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: '1',
      title: 'Đặt phòng homestay 3 ngày 2 đêm',
      category: 'Khách sạn',
      amount: 1800000,
      paidBy: trip.ownerUsername,
    },
    {
      id: '2',
      title: 'Vé xe khứ hồi Limousine',
      category: 'Di chuyển',
      amount: 700000,
      paidBy: trip.ownerUsername,
    },
  ]);

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8">
      <TripBudgetPanel
        fundBalance={budget}
        expenses={expenses}
        defaultPaidBy={trip.ownerUsername}
        onUpdateBalance={setBudget}
        onAddExpense={(newExpense) =>
          setExpenses((prev) => [{ id: Date.now(), ...newExpense }, ...prev])
        }
        onDeleteExpense={(id) =>
          setExpenses((prev) => prev.filter((item) => String(item.id) !== String(id)))
        }
      />
    </div>
  );
}
