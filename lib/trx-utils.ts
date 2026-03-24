// TRX API related utilities
export const TRX_API_URL = 'https://draw.ar-lottery01.com/TrxWinGo/TrxWinGo_1M/GetHistoryIssuePage.json';

export interface GameResult {
  issueNumber: string;
  number: number;
  openCode: string;
  createTime: number;
  endTime: number;
  status: number;
  color?: string;
}

// Store the latest API period for betting
let lastAPIPeriod: string | null = null;

// Fetch latest game results from API
export async function fetchGameResults(): Promise<GameResult[]> {
  try {
    const response = await fetch(`${TRX_API_URL}?t=${Date.now()}`);
    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    const results = data?.data?.list || [];
    
    // Update last API period with the latest result
    if (results.length > 0) {
      const sorted = [...results].sort((a, b) => {
        if (a.issueNumber.length === b.issueNumber.length) {
          return b.issueNumber.localeCompare(a.issueNumber);
        }
        return b.issueNumber.length - a.issueNumber.length;
      });
      lastAPIPeriod = sorted[0].issueNumber;
    }
    
    return results;
  } catch (e) {
    console.log('[v0] Error fetching game results:', e);
    return [];
  }
}

// Get the next period number based on API or local time
export function getNextPeriod(latestPeriod: string): string {
  try {
    const nextPeriod = BigInt(latestPeriod) + 1n;
    return nextPeriod.toString();
  } catch (e) {
    console.log('[v0] Error calculating next period:', e);
    return '0';
  }
}

// Get current period for betting - uses API period if available
export function getCurrentPeriodForBet(): string {
  if (lastAPIPeriod) {
    try {
      const nextPeriod = BigInt(lastAPIPeriod) + 1n;
      return nextPeriod.toString();
    } catch (e) {
      console.log('[v0] Error calculating next period from API:', e);
    }
  }
  // Fallback to local time
  return getCurrentPeriodFromLocalTime();
}

// Reset API period (useful for testing)
export function resetAPIPeriod(): void {
  lastAPIPeriod = null;
}

// Get the last API period (for debugging)
export function getLastAPIPeriod(): string | null {
  return lastAPIPeriod;
}

// Get countdown timer (seconds remaining in current period)
export function getCountdown(): number {
  const now = new Date();
  const seconds = now.getSeconds();
  return 60 - seconds;
}

// Get current period based on time
export function getCurrentPeriodTime(): { countdown: number; isLocked: boolean } {
  const countdown = getCountdown();
  const isLocked = countdown <= 10;
  return { countdown, isLocked };
}

// ========== MYANMAR TIME (UTC+6:30) FUNCTIONS ==========

