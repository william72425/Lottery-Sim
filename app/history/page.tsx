'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBets, Bet } from '@/lib/storage';
import { getBetStatusDisplay, getBetMultiplier } from '@/lib/trx-utils';
import { formatDate, formatTime, groupByDate } from '@/lib/sound';

const ITEMS_PER_PAGE = 10;

export default function HistoryPage() {
  const router = useRouter();
  const [bets, setBets] = useState<Bet[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setBets(getBets());
  }, []);

  const groupedBets = groupByDate(bets);
  const dateOrder = [
    'Today',
    'Yesterday',
    ...Object.keys(groupedBets).filter((d) => d !== 'Today' && d !== 'Yesterday'),
  ].filter((date) => groupedBets[date]);

  // Flatten grouped bets for pagination
  let allBets: (Bet & { date: string })[] = [];
  dateOrder.forEach((date) => {
    groupedBets[date].forEach((bet) => {
      allBets.push({ ...bet, date });
    });
  });

  const totalPages = Math.ceil(allBets.length / ITEMS_PER_PAGE);
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentBets = allBets.slice(startIdx, endIdx);

  const handlePrevPage = () => {
    setCurrentPage(Math.max(0, currentPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
  };

  return (
    <main
      className="min-h-screen pb-20"
      style={{ background: '#090b0d', color: '#fff' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 border-b"
        style={{
          background: '#090b0d',
          borderColor: '#222',
        }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={24} style={{ color: '#ffc107' }} />
        </button>
        <h1 className="text-xl font-bold">ဂိမ်းမှတ်တမ်း</h1>
      </div>

      {/* Content */}
      <div className="w-full max-w-md mx-auto px-2 pt-6 pb-20 space-y-6">
        {bets.length === 0 ? (
          <Card
            className="p-12 border text-center"
            style={{
              background: '#0f1215',
              borderColor: '#222',
            }}
          >
            <div style={{ color: '#555' }}>မှတ်တမ်းမရှိသေးပါ။</div>
          </Card>
        ) : (
          <>
            {/* Timeline View */}
            <div className="space-y-4">
              {currentBets.map((bet) => {
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
                  <Card
                    key={bet.id}
                    className="p-4 border"
                    style={{
                      background: '#1e2329',
                      borderColor: '#222',
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left Side */}
                      <div className="flex-1">
                        <div className="font-bold text-lg">{bet.val}</div>
                        <div
                          className="text-xs mt-1"
                          style={{ color: '#888' }}
                        >
                          #{bet.period}
                        </div>
                        <div
                          className="text-xs mt-1"
                          style={{ color: '#555' }}
                        >
                          {bet.date} • {formatTime(bet.createdAt)}
                        </div>
                      </div>

                      {/* Right Side */}
                      <div className="text-right">
                        <div
                          className="font-bold text-lg"
                          style={{ color: amountColor }}
                        >
                          {amountText}
                        </div>
                        <div
                          className="text-xs mt-1"
                          style={{ color: '#555' }}
                        >
                          {bet.amt.toLocaleString()} MMK
                        </div>
                        {bet.resultNumber !== undefined && (
                          <div
                            className="text-xs mt-1 font-bold"
                            style={{ color: '#ffc107' }}
                          >
                            Result: {bet.resultNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 mt-8">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="flex items-center gap-2 px-4 py-2 disabled:opacity-50"
                  style={{
                    background: '#ffc107',
                    color: '#000',
                  }}
                >
                  <ChevronLeft size={18} />
                  အရှေ့
                </Button>

                <div className="flex-1 text-center">
                  <span
                    className="font-bold"
                    style={{ color: '#ffc107' }}
                  >
                    {currentPage + 1} / {totalPages}
                  </span>
                </div>

                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center gap-2 px-4 py-2 disabled:opacity-50"
                  style={{
                    background: '#ffc107',
                    color: '#000',
                  }}
                >
                  အနောက်
                  <ChevronRight size={18} />
                </Button>
              </div>
            )}

            {/* Stats */}
            <Card
              className="p-4 border"
              style={{
                background: '#0f1215',
                borderColor: '#222',
              }}
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div
                    className="text-xs"
                    style={{ color: '#888' }}
                  >
                    စုစုပေါင်း
                  </div>
                  <div
                    className="text-xl font-bold mt-1"
                    style={{ color: '#ffc107' }}
                  >
                    {bets.length}
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs"
                    style={{ color: '#888' }}
                  >
                    အောင်လျှင်း
                  </div>
                  <div
                    className="text-xl font-bold mt-1"
                    style={{ color: '#00c853' }}
                  >
                    {bets.filter((b) => b.status === 'win').length}
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs"
                    style={{ color: '#888' }}
                  >
                    ရှုံးသွား
                  </div>
                  <div
                    className="text-xl font-bold mt-1"
                    style={{ color: '#ff3d00' }}
                  >
                    {bets.filter((b) => b.status === 'lost').length}
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
