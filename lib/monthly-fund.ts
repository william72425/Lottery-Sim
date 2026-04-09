// lib/monthly-fund.ts

export interface FundAddition {
  id: string;
  amount: number;
  note: string;
  createdAt: string;
}

export interface FundHistoryEntry {
  id: string;
  type: 'set' | 'add' | 'edit';
  previousAmount?: number;
  newAmount: number;
  note: string;
  createdAt: string;
}

export interface MonthlyFund {
  year: number;
  month: number;
  initialFund: number;
  additions: FundAddition[];
  history: FundHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// Storage key
const MONTHLY_FUND_KEY = 'monthly_funds';

// Get all monthly funds
export function getMonthlyFunds(): MonthlyFund[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(MONTHLY_FUND_KEY);
  return data ? JSON.parse(data) : [];
}

// Get fund for specific month
export function getMonthlyFund(year: number, month: number): MonthlyFund | null {
  const funds = getMonthlyFunds();
  return funds.find(f => f.year === year && f.month === month) || null;
}

// Get current month and year
export function getCurrentMonthYear(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

// Set initial fund for a month (NO 30-DAY LIMIT - can edit anytime)
export function setInitialMonthlyFund(year: number, month: number, amount: number, note?: string): MonthlyFund {
  const funds = getMonthlyFunds();
  const existingIndex = funds.findIndex(f => f.year === year && f.month === month);
  
  const now = new Date().toISOString();
  const historyEntry: FundHistoryEntry = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: existingIndex !== -1 ? 'edit' : 'set',
    previousAmount: existingIndex !== -1 ? funds[existingIndex].initialFund : undefined,
    newAmount: amount,
    note: note || (existingIndex !== -1 ? 'Edited initial fund amount' : 'Initial fund set'),
    createdAt: now,
  };
  
  if (existingIndex !== -1) {
    // Update existing
    funds[existingIndex].initialFund = amount;
    funds[existingIndex].history.push(historyEntry);
    funds[existingIndex].updatedAt = now;
    localStorage.setItem(MONTHLY_FUND_KEY, JSON.stringify(funds));
    return funds[existingIndex];
  } else {
    // Create new
    const newFund: MonthlyFund = {
      year,
      month,
      initialFund: amount,
      additions: [],
      history: [historyEntry],
      createdAt: now,
      updatedAt: now,
    };
    funds.push(newFund);
    localStorage.setItem(MONTHLY_FUND_KEY, JSON.stringify(funds));
    return newFund;
  }
}

// Add additional fund to a month
export function addToMonthlyFund(year: number, month: number, amount: number, note: string): MonthlyFund | null {
  const funds = getMonthlyFunds();
  const index = funds.findIndex(f => f.year === year && f.month === month);
  
  if (index === -1) {
    return null;
  }
  
  const now = new Date().toISOString();
  const addition: FundAddition = {
    id: `fund_add_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    amount,
    note: note.trim() || 'Additional fund',
    createdAt: now,
  };
  
  const historyEntry: FundHistoryEntry = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: 'add',
    newAmount: amount,
    note: note.trim() || 'Additional fund added',
    createdAt: now,
  };
  
  funds[index].additions.push(addition);
  funds[index].history.push(historyEntry);
  funds[index].updatedAt = now;
  
  localStorage.setItem(MONTHLY_FUND_KEY, JSON.stringify(funds));
  return funds[index];
}

// Get total fund for a month (initial + all additions)
export function getTotalMonthlyFund(year: number, month: number): number {
  const fund = getMonthlyFund(year, month);
  if (!fund) return 0;
  
  const additionsTotal = fund.additions.reduce((sum, add) => sum + add.amount, 0);
  return fund.initialFund + additionsTotal;
}

// Get total fund for a specific date (uses the month of that date)
export function getFundForDate(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return getTotalMonthlyFund(year, month);
}

// Get fund for current month
export function getCurrentMonthTotalFund(): number {
  const { year, month } = getCurrentMonthYear();
  return getTotalMonthlyFund(year, month);
}

// Check if month has fund set
export function hasMonthlyFund(year: number, month: number): boolean {
  return getMonthlyFund(year, month) !== null;
}

// Get fund history for display
export interface FundHistoryDisplay {
  year: number;
  month: number;
  monthName: string;
  initialFund: number;
  additions: FundAddition[];
  history: FundHistoryEntry[];
  totalFund: number;
}

export function getFundHistory(): FundHistoryDisplay[] {
  const funds = getMonthlyFunds();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return funds
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })
    .map(fund => ({
      year: fund.year,
      month: fund.month,
      monthName: `${monthNames[fund.month - 1]} ${fund.year}`,
      initialFund: fund.initialFund,
      additions: fund.additions,
      history: fund.history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      totalFund: fund.initialFund + fund.additions.reduce((sum, add) => sum + add.amount, 0),
    }));
}

// Get recent fund activities (for current month)
export function getRecentActivities(limit: number = 10): FundHistoryEntry[] {
  const { year, month } = getCurrentMonthYear();
  const fund = getMonthlyFund(year, month);
  if (!fund) return [];
  
  return fund.history
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// Format date and time
export function formatFundDateTime(isoString: string): string {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
