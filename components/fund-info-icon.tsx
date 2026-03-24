'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { MonthlyFundModal } from './monthly-fund-modal';

interface FundInfoIconProps {
  year: number;
  month: number;
  monthName: string;
  onFundUpdate?: () => void;
}

export function FundInfoIcon({ year, month, monthName, onFundUpdate }: FundInfoIconProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center ml-1.5 p-0.5 rounded-full transition-all hover:opacity-80"
        style={{
          background: 'rgba(255, 193, 7, 0.2)',
        }}
        title="Click to manage monthly fund"
      >
        <Info size={12} style={{ color: '#ffc107' }} />
      </button>

      <MonthlyFundModal
        isOpen={showModal}
        year={year}
        month={month}
        monthName={monthName}
        onClose={() => setShowModal(false)}
        onSave={() => {
          onFundUpdate?.();
        }}
      />
    </>
  );
}
