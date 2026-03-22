// TRX API related utilities
export const TRX_API_URL = 'https://draw.ar-lottery01.com/TrxWinGo/TrxWinGo_1M/GetHistoryIssuePage.json';

export interface GameResult {
  issueNumber: string;
  number: number;
  openCode: string;
  createTime: number;
  endTime: number;
  status: number;
  color?: string; // API may return color (red, green, purple, or mix)
}

// Fetch latest game results from API
export async function fetchGameResults(): Promise<GameResult[]> {
  try {
    const response = await fetch(`${TRX_API_URL}?t=${Date.now()}`);
    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    return data?.data?.list || [];
  } catch (e) {
    console.log('[v0] Error fetching game results:', e);
    return [];
  }
}

// Get the next period number (BigInt to handle large numbers)
export function getNextPeriod(latestPeriod: string): string {
  try {
    const nextPeriod = BigInt(latestPeriod) + 1n;
    return nextPeriod.toString();
  } catch (e) {
    console.log('[v0] Error calculating next period:', e);
    return '0';
  }
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

// Color mapping for numbers — used only if API doesn't provide color
// API color format: 'red', 'green', 'purple', or mixed like 'red-purple'
export function getNumberColor(num: number, apiColor?: string): string {
  // If API provided a color, map it to hex
  if (apiColor) {
    const colorMap: Record<string, string> = {
      red: '#ff3d00',
      green: '#00c853',
      purple: '#d500f9',
      'red-purple': 'linear-gradient(to bottom right, #ff3d00 50%, #d500f9 50%)',
      'red-green': 'linear-gradient(to bottom right, #ff3d00 50%, #00c853 50%)',
      'green-purple': 'linear-gradient(to bottom right, #00c853 50%, #d500f9 50%)',
      violet: '#d500f9',
      'red-violet': 'linear-gradient(to bottom right, #ff3d00 50%, #d500f9 50%)',
      'green-violet': 'linear-gradient(to bottom right, #00c853 50%, #d500f9 50%)',
    };
    return colorMap[apiColor.toLowerCase()] || colorMap['red'] || '#333';
  }

  // Fallback: use hardcoded mapping by number if no API color
  const colorMap: Record<number, string> = {
    0: 'linear-gradient(to bottom right, #ff3d00 50%, #d500f9 50%)', // Red + Violet
    1: '#00c853', // Green
    2: '#ff3d00', // Red
    3: '#00c853', // Green
    4: '#ff3d00', // Red
    5: 'linear-gradient(to bottom right, #00c853 50%, #d500f9 50%)', // Green + Violet
    6: '#ff3d00', // Red
    7: '#00c853', // Green
    8: '#ff3d00', // Red
    9: '#00c853', // Green
  };

  return colorMap[num] || '#333';
}

// Check if bet is a color bet
export function isColorBet(val: string): boolean {
  return ['GREEN', 'RED', 'VIOLET', 'BIG', 'SMALL'].includes(val);
}

// Get multiplier for a bet type
export function getBetMultiplier(betValue: string): number {
  if (isColorBet(betValue)) {
    return 1.98; // Color bets pay ~2x
  } else {
    return 8.82; // Number bets pay ~9x
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US');
}

// Get bet status display
export function getBetStatusDisplay(status: string): { text: string; color: string } {
  switch (status) {
    case 'wait':
      return { text: 'စောင့်ဆိုင်းဆဲ', color: '#ffc107' };
    case 'win':
      return { text: 'အောင်လျှင်း', color: '#00c853' };
    case 'lost':
      return { text: 'ရှုံးသွား', color: '#ff3d00' };
    default:
      return { text: '---', color: '#888' };
  }
}

// Validate bet amount
export function validateBetAmount(amount: number, wallet: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'မှားယွင်းတဲ့ပမ္ဆာဏ' };
  }
  if (amount > wallet) {
    return { valid: false, error: 'လက်ကျန်ငွေ မလုံလောက်ပါ' };
  }
  return { valid: true };
}

// Validate fund amount
export function validateFundAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < 10000 || amount > 200000) {
    return { valid: false, error: 'ရန်ပုံငွေ 10,000 နှင့် 200,000 အကြားရှိရမည်' };
  }
  return { valid: true };
}

// Validate deposit amount
export function validateDepositAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < 10000 || amount > 100000) {
    return { valid: false, error: 'ဒီပို 10,000 နှင့် 100,000 အကြားရှိရမည်' };
  }
  return { valid: true };
}

// Validate withdrawal amount
export function validateWithdrawalAmount(amount: number, wallet: number): { valid: boolean; error?: string } {
  if (amount < 100) {
    return { valid: false, error: 'အနည်းဆုံး 100 ထုတ်ယူရမည်' };
  }
  if (amount > wallet) {
    return { valid: false, error: 'လက်ကျန်ငွေ မလုံလောက်ပါ' };
  }
  return { valid: true };
}

// Store results in localStorage (keep up to 30 results for 3 pages)
// Results are always stored newest-first (highest issueNumber at index 0)
export function storeGameResults(newResults: GameResult[]): void {
  try {
    const storedResults = localStorage.getItem('trx_results');
    let allResults: GameResult[] = storedResults ? JSON.parse(storedResults) : [];

    // Merge: add new results that don't already exist
    newResults.forEach((newResult) => {
      if (!allResults.find((r) => r.issueNumber === newResult.issueNumber)) {
        allResults.push(newResult);
      }
    });

    // Always sort descending by issueNumber so newest is at index 0
    // Use BigInt for large numbers or string comparison for same-length numbers
    allResults.sort((a, b) => {
      // If same length, string comparison works correctly for numeric strings
      if (a.issueNumber.length === b.issueNumber.length) {
        return b.issueNumber.localeCompare(a.issueNumber);
      }
      // Different lengths: longer number is bigger
      return b.issueNumber.length - a.issueNumber.length;
    });

    // Keep only the latest 30 results (3 pages × 10 per page)
    allResults = allResults.slice(0, 30);

    localStorage.setItem('trx_results', JSON.stringify(allResults));
  } catch (e) {
    console.log('[v0] Error storing results:', e);
  }
}

// Get stored results
export function getStoredResults(): GameResult[] {
  try {
    const storedResults = localStorage.getItem('trx_results');
    return storedResults ? JSON.parse(storedResults) : [];
  } catch (e) {
    console.log('[v0] Error getting results:', e);
    return [];
  }
}
