'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  fetchGameResults,
  getNextPeriod,
  getCurrentPeriodTime,
  storeGameResults,
  getCurrentPeriodForBet,
} from '@/lib/trx-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/trx/header';
import { BettingInterface } from '@/components/trx/betting-interface';
import { BetHistory } from '@/components/trx/bet-history';
import { ResultModal } from '@/components/trx/result-modal';
import { NavigationMenu } from '@/components/trx/navigation-menu';
import { ResultsDisplay } from '@/components/trx/results-display';
import {
  getWallet,
  getBets,
  updateBetsByPeriod,
  initializeStorage,
  Bet,
  setWallet,
} from '@/lib/storage';
import { playTickSound } from '@/lib/sound';
import {
  Trophy,
  Star,
  TrendingUp,
  Calendar,
  Flame,
  Award,
  ChevronRight,
  Target,
  Zap,
  Crown,
  Shield,
} from 'lucide-react';

// Types for VIP levels and badges
type VIPLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
type BadgeKey =
  | 'luckyStreak'
  | 'highRoller'
  | 'comebackKing'
  | 'earlyBird'
  | 'persistence';

interface BadgeInfo {
  key: BadgeKey;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

// VIP level definitions (in MMK)
const VIP_LEVELS: Record<VIPLevel, { min: number; max: number; perks: string[]; color: string }> = {
  Bronze: { min: 0, max: 1000000, perks: ['Basic user'], color: '#cd7f32' },
  Silver: { min: 1000001, max: 10000000, perks: ['5% Daily Cashback'], color: '#c0c0c0' },
  Gold: { min: 10000001, max: 50000000, perks: ['10% Daily Cashback', 'Special Badge'], color: '#ffd700' },
  Platinum: { min: 50000001, max: Infinity, perks: ['15% Daily Cashback', 'VIP Support Icon'], color: '#e5e4e2' },
};

// Badge definitions
const BADGES: Record<BadgeKey, BadgeInfo> = {
  luckyStreak: {
    key: 'luckyStreak',
    name: 'Lucky Streak',
    description: 'Win 5 times in a row',
    icon: <Flame className="w-5 h-5" />,
    color: '#ff6b6b',
  },
  highRoller: {
    key: 'highRoller',
    name: 'High Roller',
    description: 'Place a single bet of over 1,000,000 MMK',
    icon: <TrendingUp className="w-5 h-5" />,
    color: '#ffc107',
  },
  comebackKing: {
    key: 'comebackKing',
    name: 'Comeback King',
    description: 'Win a bet after losing 3 times in a row',
    icon: <Zap className="w-5 h-5" />,
    color: '#4caf50',
  },
  earlyBird: {
    key: 'earlyBird',
    name: 'Early Bird',
    description: 'Place your first bet of the day',
    icon: <Calendar className="w-5 h-5" />,
    color: '#2196f3',
  },
  persistence: {
    key: 'persistence',
    name: 'Persistence',
    description: 'Play for 7 consecutive days',
    icon: <Award className="w-5 h-5" />,
    color: '#9c27b0',
  },
};

// Helper to get date string (YYYY-MM-DD)
function getDateKey(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// Helper to sort results by issueNumber (newest first)
function sortResultsNewestFirst(results: any[]): any[] {
  if (!results || results.length === 0) return results;
  return [...results].sort((a, b) => {
    if (a.issueNumber.length === b.issueNumber.length) {
      return b.issueNumber.localeCompare(a.issueNumber);
    }
    return b.issueNumber.length - a.issueNumber.length;
  });
}

// Compute VIP stats from a total bet amount
function computeVIPStats(total: number) {
  let level: VIPLevel = 'Bronze';
  if (total >= VIP_LEVELS.Platinum.min) level = 'Platinum';
  else if (total >= VIP_LEVELS.Gold.min) level = 'Gold';
  else if (total >= VIP_LEVELS.Silver.min) level = 'Silver';

  let nextMin: number | null = null;
  if (level === 'Bronze') nextMin = VIP_LEVELS.Silver.min;
  else if (level === 'Silver') nextMin = VIP_LEVELS.Gold.min;
  else if (level === 'Gold') nextMin = VIP_LEVELS.Platinum.min;

  let progress = 100;
  if (nextMin && total < nextMin) {
    const currentMin = VIP_LEVELS[level].min;
    const range = nextMin - currentMin;
    progress = Math.min(100, Math.max(0, ((total - currentMin) / range) * 100));
  }

  return { level, nextMin, progress };
}

export default function Home() {
  const [wallet, setWalletState] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [period, setPeriod] = useState('0');
  const [countdown, setCountdown] = useState(60);
  const [isLocked, setIsLocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [resultBet, setResultBet] = useState<Bet | undefined>();
  const [resultNumber, setResultNumber] = useState<number | undefined>();
  const [showResultModal, setShowResultModal] = useState(false);

  // VIP & Badges state
  const [totalBetAmount, setTotalBetAmount] = useState(0);
  const [vipLevel, setVipLevel] = useState<VIPLevel>('Bronze');
  const [nextLevelRequirement, setNextLevelRequirement] = useState<number | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<BadgeKey[]>([]);

  // Stable refs
  const lastCheckedPeriodRef = useRef('');
  const earnedBadgesRef = useRef<BadgeKey[]>([]);

  earnedBadgesRef.current = earnedBadges;

  const refreshWalletAndBets = useCallback(() => {
    setWalletState(getWallet());
    setBets(getBets());
  }, []);

  const updateVIPStats = useCallback(() => {
    const allBets = getBets();
    const total = allBets.reduce((sum, bet) => sum + (Number(bet.amt) || 0), 0);
    const { level, nextMin, progress } = computeVIPStats(total);
    setTotalBetAmount(total);
    setVipLevel(level);
    setNextLevelRequirement(nextMin);
    setProgressPercentage(progress);
  }, []);

  const updateBadges = useCallback(() => {
    const currentBets = getBets();
    if (currentBets.length === 0) return;

    const sorted = [...currentBets].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const newBadges: BadgeKey[] = [...earnedBadgesRef.current];

    let winStreak = 0;
    for (const bet of sorted) {
      if (bet.status === 'win') {
        winStreak++;
        if (winStreak >= 5 && !newBadges.includes('luckyStreak')) {
          newBadges.push('luckyStreak');
        }
      } else if (bet.status === 'lost') {
        winStreak = 0;
      }
    }

    if (currentBets.some(bet => Number(bet.amt) > 1000000) && !newBadges.includes('highRoller')) {
      newBadges.push('highRoller');
    }

    let lossStreak = 0;
    for (const bet of sorted) {
      if (bet.status === 'lost') {
        lossStreak++;
      } else if (bet.status === 'win') {
        if (lossStreak >= 3 && !newBadges.includes('comebackKing')) {
          newBadges.push('comebackKing');
        }
        lossStreak = 0;
      } else {
        lossStreak = 0;
      }
    }

    if (currentBets.length > 0 && !newBadges.includes('earlyBird')) {
      newBadges.push('earlyBird');
    }

    const uniqueDates = new Set<string>();
    currentBets.forEach(bet => {
      uniqueDates.add(getDateKey(bet.createdAt));
    });
    const dates = Array.from(uniqueDates).sort();
    let maxConsecutive = 1, cur = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / (1000 * 3600 * 24);
      if (diff === 1) cur++;
      else cur = 1;
      maxConsecutive = Math.max(maxConsecutive, cur);
    }
    if (maxConsecutive >= 7 && !newBadges.includes('persistence')) {
      newBadges.push('persistence');
    }

    if (JSON.stringify(newBadges) !== JSON.stringify(earnedBadgesRef.current)) {
      earnedBadgesRef.current = newBadges;
      setEarnedBadges(newBadges);
      localStorage.setItem('earnedBadges', JSON.stringify(newBadges));
    }
  }, []);

  const syncData = useCallback(async () => {
    try {
      const results = await fetchGameResults();
      if (results.length === 0) return;

      const sortedResults = sortResultsNewestFirst(results);
      storeGameResults(sortedResults);

      const latestResult = sortedResults[0];
      const nextPeriod = getNextPeriod(latestResult.issueNumber);
      setPeriod(prev => (prev === nextPeriod ? prev : nextPeriod));

      const currentBets = getBets();
      let shouldShowResult = false;
      let betPeriodMatch: Bet | undefined;

      currentBets.forEach((bet) => {
        if (
          bet.status === 'wait' &&
          bet.period === latestResult.issueNumber &&
          lastCheckedPeriodRef.current !== latestResult.issueNumber
        ) {
          shouldShowResult = true;
          betPeriodMatch = bet;
        }
      });

      updateBetsByPeriod(latestResult.issueNumber, latestResult.number);
      refreshWalletAndBets();

      if (shouldShowResult && betPeriodMatch) {
        const updatedBets = getBets();
        const updatedBet = updatedBets.find((b) => b.id === betPeriodMatch!.id);
        if (updatedBet) {
          setResultBet(updatedBet);
          setResultNumber(latestResult.number);
          setShowResultModal(true);
          lastCheckedPeriodRef.current = latestResult.issueNumber;
        }
      }
    } catch (error) {
      // silent
    }
  }, [refreshWalletAndBets]);

  useEffect(() => {
    initializeStorage();
    refreshWalletAndBets();
    updateVIPStats();
    updateBadges();

    const storedBadges = localStorage.getItem('earnedBadges');
    if (storedBadges) {
      try {
        const parsed = JSON.parse(storedBadges);
        earnedBadgesRef.current = parsed;
        setEarnedBadges(parsed);
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    syncData();
  }, []);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const { countdown: cd, isLocked: locked } = getCurrentPeriodTime();
      setCountdown(cd);
      setIsLocked(locked);
      if (cd <= 10 && cd > 0) {
        playTickSound(cd);
      }
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    const syncInterval = setInterval(() => {
      syncData();
    }, 5000);
    return () => clearInterval(syncInterval);
  }, [syncData]);

  useEffect(() => {
    const vipInterval = setInterval(() => {
      updateVIPStats();
      updateBadges();
    }, 5 * 60 * 1000);
    return () => clearInterval(vipInterval);
  }, [updateVIPStats, updateBadges]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bets' || e.key === 'wallet') {
        refreshWalletAndBets();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshWalletAndBets]);

  useEffect(() => {
    const handleBetPlaced = () => {
      refreshWalletAndBets();
      updateVIPStats();
    };
    window.addEventListener('betPlaced', handleBetPlaced);
    return () => window.removeEventListener('betPlaced', handleBetPlaced);
  }, [refreshWalletAndBets, updateVIPStats]);

  const handleBetPlaced = () => {
    setTimeout(() => {
      refreshWalletAndBets();
      updateVIPStats();
      window.dispatchEvent(new Event('betPlaced'));
    }, 50);
  };

  const handleBalanceUpdate = (newBalance: number) => {
    setWalletState(newBalance);
    setWallet(newBalance);
    window.dispatchEvent(new StorageEvent('storage', { key: 'wallet' }));
  };

  return (
    <main
      className="min-h-screen pb-20"
      style={{ 
        background: 'var(--theme-bg, #090b0d)', 
        color: 'var(--theme-fg, #fff)' 
      }}
    >
      <Header
        walletBalance={wallet}
        onMenuClick={() => setShowMenu(!showMenu)}
        onBalanceUpdate={handleBalanceUpdate}
      />

      <NavigationMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />

      <div className="w-full max-w-md mx-auto px-2 pt-20">
        {/* Balance Card */}
        <Card
          className="p-6 mb-6 border"
          style={{
            background: 'linear-gradient(135deg, var(--theme-card-bg, #1e2329), var(--theme-bg-secondary, #111))',
            borderColor: 'var(--theme-primary, #ffc107)',
            borderBottomWidth: '4px',
          }}
        >
          <div className="text-center">
            <div
              className="text-5xl font-black"
              style={{ color: 'var(--theme-primary, #ffc107)' }}
            >
              {wallet.toLocaleString()}
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--theme-fg-muted, #666)' }}>
              Balance (MMK)
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="game" className="w-full">
          <TabsList
            className="grid w-full grid-cols-4 mb-6"
            style={{ background: 'var(--theme-card-bg, #1e2329)' }}
          >
            <TabsTrigger
              value="game"
              style={{
                borderRadius: '10px',
                backgroundColor: 'transparent',
                fontSize: '12px',
                color: 'var(--theme-fg, #fff)',
              }}
            >
              Betting
            </TabsTrigger>
            <TabsTrigger
              value="results"
              style={{
                borderRadius: '10px',
                backgroundColor: 'transparent',
                fontSize: '12px',
                color: 'var(--theme-fg, #fff)',
              }}
            >
              Results
            </TabsTrigger>
            <TabsTrigger
              value="history"
              style={{
                borderRadius: '10px',
                backgroundColor: 'transparent',
                fontSize: '12px',
                color: 'var(--theme-fg, #fff)',
              }}
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              style={{
                borderRadius: '10px',
                backgroundColor: 'transparent',
                fontSize: '12px',
                color: 'var(--theme-fg, #fff)',
              }}
            >
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Game Tab */}
          <TabsContent value="game">
            <BettingInterface
              period={period}
              countdown={countdown}
              isLocked={isLocked}
              onBetPlaced={handleBetPlaced}
            />

            <div className="mt-8">
              <h3
                className="text-sm font-bold mb-4"
                style={{ color: 'var(--theme-primary, #ffc107)' }}
              >
                My Bets
              </h3>
              <BetHistory bets={bets.slice(0, 10)} />
              
              {/* Credit Section */}
              <div className="mt-6 text-center">
                <div className="text-xs text-gray-500 mb-1">Optimized & added much features by</div>
                <div className="text-base font-bold tracking-wide" style={{ color: 'var(--theme-primary, #ffc107)' }}>
                  William
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1 flex-wrap">
                  <a 
                    href="https://t.me/william815" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline transition-all"
                    style={{ color: '#888' }}
                  >
                    @william815
                  </a>
                  <span style={{ color: '#555' }}>•</span>
                  <span>with thanks to</span>
                  <a 
                    href="https://t.me/Zen_th76" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline transition-all"
                    style={{ color: '#888' }}
                  >
                    @Zen_th76
                  </a>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <div className="mt-4">
              <ResultsDisplay />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <BetHistory bets={bets} maxItems={30} />
          </TabsContent>

          {/* Profile / Rewards Tab */}
          <TabsContent value="profile">
            <div className="mt-4 space-y-6">
              {/* VIP Section */}
              <Card 
                className="p-5 border" 
                style={{ 
                  background: 'var(--theme-card-bg, #111)', 
                  borderColor: 'var(--theme-card-border, #333)' 
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5" style={{ color: 'var(--theme-primary, #ffc107)' }} />
                  <h3 className="text-lg font-bold" style={{ color: 'var(--theme-fg, #fff)' }}>VIP Status</h3>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm" style={{ color: 'var(--theme-fg-muted, #aaa)' }}>Current Level</span>
                    <span className="text-xl font-bold" style={{ color: VIP_LEVELS[vipLevel].color }}>
                      {vipLevel}
                    </span>
                  </div>
                  <div className="w-full rounded-full h-2.5 mb-2" style={{ background: 'var(--theme-bg-secondary, #333)' }}>
                    <div
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--theme-primary, #ffc107)' }}
                    />
                  </div>
                  {nextLevelRequirement && totalBetAmount < nextLevelRequirement && (
                    <p className="text-xs" style={{ color: 'var(--theme-fg-muted, #aaa)' }}>
                      Need {(nextLevelRequirement - totalBetAmount).toLocaleString()} more MMK to reach next level
                    </p>
                  )}
                  {!nextLevelRequirement && totalBetAmount > 0 && (
                    <p className="text-xs" style={{ color: 'var(--theme-primary, #ffc107)' }}>Maximum level reached!</p>
                  )}
                  {totalBetAmount === 0 && (
                    <p className="text-xs" style={{ color: 'var(--theme-fg-muted, #aaa)' }}>Place your first bet to start your VIP journey!</p>
                  )}
                </div>

                <div className="text-sm mb-2" style={{ color: 'var(--theme-fg-muted, #aaa)' }}>Total Bet Amount:</div>
                <div className="text-2xl font-mono mb-4" style={{ color: 'var(--theme-fg, #fff)' }}>
                  {totalBetAmount.toLocaleString()} MMK
                </div>

                <div className="border-t pt-4" style={{ borderColor: 'var(--theme-card-border, #333)' }}>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-fg-muted, #aaa)' }}>VIP Perks:</h4>
                  <ul className="space-y-1">
                    {VIP_LEVELS[vipLevel].perks.map((perk, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm" style={{ color: 'var(--theme-fg, #ddd)' }}>
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-primary, #ffc107)' }} />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              {/* Badges Section */}
              <Card 
                className="p-5 border" 
                style={{ 
                  background: 'var(--theme-card-bg, #111)', 
                  borderColor: 'var(--theme-card-border, #333)' 
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5" style={{ color: 'var(--theme-primary, #ffc107)' }} />
                  <h3 className="text-lg font-bold" style={{ color: 'var(--theme-fg, #fff)' }}>Achievements</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.values(BADGES).map((badge) => {
                    const isEarned = earnedBadges.includes(badge.key);
                    return (
                      <div
                        key={badge.key}
                        className={`p-3 rounded-lg flex items-center gap-3 transition-all ${
                          isEarned ? '' : 'opacity-60'
                        }`}
                        style={{ 
                          background: isEarned ? 'var(--theme-bg-secondary, #2a2a2a)' : 'var(--theme-bg-secondary, #1a1a1a)',
                          borderLeft: `3px solid ${isEarned ? badge.color : '#444'}`
                        }}
                      >
                        <div className={isEarned ? 'text-yellow-400' : 'text-gray-600'}>
                          {badge.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold" style={{ color: 'var(--theme-fg, #fff)' }}>{badge.name}</div>
                          <div className="text-xs" style={{ color: 'var(--theme-fg-muted, #aaa)' }}>{badge.description}</div>
                        </div>
                        {isEarned && (
                          <div className="text-yellow-400">
                            <Star className="w-4 h-4 fill-yellow-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Result Modal */}
      <ResultModal
        isOpen={showResultModal}
        bet={resultBet}
        resultNumber={resultNumber}
        onClose={() => {
          setShowResultModal(false);
          setResultBet(undefined);
          setResultNumber(undefined);
        }}
      />
    </main>
  );
}
