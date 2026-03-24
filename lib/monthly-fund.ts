export interface MonthlyFund {
  year: number;
  month: number;
  initialFund: number;
  additions: FundAddition[];
  createdAt: string;
  updatedAt: string;
}

export interface FundAddition {
  id: string;
  amount: number;
  note: string;
  createdAt: string;
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

// Set initial fund for a month (only if not exists)
export function setInitialMonthlyFund(year: number, month: number, amount: number): MonthlyFund | null {
  const funds = getMonthlyFunds();
  const existing = funds.find(f => f.year === year && f.month === month);
  
  if (existing) {
    // Cannot change initial fund once set
    return null;
  }
  
  const newFund: MonthlyFund = {
    year,
    month,
    initialFund: amount,
    additions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  funds.push(newFund);
  localStorage.setItem(MONTHLY_FUND_KEY, JSON.stringify(funds));
  return newFund;
}

// Add additional fund to a month
export function addToMonthlyFund(year: number, month: number, amount: number, note: string): MonthlyFund | null {
  const funds = getMonthlyFunds();
  const index = funds.findIndex(f => f.year === year && f.month === month);
  
  if (index === -1) {
    return null;
  }
  
  const addition: FundAddition = {
    id: `fund_add_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    amount,
    note: note.trim() || 'Additional fund',
    createdAt: new Date().toISOString(),
  };
  
  funds[index].additions.push(addition);
  funds[index].updatedAt = new Date().toISOString();
  
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
export interface FundHistoryEntry {
  year: number;
  month: number;
  monthName: string;
  initialFund: number;
  additions: FundAddition[];
  totalFund: number;
}

export function getFundHistory(): FundHistoryEntry[] {
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
      totalFund: fund.initialFund + fund.additions.reduce((sum, add) => sum + add.amount, 0),
    }));
  }
