'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBets, Bet } from '@/lib/storage';
import { getBetStatusDisplay, getBetMultiplier } from '@/lib/trx-utils';
import { formatDate, formatTime, groupByDate } from '@/lib/sound';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ITEMS_PER_PAGE = 10;

type DateFilter = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';

// Helper to check if a date is within a range
function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

// Get date range for filter
function getDateRange(filter: DateFilter, customStart?: Date, customEnd?: Date): { start: Date; end: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1) };
    case 'thisWeek': {
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      return { start: startOfWeek, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
    }
    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: startOfMonth, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
    }
    case 'custom':
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd };
      }
      return null;
    default:
      return null;
  }
}

// Format date for display
function formatDateRange(start: Date, end: Date): string {
  const startStr = `${start.getDate()}/${start.getMonth() + 1}/${start.getFullYear()}`;
  const endStr = `${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
  if (startStr === endStr) return startStr;
  return `${startStr} - ${endStr}`;
}

export default function HistoryPage() {
  const router = useRouter();
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [filteredBets, setFilteredBets] = useState<Bet[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isRangeMode, setIsRangeMode] = useState(false);

  // Load all bets
  useEffect(() => {
    const bets = getBets();
    setAllBets(bets);
  }, []);

  // Apply filter when filter changes
  useEffect(() => {
    const range = getDateRange(dateFilter, customStartDate, customEndDate);
    if (!range) {
      setFilteredBets([]);
      return;
    }

    const filtered = allBets.filter(bet => {
      const betDate = new Date(bet.createdAt);
      return isDateInRange(betDate, range.start, range.end);
    });
    
    setFilteredBets(filtered);
    setCurrentPage(0);
  }, [allBets, dateFilter, customStartDate, customEndDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMatches = filteredBets.length;
    const totalBetAmount = filteredBets.reduce((sum, bet) => sum + bet.amt, 0);
    let totalWinAmount = 0;
    let totalLostAmount = 0;
    let winMatches = 0;
    let lostMatches = 0;

    filteredBets.forEach(bet => {
      if (bet.status === 'win') {
        const multiplier = getBetMultiplier(bet.val);
        const winAmount = Math.floor(bet.amt * multiplier);
        const profit = winAmount - bet.amt; // Net profit only (excluding stake)
        totalWinAmount += profit;
        winMatches++;
      } else if (bet.status === 'lost') {
        totalLostAmount += bet.amt;
        lostMatches++;
      }
    });

    const winRate = totalMatches > 0 ? (winMatches / totalMatches) * 100 : 0;
    const lostRate = totalMatches > 0 ? (lostMatches / totalMatches) * 100 : 0;

    return {
      totalMatches,
      totalBetAmount,
      totalWinAmount,
      totalLostAmount,
      winMatches,
      lostMatches,
      winRate,
      lostRate,
    };
  }, [filteredBets]);

  // Group filtered bets by date
  const groupedBets = useMemo(() => {
    const grouped = groupByDate(filteredBets);
    const dateOrder = [
      'Today',
      'Yesterday',
      ...Object.keys(grouped).filter(d => d !== 'Today' && d !== 'Yesterday'),
    ].filter(date => grouped[date]);
    return { grouped, dateOrder };
  }, [filteredBets]);

  // Flatten for pagination
  const flattenedBets = useMemo(() => {
    const result: (Bet & { date: string })[] = [];
    groupedBets.dateOrder.forEach(date => {
      groupedBets.grouped[date].forEach(bet => {
        result.push({ ...bet, date });
      });
    });
    return result;
  }, [groupedBets]);

  const totalPages = Math.ceil(flattenedBets.length / ITEMS_PER_PAGE);
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentBets = flattenedBets.slice(startIdx, endIdx);

  const handlePrevPage = () => setCurrentPage(Math.max(0, currentPage - 1));
  const handleNextPage = () => setCurrentPage(Math.min(totalPages - 1, currentPage + 1));

  const handleFilterChange = (value: string) => {
    setDateFilter(value as DateFilter);
    if (value !== 'custom') {
      setIsRangeMode(false);
    }
  };

  const handleCustomDateSelect = () => {
    if (customStartDate && customEndDate) {
      setDateFilter('custom');
      setCalendarOpen(false);
      setIsRangeMode(false);
    }
  };

  const resetFilter = () => {
    setDateFilter('today');
    setCustomStartDate(new Date());
    setCustomEndDate(new Date());
    setIsRangeMode(false);
  };

  const currentRange = getDateRange(dateFilter, customStartDate, customEndDate);
  const rangeDisplay = currentRange ? formatDateRange(currentRange.start, currentRange.end) : 'Select date range';

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
        
        {/* Filter Section */}
        <Card
          className="p-4 border"
          style={{
            background: '#1e2329',
            borderColor: '#222',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter size={16} style={{ color: '#ffc107' }} />
              <span className="text-sm font-semibold">Filter by date</span>
            </div>
            <button
              onClick={resetFilter}
              className="text-xs px-2 py-1 rounded"
              style={{ color: '#ffc107', background: 'rgba(255, 193, 7, 0.1)' }}
            >
              Reset
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {(['today', 'yesterday', 'thisWeek', 'thisMonth'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateFilter === filter
                    ? 'text-black'
                    : 'text-gray-400'
                }`}
                style={{
                  background: dateFilter === filter ? '#ffc107' : '#0f1419',
                  border: '1px solid #333',
                }}
              >
                {filter === 'today' ? 'ယနေ့' :
                 filter === 'yesterday' ? 'မနေ့က' :
                 filter === 'thisWeek' ? 'ဒီတစ်ပတ်' : 'ဒီလ'}
              </button>
            ))}
            
            {/* Custom Date Picker */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                    dateFilter === 'custom'
                      ? 'text-black'
                      : 'text-gray-400'
                  }`}
                  style={{
                    background: dateFilter === 'custom' ? '#ffc107' : '#0f1419',
                    border: '1px solid #333',
                  }}
                  onClick={() => {
                    setIsRangeMode(true);
                  }}
                >
                  <CalendarIcon size={12} />
                  {dateFilter === 'custom' ? rangeDisplay : 'သတ်မှတ်ရက်'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4" style={{ background: '#1e2329', borderColor: '#333' }}>
                  <div className="mb-3 text-sm text-white">Select Date Range</div>
                  <Calendar
                    mode="range"
                    selected={{
                      from: customStartDate,
                      to: customEndDate,
                    }}
                    onSelect={(range) => {
                      if (range?.from) setCustomStartDate(range.from);
                      if (range?.to) setCustomEndDate(range.to);
                    }}
                    numberOfMonths={2}
                    className="rounded-md"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => setCalendarOpen(false)}
                      className="flex-1"
                      style={{ background: '#333', color: '#fff' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCustomDateSelect}
                      className="flex-1"
                      style={{ background: '#ffc107', color: '#000' }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Active filter display */}
          {dateFilter === 'custom' && customStartDate && customEndDate && (
            <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
              <span>Selected: {rangeDisplay}</span>
              <button
                onClick={resetFilter}
                className="p-1 hover:opacity-80"
              >
                <X size={12} style={{ color: '#ffc107' }} />
              </button>
            </div>
          )}
        </Card>

        {/* Statistics Cards */}
        {filteredBets.length > 0 ? (
          <>
            {/* Main Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Played Matches */}
              <Card
                className="p-4 border"
                style={{
                  background: 'linear-gradient(135deg, #1e2329, #111)',
                  borderColor: '#ffc107',
                  borderBottomWidth: '3px',
                }}
              >
                <div className="text-xs text-gray-400 mb-1">ကစားခဲ့သောပွဲ</div>
                <div className="text-2xl font-bold text-white">{stats.totalMatches}</div>
              </Card>

              {/* Total Bet Amount */}
              <Card
                className="p-4 border"
                style={{
                  background: 'linear-gradient(135deg, #1e2329, #111)',
                  borderColor: '#ffc107',
                  borderBottomWidth: '3px',
                }}
              >
                <div className="text-xs text-gray-400 mb-1">စုစုပေါင်းထိုးကြေး</div>
                <div className="text-2xl font-bold text-white">{stats.totalBetAmount.toLocaleString()} MMK</div>
              </Card>
            </div>

            {/* Win Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Win Amount (Profit Only) */}
              <Card
                className="p-4 border"
                style={{
                  background: 'linear-gradient(135deg, #1a3a1a 0%, #0a1a0a 100%)',
                  borderColor: '#00c853',
                  borderBottomWidth: '3px',
                }}
              >
                <div className="text-xs text-gray-400 mb-1">စုစုပေါင်းအမြတ်</div>
                <div className="text-2xl font-bold" style={{ color: '#00c853' }}>
                  +{stats.totalWinAmount.toLocaleString()} MMK
                </div>
              </Card>

              {/* Win Matches */}
              <Card
                className="p-4 border"
                style={{
                  background: '#1e2329',
                  borderColor: '#00c853',
                  borderBottomWidth: '3px',
                }}
              >
                <div className="text-xs text-gray-400 mb-1">အောင်လျှင်းပွဲ</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{ color: '#00c853' }}>
                    {stats.winMatches}
                  </span>
                  <span className="text-sm" style={{ color: '#00c853' }}>
                    ({stats.winRate.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  / {stats.totalMatches} ပွဲ
                </div>
              </Card>
            </div>

            {/* Loss Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Lost Amount */}
              <Card
                className="p-4 border"
                style={{
                  background: 'linear-gradient(135deg, #3a1a1a 0%, #1a0a0a 100%)',
                  borderColor: '#ff3d00',
                  borderBottomWidth: '3px',
                }}
              >
                <div className="text-xs text-gray-400 mb-1">စုစုပေါင်းရှုံးငွေ</div>
                <div className="text-2xl font-bold" style={{ color: '#ff3d00' }}>
                  -{stats.totalLostAmount.toLocaleString()} MMK
                </div>
              </Card>

              {/* Lost Matches */}
              <Card
                className="p-4 border"
                style={{
                  background: '#1e2329',
                  borderColor: '#ff3d00',
                  borderBottomWidth: '3px',
                }}
              >
                <div className="text-xs text-gray-400 mb-1">ရှုံးသွားပွဲ</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{ color: '#ff3d00' }}>
                    {stats.lostMatches}
                  </span>
                  <span className="text-sm" style={{ color: '#ff3d00' }}>
                    ({stats.lostRate.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  / {stats.totalMatches} ပွဲ
                </div>
              </Card>
            </div>

            {/* Net Result Card */}
            <Card
              className="p-4 border"
              style={{
                background: '#0f1215',
                borderColor: '#333',
              }}
            >
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">အသားတင်ရလဒ်</div>
                <div className={`text-xl font-bold ${stats.totalWinAmount - stats.totalLostAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(stats.totalWinAmount - stats.totalLostAmount).toLocaleString()} MMK
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                (အနိုင်ရငွေ - ရှုံးငွေ)
              </div>
            </Card>
          </>
        ) : (
          <Card
            className="p-12 border text-center"
            style={{
              background: '#0f1215',
              borderColor: '#222',
            }}
          >
            <div style={{ color: '#555' }}>
              {allBets.length === 0 
                ? 'မှတ်တမ်းမရှိသေးပါ။' 
                : 'ရွေးချယ်ထားသော ရက်အပိုင်းအခြားတွင် မှတ်တမ်းမရှိပါ။'}
            </div>
          </Card>
        )}

        {/* Bet History List */}
        {filteredBets.length > 0 && (
          <>
            <div className="space-y-4">
              {currentBets.map((bet) => {
                const { text: statusText, color: statusColor } = getBetStatusDisplay(bet.status);
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
                      <div className="flex-1">
                        <div className="font-bold text-lg">{bet.val}</div>
                        <div className="text-xs mt-1" style={{ color: '#888' }}>
                          #{bet.period}
                        </div>
                        <div className="text-xs mt-1" style={{ color: '#555' }}>
                          {bet.date} • {formatTime(bet.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg" style={{ color: amountColor }}>
                          {amountText}
                        </div>
                        <div className="text-xs mt-1" style={{ color: '#555' }}>
                          {bet.amt.toLocaleString()} MMK
                        </div>
                        {bet.resultNumber !== undefined && (
                          <div className="text-xs mt-1 font-bold" style={{ color: '#ffc107' }}>
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
              <div className="flex items-center justify-between gap-2 mt-4">
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
                  <span className="font-bold" style={{ color: '#ffc107' }}>
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
          </>
        )}
      </div>
    </main>
  );
                      }
