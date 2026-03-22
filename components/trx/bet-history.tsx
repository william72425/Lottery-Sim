'use client';

import { useMemo } from 'react';
import { Bet } from '@/lib/storage';
import { groupByDate, formatTime } from '@/lib/sound';
import { getBetStatusDisplay, getBetMultiplier } from '@/lib/trx-utils';

interface BetHistoryProps {
  bets: Bet[];
  maxItems?: number;
}

export function BetHistory({ bets, maxItems = 10 }: BetHistoryProps) {
  const groupedBets = useMemo(() => {
    return groupByDate(bets);
  }, [bets]);

  const dateOrder = [
    'Today',
    'Yesterday',
    ...Object.keys(groupedBets).filter((d) => d !== 'Today' && d !== 'Yesterday'),
  ].filter((date) => groupedBets[date]);

  if (bets.length === 0) {
    return (
      <div
        className="p-6 text-center rounded-lg"
        style={{
          background: '#171c21',
          border: '1px solid #222',
        }}
      >
        <div style={{ color: '#555', fontSize: '14px' }}>
          No history
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dateOrder.map((date) => {
        const dayBets = groupedBets[date].slice(0, maxItems);
        return (
          <div key={date}>
            {/* Date Header */}
            <div
              className="text-xs font-bold mb-2 px-2"
              style={{ color: '#888' }}
            >
              {date}
            </div>

            {/* Bets for this day */}
            <div className="space-y-2">
              {dayBets.map((bet) => {
                const { text: statusText, color: statusColor } =
                  getBetStatusDisplay(bet.status);
                const multiplier = getBetMultiplier(bet.val);
                let amountText = statusText;
                let amountColor = statusColor;

                if (bet.status === 'win') {
                  const winAmount = Math.floor(bet.amt * multiplier);
                  amountText = `+${winAmount.toLocaleString()}`;
                  amountColor = '#00c853';
                } else if (bet.status === 'lost') {
                  amountText = `-${bet.amt.toLocaleString()}`;
                  amountColor = '#ff3d00';
                }

                return (
                  <div
                    key={bet.id}
                    className="p-3 flex items-center justify-between rounded-lg border"
                    style={{
                      background: '#0f1419',
                      borderColor: '#1f252b',
                    }}
                  >
                    {/* Left side - Bet Type & Period */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white">{bet.val}</div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: '#888' }}
                      >
                        #{bet.period}
                      </div>
                    </div>

                    {/* Right side - Amount & Status */}
                    <div className="text-right">
                      <div
                        className="font-bold text-sm"
                        style={{ color: amountColor }}
                      >
                        {amountText}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: amountColor, fontSize: '11px' }}
                      >
                        {bet.status === 'win' ? 'WIN' : bet.status === 'lost' ? 'LOST' : 'WAIT'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
