import { isSoundEnabled } from './storage';
import { getDisplayDateFromPeriod } from './trx-utils';

// Create Web Audio API sounds programmatically
function playTone(frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine') {
  if (!isSoundEnabled()) return;

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.log('[v0] Audio context error:', e);
  }
}

export function playWinSound() {
  if (!isSoundEnabled()) return;

  setTimeout(() => playTone(523.25, 0.2), 0);
  setTimeout(() => playTone(659.25, 0.2), 150);
  setTimeout(() => playTone(783.99, 0.3), 300);
}

export function playLoseSound() {
  if (!isSoundEnabled()) return;

  setTimeout(() => playTone(392, 0.2), 0);
  setTimeout(() => playTone(329.63, 0.2), 150);
  setTimeout(() => playTone(293.66, 0.3), 300);
}

export function playNotificationSound() {
  if (!isSoundEnabled()) return;

  playTone(800, 0.15, 'square');
}

export function playTickSound(secondsLeft: number) {
  if (!isSoundEnabled()) return;

  if (secondsLeft <= 3) {
    playTone(1200, 0.08, 'square');
  } else {
    playTone(880, 0.07, 'triangle');
  }
}

// Format time from ISO string (local time)
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Format date using period number (more accurate than createdAt)
export function formatDateFromPeriod(period: string): string {
  return getDisplayDateFromPeriod(period);
}

// Legacy formatDate function (kept for compatibility)
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = date.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

// Group bets by date using period number
export function groupByPeriodDate(bets: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  bets.forEach((bet) => {
    const date = formatDateFromPeriod(bet.period);
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(bet);
  });

  return grouped;
}

// Legacy groupByDate function (kept for compatibility)
export function groupByDate(items: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  items.forEach((item) => {
    const date = formatDate(item.createdAt);
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(item);
  });

  return grouped;
}
