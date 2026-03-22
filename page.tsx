'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  fetchGameResults,
  getNextPeriod,
  getCurrentPeriodTime,
  storeGameResults,
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
    // String comparison works correctly for same-length numeric strings
    if (a.issueNumber.length === b.issueNumber.length) {
      return b.issueNumber.localeCompare(a.issueNumber);
    }
    // Different lengths: longer number is bigger
    return b.issueNumber.length - a.issueNumber.length;
  });
}

// Compute VIP stats from a total bet amount (pure, no setState)
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

  // Stable refs — avoids stale closure issues without recreating callbacks
  const lastCheckedPeriodRef = useRef('');
  const earnedBadgesRef = useRef<BadgeKey[]>([]);

  // Keep ref in sync with state (no extra render)
  earnedBadgesRef.current = earnedBadges;

  // ─── Stable: refresh wallet + bets only ───────────────────────────────────
  const refreshWalletAndBets = useCallback(() => {
    setWalletState(getWallet());
    setBets(getBets());
  }, []);

  // ─── Stable: update VIP stats (reads from storage, updates state) ─────────
  const updateVIPStats = useCallback(() => {
    const allBets = getBets();
    const total = allBets.reduce((sum, bet) => sum + (Number(bet.amt) || 0), 0);
    const { level, nextMin, progress } = computeVIPStats(total);
    setTotalBetAmount(total);
    setVipLevel(level);
    setNextLevelRequirement(nextMin);
    setProgressPercentage(progress);
  }, []);

  // ─── Stable: update badges (uses ref for current earned badges) ───────────
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

  // ─── Stable: sync results from API ───────────────────────────────────────
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
      // silent — network errors are expected occasionally
    }
  }, [refreshWalletAndBets]);

  // ─── Mount: initialize storage, load data once ────────────────────────────
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount

  // ─── Initial API sync on mount ────────────────────────────────────────────
  useEffect(() => {
    syncData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount

  // ─── Countdown + tick sound for last 10 seconds ───────────────────────────
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const { countdown: cd, isLocked: locked } = getCurrentPeriodTime();
      setCountdown(cd);
      setIsLocked(locked);
      // Play a tick sound every second when 10 or fewer seconds remain
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

  // ─── VIP stats: update every 5 minutes ────────────────────────────────────
  useEffect(() => {
    const vipInterval = setInterval(() => {
      updateVIPStats();
      updateBadges();
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(vipInterval);
  }, [updateVIPStats, updateBadges]);

  // ─── Listen for storage changes (cross-tab) ───────────────────────────────
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bets' || e.key === 'wallet') {
        refreshWalletAndBets();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshWalletAndBets]);

  // ─── Listen for betPlaced event ───────────────────────────────────────────
  useEffect(() => {
    const handleBetPlaced = () => {
      refreshWalletAndBets();
      // Also update VIP immediately when a bet is placed
      updateVIPStats();
    };
    window.addEventListener('betPlaced', handleBetPlaced);
    return () => window.removeEventListener('betPlaced', handleBetPlaced);
  }, [refreshWalletAndBets, updateVIPStats]);

  // Handler for when a bet is placed
  const handleBetPlaced = () => {
    setTimeout(() => {
      refreshWalletAndBets();
      updateVIPStats();
      window.dispatchEvent(new Event('betPlaced'));
    }, 50);
  };

  // Handler for deposit/withdraw
  const handleBalanceUpdate = (newBalance: number) => {
    setWalletState(newBalance);
    setWallet(newBalance);
    window.dispatchEvent(new StorageEvent('storage', { key: 'wallet' }));
  };

  return (
    <main
      className="min-h-screen pb-20"
      style={{ background: '#090b0d', color: '#fff' }}
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
            background: 'linear-gradient(135deg, #1e2329, #111)',
            borderColor: '#ffc107',
            borderBottomWidth: '4px',
          }}
        >
          <div className="text-center">
            <div
              className="text-5xl font-black"
              style={{ color: '#ffc107' }}
            >
              {wallet.toLocaleString()}
            </div>
            <div className="text-xs mt-2" style={{ color: '#666' }}>
              Balance (MMK)
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="game" className="w-full">
          <TabsList
            className="grid w-full grid-cols-4 mb-6"
            style={{ background: '#1e2329' }}
          >
            <TabsTrigger
              value="game"
              className="text-white"
              style={{
                borderRadius: '10px',
                backgroundColor: 'transparent',
                fontSize: '12px',
              }}
            >
              Betting
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="text-white"
              style={{
                borderRadius: '10px',
                backgroundColor: 'transparent',
                fontSize: '12px',
              }}
            >
              Results
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="text-white"
              style={{
                borderRadius: '10px',
                backgroundColor: 'transparent',
                fontSize: '12px',
              }}
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="text-white"
              style={{
                borderRadius: '10px',
                backgroundColor: 'transparent',
                fontSize: '12px',
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
                style={{ color: '#ffc107' }}
              >
                My Bets
              </h3>
              <BetHistory bets={bets.slice(0, 10)} />
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
              <Card className="p-5 border border-gray-800" style={{ background: '#111' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5" style={{ color: '#ffc107' }} />
                  <h3 className="text-lg font-bold text-white">VIP Status</h3>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Current Level</span>
                    <span className="text-xl font-bold" style={{ color: VIP_LEVELS[vipLevel].color }}>
                      {vipLevel}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2.5 mb-2">
                    <div
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%`, backgroundColor: '#ffc107' }}
                    />
                  </div>
                  {nextLevelRequirement && totalBetAmount < nextLevelRequirement && (
                    <p className="text-xs text-gray-300">
                      Need {(nextLevelRequirement - totalBetAmount).toLocaleString()} more MMK to reach next level
                    </p>
                  )}
                  {!nextLevelRequirement && totalBetAmount > 0 && (
                    <p className="text-xs text-yellow-500">Maximum level reached!</p>
                  )}
                  {totalBetAmount === 0 && (
                    <p className="text-xs text-gray-400">Place your first bet to start your VIP journey!</p>
                  )}
                </div>

                <div className="text-sm text-gray-300 mb-2">Total Bet Amount:</div>
                <div className="text-2xl font-mono mb-4 text-white">
                  {totalBetAmount.toLocaleString()} MMK
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <h4 className="text-sm font-semibold mb-2 text-gray-300">VIP Perks:</h4>
                  <ul className="space-y-1">
                    {VIP_LEVELS[vipLevel].perks.map((perk, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-200">
                        <ChevronRight className="w-4 h-4" style={{ color: '#ffc107' }} />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              {/* Badges Section */}
              <Card className="p-5 border border-gray-800" style={{ background: '#111' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5" style={{ color: '#ffc107' }} />
                  <h3 className="text-lg font-bold text-white">Achievements</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.values(BADGES).map((badge) => {
                    const isEarned = earnedBadges.includes(badge.key);
                    return (
                      <div
                        key={badge.key}
                        className={`p-3 rounded-lg flex items-center gap-3 transition-all ${
                          isEarned ? 'bg-gray-800/50' : 'bg-gray-900 opacity-60'
                        }`}
                        style={{ borderLeft: `3px solid ${isEarned ? badge.color : '#444'}` }}
                      >
                        <div className={isEarned ? 'text-yellow-400' : 'text-gray-600'}>
                          {badge.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{badge.name}</div>
                          <div className="text-xs text-gray-400">{badge.description}</div>
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
