// Storage Keys
export const STORAGE_KEYS = {
  WALLET: 'trx_wallet',
  BETS: 'trx_bets',
  FUND: 'trx_fund',
  FUND_LAST_EDIT: 'trx_fund_last_edit',
  DEPOSITS: 'trx_deposits',
  DEPOSIT_COUNT_TODAY: 'trx_deposit_count_today',
  DEPOSIT_LAST_DATE: 'trx_deposit_last_date',
  WITHDRAWALS: 'trx_withdrawals',
  USED_PASSWORD: 'trx_used_password',
  SOUND_ENABLED: 'trx_sound_enabled',
};

// Initialize default values
export function initializeStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.WALLET)) {
    localStorage.setItem(STORAGE_KEYS.WALLET, '0');
  }
  if (!localStorage.getItem(STORAGE_KEYS.FUND)) {
    localStorage.setItem(STORAGE_KEYS.FUND, '0');
  }
  if (!localStorage.getItem(STORAGE_KEYS.BETS)) {
    localStorage.setItem(STORAGE_KEYS.BETS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEPOSITS)) {
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.WITHDRAWALS)) {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED)) {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, 'true');
  }
  // Initialize empty results storage
  if (!localStorage.getItem('trx_results')) {
    localStorage.setItem('trx_results', '[]');
  }
}

// Wallet Operations
export function getWallet(): number {
  if (typeof window === 'undefined') return 0;
  return parseFloat(localStorage.getItem(STORAGE_KEYS.WALLET) || '0');
}

export function setWallet(amount: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.WALLET, amount.toString());
}

export function addToWallet(amount: number): void {
  const current = getWallet();
  setWallet(current + amount);
}

export function deductFromWallet(amount: number): boolean {
  const current = getWallet();
  if (current < amount) return false;
  setWallet(current - amount);
  return true;
}

// Fund Operations (Account Balance)
export function getFund(): number {
  if (typeof window === 'undefined') return 0;
  return parseFloat(localStorage.getItem(STORAGE_KEYS.FUND) || '0');
}

export function setFund(amount: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.FUND, amount.toString());
  localStorage.setItem(STORAGE_KEYS.FUND_LAST_EDIT, new Date().toISOString());
}

export function canEditFund(): boolean {
  if (typeof window === 'undefined') return false;
  const lastEdit = localStorage.getItem(STORAGE_KEYS.FUND_LAST_EDIT);
  if (!lastEdit) return true;

  const lastEditDate = new Date(lastEdit);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastEditDate.getTime()) / (1000 * 60 * 60 * 24));

  return daysDiff >= 30;
}

export function getFundEditCountdown(): { canEdit: boolean; daysRemaining: number } {
  if (typeof window === 'undefined') return { canEdit: true, daysRemaining: 0 };
  const lastEdit = localStorage.getItem(STORAGE_KEYS.FUND_LAST_EDIT);
  if (!lastEdit) return { canEdit: true, daysRemaining: 0 };

  const lastEditDate = new Date(lastEdit);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastEditDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 30 - daysDiff);

  return { canEdit: daysRemaining === 0, daysRemaining };
}

// Bet Operations
export interface Bet {
  id: string;
  period: string;
  val: string; // GREEN, RED, VIOLET, BIG, SMALL, or number
  amt: number;
  status: 'wait' | 'win' | 'lost'; // wait, win, lost
  createdAt: string;
  resultNumber?: number;
}

export function getBets(): Bet[] {
  if (typeof window === 'undefined') return [];
  const bets = localStorage.getItem(STORAGE_KEYS.BETS);
  return bets ? JSON.parse(bets) : [];
}

