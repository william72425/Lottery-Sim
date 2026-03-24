'use client';

import { useMemo } from 'react';
import { Bet } from '@/lib/storage';
import { groupByDate, formatTime } from '@/lib/sound';
import { getBetStatusDisplay, getBetMultiplier } from '@/lib/trx-utils';
import { getBetNote, getAllTags } from '@/lib/bet-notes';
import { Tag, Edit2 } from 'lucide-react';

interface BetHistoryProps {
  bets: Bet[];
  maxItems?: number;
  onBetClick?: (bet: Bet) => void;
}

export function BetHistory({ bets, maxItems = 10, onBetClick }: BetHistoryProps) {
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
          background: 'var(--theme-card-bg, #171c21)',
          border: '1px solid var(--theme-border, #222)',
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

                const betNote = getBetNote(bet.id);
                const tagInfo = betNote ? (betNote.tag === 'custom' 
                  ? getAllTags().find(t => t.id === betNote.customTagId)
                  : getAllTags().find(t => t.id === betNote.tag)) : null;

                return (
                  <div
                    key={bet.id}
                    className="p-3 rounded-lg border cursor-pointer transition-all hover:opacity-80"
                    style={{
                      background: 'var(--theme-bg-secondary, #0f1419)',
                      borderColor: '#1f252b',
                    }}
                    onClick={() => onBetClick?.(bet)}
                    title="Click to view/edit tag and note"
                  >
                    <div className="flex items-center justify-between">
                      {/* Left side - Bet Type & Period */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white">{bet.val}</div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: '#888' }}
                        >
                          #{bet.period}
                        </div>
                        {/* Tag Badge */}
                        {tagInfo && (
                          <div 
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium mt-1"
                            style={{
                              background: tagInfo.bgColor,
                              color: tagInfo.color,
                              border: `0.5px solid ${tagInfo.color}40`,
                            }}
                          >
                            <Tag size={8} />
                            {tagInfo.name}
                            {betNote?.note && (
                              <span className="opacity-70 ml-0.5" title={betNote.note}>📝</span>
                            )}
                          </div>
                        )}
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
