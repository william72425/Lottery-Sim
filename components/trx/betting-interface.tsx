'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { getNumberColor, formatCurrency, validateBetAmount } from '@/lib/trx-utils';
import { addBet, deductFromWallet, getWallet } from '@/lib/storage';
import { playNotificationSound } from '@/lib/sound';

interface BettingInterfaceProps {
  period: string;
  countdown: number;
  isLocked: boolean;
  onBetPlaced?: () => void;
}

export function BettingInterface({
  period,
  countdown,
  isLocked,
  onBetPlaced,
}: BettingInterfaceProps) {
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [baseAmount, setBaseAmount] = useState('1000');
  const [multiplier, setMultiplier] = useState(1);
  const [showBetSheet, setShowBetSheet] = useState(false);
  const [wallet, setWallet] = useState(0);

  useEffect(() => {
    setWallet(getWallet());
  }, []);

  const totalBetAmount = (parseInt(baseAmount) || 0) * multiplier;
  const canBet = !isLocked && totalBetAmount > 0 && totalBetAmount <= wallet;

  const handleBetClick = (betValue: string) => {
    if (isLocked) return;
    setSelectedBet(betValue);
    setMultiplier(1);
    setBaseAmount('1000');
    setShowBetSheet(true);
  };

  const handleConfirmBet = () => {
    if (!selectedBet || totalBetAmount <= 0) return;

    const validation = validateBetAmount(totalBetAmount, wallet);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    if (deductFromWallet(totalBetAmount)) {
      addBet({
        period,
        val: selectedBet,
        amt: totalBetAmount,
        status: 'wait',
      });

      playNotificationSound();
      setWallet(getWallet());
      setShowBetSheet(false);
      setSelectedBet(null);
      onBetPlaced?.();
    }
  };

  const numberButtons = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="w-full space-y-4 relative">
      {/* Lock Overlay */}
      {isLocked && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center rounded-lg"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div className="text-center">
            <div
              className="text-9xl font-black"
              style={{ color: '#ffc107' }}
            >
              {countdown}
            </div>
            <div className="text-gray-400 text-sm mt-2">နောက်ထပ်ပွဲ စတင်အောင်မျ</div>
          </div>
        </div>
      )}

      {/* Period & Countdown Card */}
      <Card
        className="p-6 border"
        style={{
          background: '#171c21',
          borderColor: '#222',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-gray-400 mb-1">PERIOD</div>
            <div className="text-2xl font-bold">{period}</div>
          </div>
          <div
            className="px-4 py-2 rounded-lg font-black text-xl"
            style={{
              background: '#ffc107',
              color: '#000',
            }}
          >
            {String(countdown).padStart(2, '0')}
          </div>
        </div>

        {/* Color Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => handleBetClick('GREEN')}
            disabled={isLocked}
            className="flex-1 py-4 rounded-xl font-bold text-white disabled:opacity-50"
            style={{
              background: '#00c853',
            }}
          >
            Green
          </button>
          <button
            onClick={() => handleBetClick('VIOLET')}
            disabled={isLocked}
            className="flex-1 py-4 rounded-xl font-bold text-white disabled:opacity-50"
            style={{
              background: '#d500f9',
            }}
          >
            Violet
          </button>
          <button
            onClick={() => handleBetClick('RED')}
            disabled={isLocked}
            className="flex-1 py-4 rounded-xl font-bold text-white disabled:opacity-50"
            style={{
              background: '#ff3d00',
            }}
          >
            Red
          </button>
        </div>

        {/* Number Grid */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {numberButtons.map((num) => (
            <button
              key={num}
              onClick={() => handleBetClick(num.toString())}
              disabled={isLocked}
              className="aspect-square rounded-xl font-bold text-white disabled:opacity-50"
              style={{
                background: getNumberColor(num),
              }}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Big/Small Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleBetClick('BIG')}
            disabled={isLocked}
            className="flex-1 py-4 rounded-xl font-bold text-white disabled:opacity-50"
            style={{
              background: '#ff9800',
            }}
          >
            BIG
          </button>
          <button
            onClick={() => handleBetClick('SMALL')}
            disabled={isLocked}
            className="flex-1 py-4 rounded-xl font-bold text-white disabled:opacity-50"
            style={{
              background: '#00bcd4',
            }}
          >
            SMALL
          </button>
        </div>
      </Card>

      {/* Bet Sheet Modal */}
      {showBetSheet && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowBetSheet(false)}
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
            }}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 max-w-md mx-auto"
            style={{
              background: '#1e2329',
              borderTop: '2px solid #ffc107',
            }}
          >
            <h3 className="text-center font-bold mb-6">
              ရွေးချယ်မှု:{' '}
              <span style={{ color: '#ffc107' }}>
                {selectedBet}
              </span>
            </h3>

            {/* Amount Input */}
            <Input
              type="number"
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
              className="mb-4 text-center text-xl font-bold"
              style={{
                background: '#000',
                borderColor: '#444',
                color: '#fff',
              }}
              placeholder="Amount"
            />

            {/* Multiplier Buttons */}
            <div className="grid grid-cols-6 gap-2 mb-6">
              {[1, 5, 10, 20, 50, 100].map((x) => (
                <button
                  key={x}
                  onClick={() => setMultiplier(x)}
                  className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                    multiplier === x
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                  style={
                    multiplier === x
                      ? { background: '#ffc107', color: '#000' }
                      : { background: '#333', color: '#888' }
                  }
                >
                  X{x}
                </button>
              ))}
            </div>

            {/* Total Display */}
            <div
              className="text-center font-black text-3xl mb-6"
              style={{ color: '#ffc107' }}
            >
              {formatCurrency(totalBetAmount)} MMK
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmBet}
              disabled={!canBet}
              className="w-full py-4 rounded-2xl font-bold text-black disabled:opacity-50"
              style={{
                background: '#ffc107',
              }}
            >
              အတည်ပြုမည်
            </button>
          </div>
        </>
      )}
    </div>
  );
}