// Get current period based on Myanmar local time (UTC+6:30) - FALLBACK ONLY
export function getCurrentPeriodFromLocalTime(): string {
  const now = new Date();
  
  const utcTime = now.getTime();
  const myanmarOffset = 6.5 * 60 * 60 * 1000;
  const myanmarTime = new Date(utcTime + myanmarOffset);
  
  const year = myanmarTime.getUTCFullYear();
  const month = String(myanmarTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(myanmarTime.getUTCDate()).padStart(2, '0');
  
  const minutesSinceMidnight = myanmarTime.getUTCHours() * 60 + myanmarTime.getUTCMinutes();
  const sequence = String(minutesSinceMidnight + 1).padStart(3, '0');
  
  return `${year}${month}${day}${sequence}`;
}

// Get period number from a Date object (Myanmar time)
export function getPeriodFromDate(date: Date): string {
  const myanmarOffset = 6.5 * 60 * 60 * 1000;
  const myanmarTime = new Date(date.getTime() + myanmarOffset);
  
  const year = myanmarTime.getUTCFullYear();
  const month = String(myanmarTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(myanmarTime.getUTCDate()).padStart(2, '0');
  
  const minutesSinceMidnight = myanmarTime.getUTCHours() * 60 + myanmarTime.getUTCMinutes();
  const sequence = String(minutesSinceMidnight + 1).padStart(3, '0');
  
  return `${year}${month}${day}${sequence}`;
}

// Get date string from period (YYYY-MM-DD) using Myanmar time
export function getDateFromPeriod(period: string): string {
  if (period.length < 8) return period;
  const year = period.substring(0, 4);
  const month = period.substring(4, 6);
  const day = period.substring(6, 8);
  return `${year}-${month}-${day}`;
}

// Get display date from period (Today, Yesterday, or DD/MM/YYYY)
export function getDisplayDateFromPeriod(period: string): string {
  const periodDate = getDateFromPeriod(period);
  
  const now = new Date();
  const myanmarOffset = 6.5 * 60 * 60 * 1000;
  const myanmarNow = new Date(now.getTime() + myanmarOffset);
  const todayStr = `${myanmarNow.getUTCFullYear()}-${String(myanmarNow.getUTCMonth() + 1).padStart(2, '0')}-${String(myanmarNow.getUTCDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(myanmarNow.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;
  
  if (periodDate === todayStr) return 'Today';
  if (periodDate === yesterdayStr) return 'Yesterday';
  
  const [year, month, day] = periodDate.split('-');
  return `${day}/${month}/${year}`;
}

// ========== END MYANMAR TIME FUNCTIONS ==========

// Color mapping for numbers — used only if API doesn't provide color
export function getNumberColor(num: number, apiColor?: string): string {
  if (apiColor) {
    const colorMap: Record<string, string> = {
      red: '#ff3d00',
      green: '#00c853',
      purple: '#d500f9',
      violet: '#d500f9',
      'red-purple': 'linear-gradient(to bottom right, #ff3d00 50%, #d500f9 50%)',
      'red-green': 'linear-gradient(to bottom right, #ff3d00 50%, #00c853 50%)',
      'green-purple': 'linear-gradient(to bottom right, #00c853 50%, #d500f9 50%)',
      'red-violet': 'linear-gradient(to bottom right, #ff3d00 50%, #d500f9 50%)',
      'green-violet': 'linear-gradient(to bottom right, #00c853 50%, #d500f9 50%)',
    };
    return colorMap[apiColor.toLowerCase()] || colorMap['red'] || '#333';
  }

  const colorMap: Record<number, string> = {
    0: 'linear-gradient(to bottom right, #ff3d00 50%, #d500f9 50%)',
    1: '#00c853',
    2: '#ff3d00',
    3: '#00c853',
    4: '#ff3d00',
    5: 'linear-gradient(to bottom right, #00c853 50%, #d500f9 50%)',
    6: '#ff3d00',
    7: '#00c853',
    8: '#ff3d00',
    9: '#00c853',
  };

  return colorMap[num] || '#333';
}

export function isColorBet(val: string): boolean {
  return ['GREEN', 'RED', 'VIOLET', 'BIG', 'SMALL'].includes(val);
}

export function getBetMultiplier(betValue: string): number {
  if (isColorBet(betValue)) {
    return 1.98;
  } else {
    return 8.82;
  }
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US');
}

export function getBetStatusDisplay(status: string): { text: string; color: string } {
  switch (status) {
    case 'wait':
      return { text: 'Pending', color: '#ffc107' };
    case 'win':
      return { text: 'Win', color: '#00c853' };
    case 'lost':
      return { text: 'Loss', color: '#ff3d00' };
    default:
      return { text: '---', color: '#888' };
  }
}

export function validateBetAmount(amount: number, wallet: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }
  if (amount > wallet) {
    return { valid: false, error: 'Insufficient balance' };
  }
  return { valid: true };
}

export function validateFundAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < 10000 || amount > 200000) {
    return { valid: false, error: 'Fund must be between 10,000 and 200,000 MMK' };
  }
  return { valid: true };
}

export function validateDepositAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < 10000 || amount > 100000) {
    return { valid: false, error: 'Deposit must be between 10,000 and 100,000 MMK' };
  }
  return { valid: true };
}

export function validateWithdrawalAmount(amount: number, wallet: number): { valid: boolean; error?: string } {
  if (amount < 100) {
    return { valid: false, error: 'Minimum withdrawal is 100 MMK' };
  }
  if (amount > wallet) {
    return { valid: false, error: 'Insufficient balance' };
  }
  return { valid: true };
}

export function storeGameResults(newResults: GameResult[]): void {
  try {
    const storedResults = localStorage.getItem('trx_results');
    let allResults: GameResult[] = storedResults ? JSON.parse(storedResults) : [];

    newResults.forEach((newResult) => {
      if (!allResults.find((r) => r.issueNumber === newResult.issueNumber)) {
        allResults.push(newResult);
      }
    });

    allResults.sort((a, b) => {
      if (a.issueNumber.length === b.issueNumber.length) {
        return b.issueNumber.localeCompare(a.issueNumber);
      }
      return b.issueNumber.length - a.issueNumber.length;
    });

    allResults = allResults.slice(0, 30);
    localStorage.setItem('trx_results', JSON.stringify(allResults));
  } catch (e) {
    console.log('[v0] Error storing results:', e);
  }
}

export function getStoredResults(): GameResult[] {
  try {
    const storedResults = localStorage.getItem('trx_results');
    return storedResults ? JSON.parse(storedResults) : [];
  } catch (e) {
    console.log('[v0] Error getting results:', e);
    return [];
  }
}
