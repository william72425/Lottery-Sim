'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, X, TrendingUp, TrendingDown, Flame } from 'lucide-react';
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

// Calculate streak information with skip logic (1-3 skips don't break streak, 4+ skips break)
interface StreakStats {
  highestWinStreak: number;
  highestLoseStreak: number;
  winStreak3x: number;  // Number of times achieved 3 consecutive wins
  winStreak4x: number;  // Number of times achieved 4 consecutive wins
  winStreak5x: number;  // Number of times achieved 5 consecutive wins
  loseStreak3x: number; // Number of times achieved 3 consecutive losses
  loseStreak4x: number; // Number of times achieved 4 consecutive losses
  loseStreak5x: number; // Number of times achieved 5 consecutive losses
  currentWinStreak: number;
  currentLoseStreak: number;
}

function calculateStreakStats(bets: Bet[]): StreakStats {
  if (bets.length === 0) {
    return {
      highestWinStreak: 0,
      highestLoseStreak: 0,
      winStreak3x: 0,
      winStreak4x: 0,
      winStreak5x: 0,
      loseStreak3x: 0,
      loseStreak4x: 0,
      loseStreak5x: 0,
      currentWinStreak: 0,
      currentLoseStreak: 0,
    };
  }

  // Sort bets by createdAt (oldest first for streak calculation)
  const sortedBets = [...bets].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let currentStreak = 0;
  let currentStreakType: 'win' | 'lose' | null = null;
  let skipCount = 0;
  
  let highestWinStreak = 0;
  let highestLoseStreak = 0;
  let winStreak3x = 0;
  let winStreak4x = 0;
  let winStreak5x = 0;
  let loseStreak3x = 0;
  let loseStreak4x = 0;
  let loseStreak5x = 0;
  let currentWinStreak = 0;
  let currentLoseStreak = 0;

  for (let i = 0; i < sortedBets.length; i++) {
    const bet = sortedBets[i];
    const isWin = bet.status === 'win';
    const isLoss = bet.status === 'lost';
    const isWait = bet.status === 'wait';

    // If it's a waiting bet, skip it (not yet resolved)
    if (isWait) {
      continue;
    }

    if (isWin || isLoss) {
      const currentType = isWin ? 'win' : 'lose';
      
      // Check if we have a streak and how many skips occurred
      if (currentStreakType === currentType) {
        // Same streak continues
        currentStreak++;
        skipCount = 0;
      } else if (currentStreakType === null) {
        // Starting a new streak
        currentStreak = 1;
        currentStreakType = currentType;
        skipCount = 0;
      } else {
        // Different type - check if we should break the streak or not
        // If skipCount <= 3, streak continues (just change type)
        if (skipCount <= 3) {
          // Streak continues but type changes - record the previous streak first
          if (currentStreakType === 'win') {
            if (currentStreak >= 3) winStreak3x++;
            if (currentStreak >= 4) winStreak4x++;
            if (currentStreak >= 5) winStreak5x++;
            highestWinStreak = Math.max(highestWinStreak, currentStreak);
          } else {
            if (currentStreak >= 3) loseStreak3x++;
            if (currentStreak >= 4) loseStreak4x++;
            if (currentStreak >= 5) loseStreak5x++;
            highestLoseStreak = Math.max(highestLoseStreak, currentStreak);
          }
          // Start new streak
          currentStreak = 1;
          currentStreakType = currentType;
          skipCount = 0;
        } else {
          // Skip count > 3, break the streak
          // Record the previous streak
          if (currentStreakType === 'win') {
            if (currentStreak >= 3) winStreak3x++;
            if (currentStreak >= 4) winStreak4x++;
            if (currentStreak >= 5) winStreak5x++;
            highestWinStreak = Math.max(highestWinStreak, currentStreak);
          } else if (currentStreakType === 'lose') {
            if (currentStreak >= 3) loseStreak3x++;
            if (currentStreak >= 4) loseStreak4x++;
            if (currentStreak >= 5) loseStreak5x++;
            highestLoseStreak = Math.max(highestLoseStreak, currentStreak);
          }
          // Start new streak with current bet
          currentStreak = 1;
          currentStreakType = currentType;
          skipCount = 0;
        }
      }
    } else {
      // This bet is not win/loss (shouldn't happen), count as skip
      skipCount++;
    }
  }

  // Record the last streak
  if (currentStreakType === 'win') {
    if (currentStreak >= 3) winStreak3x++;
    if (currentStreak >= 4) winStreak4x++;
    if (currentStreak >= 5) winStreak5x++;
    highestWinStreak = Math.max(highestWinStreak, currentStreak);
    currentWinStreak = currentStreak;
  } else if (currentStreakType === 'lose') {
    if (currentStreak >= 3) loseStreak3x++;
    if (currentStreak >= 4) loseStreak4x++;
    if (currentStreak >= 5) loseStreak5x++;
    highestLoseStreak = Math.max(highestLoseStreak, currentStreak);
    currentLoseStreak = currentStreak;
  }

  return {
    highestWinStreak,
    highestLoseStreak,
    winStreak3x,
    winStreak4x,
    winStreak5x,
    loseStreak3x,
    loseStreak4x,
    loseStreak5x,
    currentWinStreak,
    currentLoseStreak,
  };
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
        const profit = winAmount - bet.amt;
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

  // Calculate streak statistics
  const streakStats = useMemo(() => calculateStreakStats(filteredBets), [filteredBets]);

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
      <div className="w-full max-w-md mx-auto px-2 pt-6 pb-20 space-y-4">
        
        {/* Filter Section */}
        <Card
          className="p-3 border"
          style={{
            background: '#1e2329',
            borderColor: '#222',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Filter size={14} style={{ color: '#ffc107' }} />
              <span className="text-xs font-semibold">Filter by date</span>
            </div>
            <button
              onClick={resetFilter}
              className="text-xs px-2 py-0.5 rounded"
              style={{ color: '#ffc107', background: 'rgba(255, 193, 7, 0.1)' }}
            >
              Reset
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {(['today', 'yesterday', 'thisWeek', 'thisMonth'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
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
                  {dateFilter === 'custom' ? rangeDisplay.slice(0, 12) : 'သတ်မှတ်ရက်'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3" style={{ background: '#1e2329', borderColor: '#333' }}>
                  <div className="mb-2 text-xs text-white">Select Date Range</div>
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
                    className="rounded-md scale-90 origin-top-left"
                  />
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => setCalendarOpen(false)}
                      className="flex-1 py-1 text-xs"
                      style={{ background: '#333', color: '#fff', height: '32px' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCustomDateSelect}
                      className="flex-1 py-1 text-xs"
                      style={{ background: '#ffc107', color: '#000', height: '32px' }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </Card>

        {/* Statistics Cards - Compact Grid */}
        {filteredBets.length > 0 ? (
          <>
            {/* Row 1: Basic Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-2 border" style={{ background: '#1e2329', borderColor: '#222' }}>
                <div className="text-[10px] text-gray-400">ကစားပွဲ</div>
                <div className="text-lg font-bold text-white">{stats.totalMatches}</div>
              </Card>
              <Card className="p-2 border" style={{ background: '#1e2329', borderColor: '#222' }}>
                <div className="text-[10px] text-gray-400">စုစုပေါင်းထိုးကြေး</div>
                <div className="text-lg font-bold text-white">{stats.totalBetAmount.toLocaleString()}</div>
              </Card>
            </div>

            {/* Row 2: Win/Loss Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-2 border" style={{ background: '#1a3a1a', borderColor: '#00c853' }}>
                <div className="text-[10px] text-gray-300">အမြတ်</div>
                <div className="text-base font-bold" style={{ color: '#00c853' }}>+{stats.totalWinAmount.toLocaleString()}</div>
                <div className="text-[10px] text-gray-400">{stats.winMatches} ပွဲ ({stats.winRate.toFixed(1)}%)</div>
              </Card>
              <Card className="p-2 border" style={{ background: '#3a1a1a', borderColor: '#ff3d00' }}>
                <div className="text-[10px] text-gray-300">ရှုံး</div>
                <div className="text-base font-bold" style={{ color: '#ff3d00' }}>-{stats.totalLostAmount.toLocaleString()}</div>
                <div className="text-[10px] text-gray-400">{stats.lostMatches} ပွဲ ({stats.lostRate.toFixed(1)}%)</div>
              </Card>
            </div>

            {/* Row 3: Streak Stats - Highest */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-2 border" style={{ background: '#0f5a2e', borderColor: '#00c853' }}>
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} style={{ color: '#00c853' }} />
                  <span className="text-[10px] text-gray-300">အမြင့်ဆုံးအနိုင်စဉ်</span>
                </div>
                <div className="text-xl font-bold" style={{ color: '#00c853' }}>{streakStats.highestWinStreak}</div>
              </Card>
              <Card className="p-2 border" style={{ background: '#8b2c2c', borderColor: '#ff3d00' }}>
                <div className="flex items-center gap-1">
                  <TrendingDown size={12} style={{ color: '#ff3d00' }} />
                  <span className="text-[10px] text-gray-300">အမြင့်ဆုံးအရှုံးစဉ်</span>
                </div>
                <div className="text-xl font-bold" style={{ color: '#ff3d00' }}>{streakStats.highestLoseStreak}</div>
              </Card>
            </div>

            {/* Row 4: Current Streak */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-2 border" style={{ background: '#1e2329', borderColor: '#00c853' }}>
                <div className="flex items-center gap-1">
                  <Flame size={12} style={{ color: '#ffc107' }} />
                  <span className="text-[10px] text-gray-300">လက်ရှိအနိုင်စဉ်</span>
                </div>
                <div className="text-lg font-bold" style={{ color: '#00c853' }}>{streakStats.currentWinStreak}</div>
              </Card>
              <Card className="p-2 border" style={{ background: '#1e2329', borderColor: '#ff3d00' }}>
                <div className="flex items-center gap-1">
                  <Flame size={12} style={{ color: '#ffc107' }} />
                  <span className="text-[10px] text-gray-300">လက်ရှိအရှုံးစဉ်</span>
                </div>
                <div className="text-lg font-bold" style={{ color: '#ff3d00' }}>{streakStats.currentLoseStreak}</div>
              </Card>
            </div>

            {/* Row 5: Multiplier Streak Stats */}
            <Card className="p-2 border" style={{ background: '#0f1215', borderColor: '#333' }}>
              <div className="text-[10px] text-gray-400 mb-1.5 text-center">စဉ်ဆက်အနိုင်/အရှုံးများ</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-gray-500">3x</div>
                  <div className="flex justify-center gap-2">
                    <span className="text-xs font-bold" style={{ color: '#00c853' }}>{streakStats.winStreak3x}</span>
                    <span className="text-xs text-gray-500">/</span>
                    <span className="text-xs font-bold" style={{ color: '#ff3d00' }}>{streakStats.loseStreak3x}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">4x</div>
                  <div className="flex justify-center gap-2">
                    <span className="text-xs font-bold" style={{ color: '#00c853' }}>{streakStats.winStreak4x}</span>
                    <span className="text-xs text-gray-500">/</span>
                    <span className="text-xs font-bold" style={{ color: '#ff3d00' }}>{streakStats.loseStreak4x}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">5x</div>
                  <div className="flex justify-center gap-2">
                    <span className="text-xs font-bold" style={{ color: '#00c853' }}>{streakStats.winStreak5x}</span>
                    <span className="text-xs text-gray-500">/</span>
                    <span className="text-xs font-bold" style={{ color: '#ff3d00' }}>{streakStats.loseStreak5x}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Bet History List */}
            <div className="space-y-2">
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
                    className="p-2 border"
                    style={{
                      background: '#1e2329',
                      borderColor: '#222',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-bold text-sm">{bet.val}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: '#888' }}>
                          #{bet.period}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: '#555' }}>
                          {bet.date} • {formatTime(bet.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm" style={{ color: amountColor }}>
                          {amountText}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: '#555' }}>
                          {bet.amt.toLocaleString()} MMK
                        </div>
                        {bet.resultNumber !== undefined && (
                          <div className="text-[10px] mt-0.5 font-bold" style={{ color: '#ffc107' }}>
                            {bet.resultNumber}
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
              <div className="flex items-center justify-between gap-2 mt-2">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="flex items-center gap-1 px-3 py-1 text-xs disabled:opacity-50"
                  style={{
                    background: '#ffc107',
                    color: '#000',
                    height: '32px',
                  }}
                >
                  <ChevronLeft size={14} />
                  အရှေ့
                </Button>

                <div className="flex-1 text-center">
                  <span className="text-xs font-bold" style={{ color: '#ffc107' }}>
                    {currentPage + 1} / {totalPages}
                  </span>
                </div>

                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center gap-1 px-3 py-1 text-xs disabled:opacity-50"
                  style={{
                    background: '#ffc107',
                    color: '#000',
                    height: '32px',
                  }}
                >
                  အနောက်
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card
            className="p-8 border text-center"
            style={{
              background: '#0f1215',
              borderColor: '#222',
            }}
          >
            <div className="text-xs" style={{ color: '#555' }}>
              {allBets.length === 0 
                ? 'မှတ်တမ်းမရှိသေးပါ။' 
                : 'ရွေးချယ်ထားသော ရက်အပိုင်းအခြားတွင် မှတ်တမ်းမရှိပါ။'}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
                                   }