export function addBet(bet: Omit<Bet, 'id' | 'createdAt'>): Bet {
  const bets = getBets();
  const newBet: Bet = {
    ...bet,
    id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  bets.unshift(newBet);
  localStorage.setItem(STORAGE_KEYS.BETS, JSON.stringify(bets));
  return newBet;
}

export function updateBet(betId: string, updates: Partial<Bet>): void {
  const bets = getBets();
  const index = bets.findIndex((b) => b.id === betId);
  if (index !== -1) {
    bets[index] = { ...bets[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.BETS, JSON.stringify(bets));
  }
}

export function updateBetsByPeriod(period: string, resultNumber: number): void {
  const bets = getBets();
  bets.forEach((bet) => {
    if (bet.status === 'wait' && bet.period === period) {
      const isWin = checkBetWin(bet.val, resultNumber);
      bet.status = isWin ? 'win' : 'lost';
      bet.resultNumber = resultNumber;
      
      if (isWin) {
        const multiplier = isNaN(Number(bet.val)) ? 1.98 : 8.82;
        addToWallet(bet.amt * multiplier);
      }
    }
  });
  localStorage.setItem(STORAGE_KEYS.BETS, JSON.stringify(bets));
}

export function checkBetWin(betValue: string, resultNumber: number): boolean {
  if (betValue === 'BIG') return resultNumber >= 5;
  if (betValue === 'SMALL') return resultNumber < 5;
  if (betValue === 'GREEN') return [1, 3, 7, 9, 5].includes(resultNumber);
  if (betValue === 'RED') return [2, 4, 6, 8, 0].includes(resultNumber);
  if (betValue === 'VIOLET') return [0, 5].includes(resultNumber);
  if (!isNaN(Number(betValue))) return Number(betValue) === resultNumber;
  return false;
}

// Deposit Operations
export interface Deposit {
  id: string;
  amount: number;
  note: string;
  createdAt: string;
  date: string; // YYYY-MM-DD
}

export function getDeposits(): Deposit[] {
  if (typeof window === 'undefined') return [];
  const deposits = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
  return deposits ? JSON.parse(deposits) : [];
}

export function addDeposit(amount: number, note: string = ''): Deposit | null {
  if (typeof window === 'undefined') return null;

  // Check fund account balance
  const fund = getFund();
  if (fund < amount) {
    return null; // Insufficient fund balance
  }

  const today = new Date().toISOString().split('T')[0];
  const lastDate = localStorage.getItem(STORAGE_KEYS.DEPOSIT_LAST_DATE);
  let countToday = parseInt(localStorage.getItem(STORAGE_KEYS.DEPOSIT_COUNT_TODAY) || '0');

  if (lastDate !== today) {
    countToday = 0;
    localStorage.setItem(STORAGE_KEYS.DEPOSIT_LAST_DATE, today);
  }

  if (countToday >= 3) {
    return null; // Max 3 deposits per day
  }

  const deposits = getDeposits();
  const newDeposit: Deposit = {
    id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount,
    note,
    createdAt: new Date().toISOString(),
    date: today,
  };

  deposits.unshift(newDeposit);
  localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
  localStorage.setItem(STORAGE_KEYS.DEPOSIT_COUNT_TODAY, (countToday + 1).toString());

  // Deduct from fund account and add to wallet
  setFund(fund - amount);
  addToWallet(amount);

  return newDeposit;
}

export function getRemainingDepositsToday(): number {
  if (typeof window === 'undefined') return 0;

  const today = new Date().toISOString().split('T')[0];
  const lastDate = localStorage.getItem(STORAGE_KEYS.DEPOSIT_LAST_DATE);
  let countToday = parseInt(localStorage.getItem(STORAGE_KEYS.DEPOSIT_COUNT_TODAY) || '0');

  if (lastDate !== today) {
    countToday = 0;
  }

  return Math.max(0, 3 - countToday);
}

// Withdrawal Operations
export interface Withdrawal {
  id: string;
  amount: number;
  createdAt: string;
  date: string; // YYYY-MM-DD
}

export function getWithdrawals(): Withdrawal[] {
  if (typeof window === 'undefined') return [];
  const withdrawals = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
  return withdrawals ? JSON.parse(withdrawals) : [];
}

export function addWithdrawal(amount: number): Withdrawal | null {
  const wallet = getWallet();
  if (wallet < amount) return null;

  // Deduct from game account (wallet)
  deductFromWallet(amount);

  // Add the full withdrawn amount back to fund account
  const currentFund = getFund();
  setFund(currentFund + amount);

  const withdrawals = getWithdrawals();
  const newWithdrawal: Withdrawal = {
    id: `wd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount,
    createdAt: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
  };

  withdrawals.unshift(newWithdrawal);
  localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));

  return newWithdrawal;
}

// Sound Settings
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, enabled.toString());
}
