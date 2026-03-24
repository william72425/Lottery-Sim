'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Filter, TrendingUp, TrendingDown, Tag, X, BarChart3, Edit2 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBets, getFund, Bet } from '@/lib/storage';
import { getBetStatusDisplay, getBetMultiplier, getDisplayDateFromPeriod, getDateFromPeriod } from '@/lib/trx-utils';
import { formatTime, groupByPeriodDate } from '@/lib/sound';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BetTagModal } from '@/components/bet-tag-modal';
import { TagType, TAGS, getBetNote, getBetNotes, getTagStats, BetNote, TagStats, getAllTags } from '@/lib/bet-notes';

const ITEMS_PER_PAGE = 10;

type DateFilter = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';
type TagFilter = 'all' | TagType | string;

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

// Streak Stats Interface
interface StreakStats {
  highestWinStreak: number;
  highestLoseStreak: number;
  winStreak3x: number;
  winStreak4x: number;
  winStreak5x: number;
  loseStreak3x: number;
  loseStreak4x: number;
  loseStreak5x: number;
}

// Calculate streak information based on TIME (minutes) difference
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
    };
  }

  const sortedBets = [...bets].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let currentStreak = 0;
  let currentStreakType: 'win' | 'lose' | null = null;
  let lastBetTime: Date | null = null;
  
  let highestWinStreak = 0;
  let highestLoseStreak = 0;
  let winStreak3x = 0;
  let winStreak4x = 0;
  let winStreak5x = 0;
  let loseStreak3x = 0;
  let loseStreak4x = 0;
  let loseStreak5x = 0;

  const recordStreak = (streak: number, type: 'win' | 'lose') => {
    if (type === 'win') {
      if (streak >= 3) winStreak3x++;
      if (streak >= 4) winStreak4x++;
      if (streak >= 5) winStreak5x++;
      highestWinStreak = Math.max(highestWinStreak, streak);
    } else {
      if (streak >= 3) loseStreak3x++;
      if (streak >= 4) loseStreak4x++;
      if (streak >= 5) loseStreak5x++;
      highestLoseStreak = Math.max(highestLoseStreak, streak);
    }
  };

  for (let i = 0; i < sortedBets.length; i++) {
    const bet = sortedBets[i];
    const isWin = bet.status === 'win';
    const isLoss = bet.status === 'lost';
    const isWait = bet.status === 'wait';
    const currentBetTime = new Date(bet.createdAt);

    if (isWait) continue;

    let timeGapMinutes = 0;
    if (lastBetTime) {
      timeGapMinutes = (currentBetTime.getTime() - lastBetTime.getTime()) / (1000 * 60);
    }

    const currentType = isWin ? 'win' : 'lose';
    const isStreakBrokenByTime = lastBetTime !== null && timeGapMinutes > 4;

    if (isStreakBrokenByTime) {
      if (currentStreak > 0 && currentStreakType) {
        recordStreak(currentStreak, currentStreakType);
      }
      currentStreak = 1;
      currentStreakType = currentType;
      lastBetTime = currentBetTime;
      continue;
    }

    if (currentStreakType === null) {
      currentStreak = 1;
      currentStreakType = currentType;
    } else if (currentStreakType === currentType) {
      currentStreak++;
    } else {
      if (currentStreak > 0) {
        recordStreak(currentStreak, currentStreakType);
      }
      currentStreak = 1;
      currentStreakType = currentType;
    }

    lastBetTime = currentBetTime;
  }

  if (currentStreak > 0 && currentStreakType) {
    recordStreak(currentStreak, currentStreakType);
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
  const [initialFund, setInitialFund] = useState(0);
  const [betNotes, setBetNotes] = useState<BetNote[]>([]);
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');
  const [selectedBetForTag, setSelectedBetForTag] = useState<Bet | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showTagDashboard, setShowTagDashboard] = useState(false);

  // Load all bets and initial fund
  useEffect(() => {
    const bets = getBets();
    setAllBets(bets);
    setBetNotes(getBetNotes());
    const fund = getFund();
    setInitialFund(fund);
  }, []);

  // Apply filters
  useEffect(() => {
    const range = getDateRange(dateFilter, customStartDate, customEndDate);
    if (!range) {
      setFilteredBets([]);
      return;
    }

    let filtered = allBets.filter(bet => {
      const betDate = new Date(bet.createdAt);
      return isDateInRange(betDate, range.start, range.end);
    });

    // Apply tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(bet => {
        const note = betNotes.find(n => n.betId === bet.id);
        if (note) {
          if (note.tag === 'custom') {
            return note.customTagId === tagFilter;
          }
          return note.tag === tagFilter;
        }
        return false;
      });
    }
    
    setFilteredBets(filtered);
    setCurrentPage(0);
  }, [allBets, dateFilter, customStartDate, customEndDate, tagFilter, betNotes]);

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

    const netProfit = totalWinAmount - totalLostAmount;
    const winRate = totalMatches > 0 ? (winMatches / totalMatches) * 100 : 0;
    const lostRate = totalMatches > 0 ? (lostMatches / totalMatches) * 100 : 0;
    const profitPercentage = initialFund > 0 ? (netProfit / initialFund) * 100 : 0;

    return {
      totalMatches,
      totalBetAmount,
      totalWinAmount,
      totalLostAmount,
      netProfit,
      winMatches,
      lostMatches,
      winRate,
      lostRate,
      profitPercentage,
      initialFund,
    };
  }, [filteredBets, initialFund]);

  // Calculate streak statistics
  const streakStats = useMemo(() => calculateStreakStats(filteredBets), [filteredBets]);

  // Calculate tag statistics
  const tagStats = useMemo(() => getTagStats(filteredBets, betNotes), [filteredBets, betNotes]);

  // Group filtered bets by date
  const groupedBets = useMemo(() => {
    const grouped: Record<string, Bet[]> = {};
    filteredBets.forEach(bet => {
      const date = new Date(bet.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey = '';
      if (date.toDateString() === today.toDateString()) dateKey = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) dateKey = 'Yesterday';
      else dateKey = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(bet);
    });
    
    const dateOrder = ['Today', 'Yesterday', ...Object.keys(grouped).filter(d => d !== 'Today' && d !== 'Yesterday')];
    return { grouped, dateOrder };
  }, [filteredBets]);

  // Flatten for pagination
  const flattenedBets = useMemo(() => {
    const result: (Bet & { date: string })[] = [];
    groupedBets.dateOrder.forEach(date => {
      groupedBets.grouped[date]?.forEach(bet => {
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
  };

  const handleCustomDateSelect = () => {
    if (customStartDate && customEndDate) {
      setDateFilter('custom');
      setCalendarOpen(false);
    }
  };

  const resetFilter = () => {
    setDateFilter('today');
    setTagFilter('all');
    setCustomStartDate(new Date());
    setCustomEndDate(new Date());
  };

  const handleBetTripleClick = (bet: Bet) => {
    if (bet.status === 'win' || bet.status === 'lost') {
      setSelectedBetForTag(bet);
      setShowTagModal(true);
    }
  };

  const refreshNotes = () => {
    setBetNotes(getBetNotes());
  };

  const currentRange = getDateRange(dateFilter, customStartDate, customEndDate);
  const rangeDisplay = currentRange ? formatDateRange(currentRange.start, currentRange.end) : 'Select date range';

  // Get all tags for filter dropdown
  const allTagsList = getAllTags();

  return (
    <main
      className="min-h-screen pb-20"
      style={{ 
        background: 'var(--theme-bg, #090b0d)', 
        color: 'var(--theme-fg, #fff)' 
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 border-b"
        style={{
          background: 'var(--theme-bg-secondary, #090b0d)',
          borderColor: 'var(--theme-border, #222)',
        }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={24} style={{ color: 'var(--theme-primary, #ffc107)' }} />
        </button>
        <h1 className="text-xl font-bold">Game History</h1>
      </div>

      {/* Content */}
      <div className="w-full max-w-md mx-auto px-2 pt-6 pb-20 space-y-4">
        
        {/* Filter Section */}
        <Card
          className="p-3 border"
          style={{
            background: 'var(--theme-card-bg, #1e2329)',
            borderColor: 'var(--theme-border, #222)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Filter size={14} style={{ color: 'var(--theme-primary, #ffc107)' }} />
              <span className="text-xs font-semibold">Filters</span>
            </div>
            <button
              onClick={resetFilter}
              className="text-xs px-2 py-0.5 rounded"
              style={{ color: 'var(--theme-primary, #ffc107)', background: 'rgba(255, 193, 7, 0.1)' }}
            >
              Reset All
            </button>
          </div>

          {/* Date Filter */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(['today', 'yesterday', 'thisWeek', 'thisMonth'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  dateFilter === filter ? 'text-black' : 'text-gray-400'
                }`}
                style={{
                  background: dateFilter === filter ? 'var(--theme-primary, #ffc107)' : 'var(--theme-bg-secondary, #0f1419)',
                  border: '1px solid var(--theme-border, #333)',
                }}
              >
                {filter === 'today' ? 'Today' :
                 filter === 'yesterday' ? 'Yesterday' :
                 filter === 'thisWeek' ? 'This Week' : 'This Month'}
              </button>
            ))}
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                    dateFilter === 'custom' ? 'text-black' : 'text-gray-400'
                  }`}
                  style={{
                    background: dateFilter === 'custom' ? 'var(--theme-primary, #ffc107)' : 'var(--theme-bg-secondary, #0f1419)',
                    border: '1px solid var(--theme-border, #333)',
                  }}
                >
                  <CalendarIcon size={12} />
                  {dateFilter === 'custom' ? rangeDisplay.slice(0, 12) : 'Custom'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3" style={{ background: 'var(--theme-card-bg, #1e2329)', borderColor: 'var(--theme-border, #333)' }}>
                  <div className="mb-2 text-xs text-white">Select Date Range</div>
                  <Calendar
                    mode="range"
                    selected={{ from: customStartDate, to: customEndDate }}
                    onSelect={(range) => {
                      if (range?.from) setCustomStartDate(range.from);
                      if (range?.to) setCustomEndDate(range.to);
                    }}
                    numberOfMonths={2}
                    className="rounded-md scale-90 origin-top-left"
                  />
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => setCalendarOpen(false)} className="flex-1 py-1 text-xs" style={{ background: '#333', color: '#fff', height: '32px' }}>Cancel</Button>
                    <Button onClick={handleCustomDateSelect} className="flex-1 py-1 text-xs" style={{ background: 'var(--theme-primary, #ffc107)', color: '#000', height: '32px' }}>Apply</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t" style={{ borderColor: 'var(--theme-border, #333)' }}>
            <Tag size={12} style={{ color: 'var(--theme-primary, #ffc107)' }} />
            <span className="text-xs text-gray-400">Tag:</span>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value as TagFilter)}
              className="text-xs rounded px-2 py-1 flex-1"
              style={{
                background: 'var(--theme-bg-secondary, #0f1419)',
                border: '1px solid var(--theme-border, #333)',
                color: 'var(--theme-fg, #fff)',
              }}
            >
              <option value="all">All Bets</option>
              {allTagsList.map((tag) => (
                <option key={tag.id} value={tag.id}>🏷️ {tag.name}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowTagDashboard(!showTagDashboard)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{
                background: showTagDashboard ? 'var(--theme-primary, #ffc107)' : 'var(--theme-bg-secondary, #0f1419)',
                color: showTagDashboard ? '#000' : 'var(--theme-fg-muted, #888)',
                border: '1px solid var(--theme-border, #333)',
              }}
            >
              <BarChart3 size={12} />
              Stats
            </button>
          </div>
        </Card>

        {/* Tag Statistics Dashboard */}
        {showTagDashboard && tagStats.some(s => s.totalCount > 0) && (
          <Card
            className="p-3 border"
            style={{
              background: 'var(--theme-card-bg, #1e2329)',
              borderColor: 'var(--theme-border, #222)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} style={{ color: 'var(--theme-primary, #ffc107)' }} />
              <span className="text-xs font-semibold">Tag Performance</span>
            </div>
            <div className="space-y-2">
              {tagStats.map((stat) => (
                <div key={stat.tagId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: stat.tagInfo.color }}
                    />
                    <span style={{ color: stat.tagInfo.color }}>{stat.tagInfo.name}</span>
                  </div>
                  <div className="flex gap-3">
                    <span style={{ color: '#00c853' }}>W:{stat.winCount}</span>
                    <span style={{ color: '#ff3d00' }}>L:{stat.loseCount}</span>
                    <span className="text-gray-400">{stat.totalCount} bets</span>
                    <span className={stat.winRate >= 50 ? 'text-green-500' : 'text-red-500'}>
                      {stat.winRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Statistics Cards */}
        {filteredBets.length > 0 ? (
          <>
            {/* Net Profit - Large Card at Top */}
            <Card
              className="p-4 border text-center"
              style={{
                background: stats.netProfit >= 0 
                  ? 'linear-gradient(135deg, #1a3a1a 0%, #0a1a0a 100%)'
                  : 'linear-gradient(135deg, #3a1a1a 0%, #1a0a0a 100%)',
                borderColor: stats.netProfit >= 0 ? '#00c853' : '#ff3d00',
                borderBottomWidth: '4px',
              }}
            >
              <div className="text-xs text-gray-300 mb-1">Net Profit</div>
              <div 
                className="text-4xl font-black"
                style={{ color: stats.netProfit >= 0 ? '#00c853' : '#ff3d00' }}
              >
                {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toLocaleString()} MMK
              </div>
              <div className="text-xs text-gray-400 mt-1">
                vs Fund ({stats.initialFund.toLocaleString()} MMK): 
                <span style={{ color: stats.profitPercentage >= 0 ? '#00c853' : '#ff3d00' }}>
                  {' '}{stats.profitPercentage >= 0 ? '+' : ''}{stats.profitPercentage.toFixed(2)}%
                </span>
              </div>
            </Card>

            {/* Row 1: Basic Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-2 border" style={{ background: 'var(--theme-card-bg, #1e2329)', borderColor: 'var(--theme-border, #222)' }}>
                <div className="text-[10px] text-gray-400">Played</div>
                <div className="text-lg font-bold text-white">{stats.totalMatches}</div>
              </Card>
              <Card className="p-2 border" style={{ background: 'var(--theme-card-bg, #1e2329)', borderColor: 'var(--theme-border, #222)' }}>
                <div className="text-[10px] text-gray-400">Total Bet</div>
                <div className="text-lg font-bold text-white">{stats.totalBetAmount.toLocaleString()}</div>
              </Card>
            </div>

            {/* Row 2: Win/Loss Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-2 border" style={{ background: '#1a3a1a', borderColor: '#00c853' }}>
                <div className="text-[10px] text-gray-300">Win</div>
                <div className="text-base font-bold" style={{ color: '#00c853' }}>+{stats.totalWinAmount.toLocaleString()}</div>
                <div className="text-[10px] text-gray-400">{stats.winMatches} matches ({stats.winRate.toFixed(1)}%)</div>
              </Card>
              <Card className="p-2 border" style={{ background: '#3a1a1a', borderColor: '#ff3d00' }}>
                <div className="text-[10px] text-gray-300">Loss</div>
                <div className="text-base font-bold" style={{ color: '#ff3d00' }}>-{stats.totalLostAmount.toLocaleString()}</div>
                <div className="text-[10px] text-gray-400">{stats.lostMatches} matches ({stats.lostRate.toFixed(1)}%)</div>
              </Card>
            </div>

            {/* Row 3: Streak Stats - Highest */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-2 border" style={{ background: '#0f5a2e', borderColor: '#00c853' }}>
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} style={{ color: '#00c853' }} />
                  <span className="text-[10px] text-gray-300">Highest Win Streak</span>
                </div>
                <div className="text-xl font-bold" style={{ color: '#00c853' }}>{streakStats.highestWinStreak}</div>
              </Card>
              <Card className="p-2 border" style={{ background: '#8b2c2c', borderColor: '#ff3d00' }}>
                <div className="flex items-center gap-1">
                  <TrendingDown size={12} style={{ color: '#ff3d00' }} />
                  <span className="text-[10px] text-gray-300">Highest Loss Streak</span>
                </div>
                <div className="text-xl font-bold" style={{ color: '#ff3d00' }}>{streakStats.highestLoseStreak}</div>
              </Card>
            </div>

            {/* Row 4: Multiplier Streak Stats */}
            <Card className="p-2 border" style={{ background: '#0f1215', borderColor: '#333' }}>
              <div className="text-[10px] text-gray-400 mb-1.5 text-center">Consecutive Wins / Losses</div>
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

                const betNote = betNotes.find(n => n.betId === bet.id);
                const tagInfo = betNote ? (betNote.tag === 'custom' 
                  ? getAllTags().find(t => t.id === betNote.customTagId)
                  : getAllTags().find(t => t.id === betNote.tag)) : null;

                return (
                  <Card
                    key={bet.id}
                    className="p-2 border cursor-pointer transition-all hover:opacity-80"
                    style={{
                      background: 'var(--theme-card-bg, #1e2329)',
                      borderColor: 'var(--theme-border, #222)',
                    }}
                    onDoubleClick={() => handleBetTripleClick(bet)}
                    title="Double-click to add/edit tag and note"
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
                            <Edit2 size={8} className="opacity-50" />
                          </div>
                        )}
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
                    background: 'var(--theme-primary, #ffc107)',
                    color: '#000',
                    height: '32px',
                  }}
                >
                  <ChevronLeft size={14} />
                  Prev
                </Button>

                <div className="flex-1 text-center">
                  <span className="text-xs font-bold" style={{ color: 'var(--theme-primary, #ffc107)' }}>
                    {currentPage + 1} / {totalPages}
                  </span>
                </div>

                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center gap-1 px-3 py-1 text-xs disabled:opacity-50"
                  style={{
                    background: 'var(--theme-primary, #ffc107)',
                    color: '#000',
                    height: '32px',
                  }}
                >
                  Next
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
                ? 'No history yet.' 
                : 'No bets found for the selected filters.'}
            </div>
          </Card>
        )}
      </div>

      {/* Tag Modal */}
      <BetTagModal
        isOpen={showTagModal}
        bet={selectedBetForTag}
        onClose={() => {
          setShowTagModal(false);
          setSelectedBetForTag(null);
        }}
        onSave={refreshNotes}
      />
    </main>
  );
}
