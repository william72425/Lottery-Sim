'use client';

import { useEffect, useState } from 'react';
import { playWinSound, playLoseSound, formatTime } from '@/lib/sound';
import { Bet } from '@/lib/storage';

interface ResultModalProps {
  isOpen: boolean;
  bet?: Bet;
  resultNumber?: number;
  onClose: () => void;
}

export function ResultModal({ isOpen, bet, resultNumber, onClose }: ResultModalProps) {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    if (!isOpen || !bet) return;

    // Play appropriate sound
    if (bet.status === 'win') {
      playWinSound();
    } else if (bet.status === 'lost') {
      playLoseSound();
    }

    // Auto close after 4 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [isOpen, bet, onClose]);

  if (!isOpen || !bet) return null;

  const isWin = bet.status === 'win';
  const multiplier = isNaN(Number(bet.val)) ? 1.98 : 8.82;
  const winAmount = isWin ? Math.floor(bet.amt * multiplier) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative w-80 rounded-3xl p-8 text-center"
        style={{
          background: isWin
            ? 'linear-gradient(135deg, #1a3a1a 0%, #0a1a0a 100%)'
            : 'linear-gradient(135deg, #3a1a1a 0%, #1a0a0a 100%)',
          border: `3px solid ${isWin ? '#00c853' : '#ff3d00'}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status Badge */}
        <div
          className="mb-6 inline-block rounded-full px-6 py-2 text-2xl font-bold"
          style={{
            backgroundColor: isWin ? '#00c853' : '#ff3d00',
            color: '#fff',
          }}
        >
          {isWin ? 'အောင်လျှင်း!' : 'ရှုံးသွား!'}
        </div>

        {/* Win Amount - Large if win */}
        {isWin && (
          <div className="mb-6">
            <div className="text-sm text-gray-400 mb-2">သင်ရရှိသောအငွေ</div>
            <div
              className="text-5xl font-black tracking-tight"
              style={{ color: '#00c853' }}
            >
              +{winAmount.toLocaleString()}
            </div>
          </div>
        )}

        {/* Match Details */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: '#888' }}>Match ပွဲ:</span>
            <span style={{ color: '#ffc107' }}>#{bet.period}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#888' }}>သင်၏ရွေးချယ်မှု:</span>
            <span style={{ color: '#fff' }}>
              {bet.val} - {bet.amt.toLocaleString()} MMK
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#888' }}>ရလဒ်:</span>
            <span
              style={{
                color: '#ffc107',
                fontSize: '24px',
                fontWeight: 'bold',
                minWidth: '40px',
              }}
            >
              {resultNumber}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#888' }}>အချိန်:</span>
            <span style={{ color: '#999', fontSize: '12px' }}>
              {formatTime(bet.createdAt)}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full rounded-lg py-2 text-sm font-semibold"
          style={{
            background: isWin ? '#00c853' : '#ff3d00',
            color: '#fff',
          }}
        >
          ပိတ်မည်
        </button>
      </div>
    </div>
  );
}
