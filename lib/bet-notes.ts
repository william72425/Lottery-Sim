import { Bet } from './storage';

export type TagType = 'trend-follow' | 'trend-reverse' | 'zigzag' | 'mindset' | 'custom';

export interface CustomTag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface BetNote {
  betId: string;
  tag: TagType;
  customTagId?: string; // For custom tags
  note?: string;
  createdAt: string;
}

export interface TagInfo {
  id: TagType | string;
  name: string;
  description?: string;
  color: string;
  bgColor: string;
  isCustom?: boolean;
}

// Default tags
const DEFAULT_TAGS: TagInfo[] = [
  {
    id: 'trend-follow',
    name: 'Trend Follow',
    description: 'Following the current winning pattern',
    color: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.15)',
  },
  {
    id: 'trend-reverse',
    name: 'Trend Reverse',
    description: 'Betting against the current trend',
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.15)',
  },
  {
    id: 'zigzag',
    name: 'Zig-Zag Pattern',
    description: 'Betting on alternating patterns',
    color: '#2196f3',
    bgColor: 'rgba(33, 150, 243, 0.15)',
  },
  {
    id: 'mindset',
    name: 'Mindset',
    description: 'Emotional or psychological decision',
    color: '#9c27b0',
    bgColor: 'rgba(156, 39, 176, 0.15)',
  },
];

// Storage keys
const BET_NOTES_KEY = 'bet_notes';
const CUSTOM_TAGS_KEY = 'custom_tags';

// Get all custom tags
export function getCustomTags(): CustomTag[] {
  if (typeof window === 'undefined') return [];
  const tags = localStorage.getItem(CUSTOM_TAGS_KEY);
  return tags ? JSON.parse(tags) : [];
}

// Add custom tag
export function addCustomTag(name: string, color: string): CustomTag {
  const tags = getCustomTags();
  const newTag: CustomTag = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    color,
    createdAt: new Date().toISOString(),
  };
  tags.push(newTag);
  localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
  return newTag;
}

// Delete custom tag
export function deleteCustomTag(tagId: string): void {
  const tags = getCustomTags();
  const filtered = tags.filter(t => t.id !== tagId);
  localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(filtered));
  
  // Also remove any bet notes using this custom tag
  const notes = getBetNotes();
  const updatedNotes = notes.filter(n => !(n.tag === 'custom' && n.customTagId === tagId));
  localStorage.setItem(BET_NOTES_KEY, JSON.stringify(updatedNotes));
}

// Get all tags (default + custom)
export function getAllTags(): TagInfo[] {
  const defaultTags = [...DEFAULT_TAGS];
  const customTags = getCustomTags();
  const customTagInfos: TagInfo[] = customTags.map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    bgColor: `${tag.color}26`, // 15% opacity
    isCustom: true,
  }));
  return [...defaultTags, ...customTagInfos];
}

// Get tag info by id
export function getTagInfo(tagId: string): TagInfo | undefined {
  return getAllTags().find(t => t.id === tagId);
}

// Get all bet notes
export function getBetNotes(): BetNote[] {
  if (typeof window === 'undefined') return [];
  const notes = localStorage.getItem(BET_NOTES_KEY);
  return notes ? JSON.parse(notes) : [];
}

// Get note for a specific bet
export function getBetNote(betId: string): BetNote | undefined {
  const notes = getBetNotes();
  return notes.find(n => n.betId === betId);
}

// Add or update note for a bet
export function setBetNote(betId: string, tag: TagType, customTagId?: string, note?: string): void {
  const notes = getBetNotes();
  const existingIndex = notes.findIndex(n => n.betId === betId);
  
  const newNote: BetNote = {
    betId,
    tag,
    customTagId,
    note: note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    notes[existingIndex] = newNote;
  } else {
    notes.push(newNote);
  }
  
  localStorage.setItem(BET_NOTES_KEY, JSON.stringify(notes));
}

// Remove note for a bet
export function removeBetNote(betId: string): void {
  const notes = getBetNotes();
  const filtered = notes.filter(n => n.betId !== betId);
  localStorage.setItem(BET_NOTES_KEY, JSON.stringify(filtered));
}

// Get tag statistics for filtered bets
export interface TagStats {
  tagId: string;
  tagInfo: TagInfo;
  winCount: number;
  loseCount: number;
  totalCount: number;
  winRate: number;
}

export function getTagStats(bets: Bet[], betNotes: BetNote[]): TagStats[] {
  const allTags = getAllTags();
  const statsMap: Map<string, { win: number; lose: number }> = new Map();
  
  allTags.forEach(tag => {
    statsMap.set(tag.id, { win: 0, lose: 0 });
  });
  
  bets.forEach(bet => {
    const note = betNotes.find(n => n.betId === bet.id);
    if (note && (bet.status === 'win' || bet.status === 'lost')) {
      const tagId = note.tag === 'custom' ? note.customTagId! : note.tag;
      const stats = statsMap.get(tagId);
      if (stats) {
        if (bet.status === 'win') stats.win++;
        else if (bet.status === 'lost') stats.lose++;
      }
    }
  });
  
  const stats: TagStats[] = [];
  for (const [tagId, counts] of statsMap.entries()) {
    const tagInfo = allTags.find(t => t.id === tagId);
    if (tagInfo) {
      const total = counts.win + counts.lose;
      stats.push({
        tagId,
        tagInfo,
        winCount: counts.win,
        loseCount: counts.lose,
        totalCount: total,
        winRate: total > 0 ? (counts.win / total) * 100 : 0,
      });
    }
  }
  
  return stats.sort((a, b) => b.totalCount - a.totalCount);
      }
