export type TagType = 'trend-follow' | 'trend-reverse' | 'zigzag' | 'mindset' | 'custom';

export interface CustomTag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  category?: string;
}

export interface BetNote {
  betId: string;
  tag: TagType | string;
  customTagId?: string;
  note?: string;
  createdAt: string;
}

export interface TagInfo {
  id: string;
  name: string;
  description?: string;
  color: string;
  bgColor: string;
  isCustom?: boolean;
  category?: string;
}

export interface TagCategory {
  id: string;
  name: string;
  icon?: string;
  tags: TagInfo[];
}

// ========== TAG CATEGORIES & TAGS ==========

export const TAG_CATEGORIES: TagCategory[] = [
  {
    id: 'trend-following',
    name: 'Trend Following',
    icon: '📈',
    tags: [
      {
        id: 'dragon-follow',
        name: '#DragonFollow',
        description: 'နဂါးတန်း (B-B-B...) ဖြစ်နေလို့ ဆက်လိုက်ခြင်း',
        color: '#ff4444',
        bgColor: 'rgba(255, 68, 68, 0.15)',
        category: 'trend-following',
      },
      {
        id: 'mirror-follow',
        name: '#MirrorFollow',
        description: 'တစ်လှည့်စီ (B-S-B-S...) ထွက်နေလို့ အစဉ်လိုက်အတိုင်း လိုက်ခြင်း',
        color: '#ff9800',
        bgColor: 'rgba(255, 152, 0, 0.15)',
        category: 'trend-following',
      },
      {
        id: 'twin-follow',
        name: '#TwinFollow',
        description: 'နှစ်လုံးတွဲ (B-B-S-S...) ထွက်နေလို့ လိုက်ခြင်း',
        color: '#ffeb3b',
        bgColor: 'rgba(255, 235, 59, 0.15)',
        category: 'trend-following',
      },
      {
        id: 'v-pattern',
        name: '#V-Pattern',
        description: '(B-S-B) ထွက်ပြီးနောက် B ပြန်ထွက်မယ်အထင်နဲ့ ထိုးခြင်း',
        color: '#4caf50',
        bgColor: 'rgba(76, 175, 80, 0.15)',
        category: 'trend-following',
      },
    ],
  },
  {
    id: 'trend-breaking',
    name: 'Trend Breaking',
    icon: '💥',
    tags: [
      {
        id: 'dragon-break',
        name: '#DragonBreak',
        description: 'နဂါးတန်း အရမ်းရှည်လာပြီ (ဥပမာ ၈ ကြိမ်ကျော်ပြီ) ဖြစ်လို့ ပြတ်တော့မယ်အထင်နဲ့ ဆန့်ကျင်ဘက်ထိုးခြင်း',
        color: '#ff6b6b',
        bgColor: 'rgba(255, 107, 107, 0.15)',
        category: 'trend-breaking',
      },
      {
        id: 'mirror-break',
        name: '#MirrorBreak',
        description: 'တစ်လှည့်စီထွက်တာ ရပ်သွားပြီအထင်နဲ့ ထိုးခြင်း',
        color: '#e91e63',
        bgColor: 'rgba(233, 30, 99, 0.15)',
        category: 'trend-breaking',
      },
    ],
  },
  {
    id: 'statistical',
    name: 'Statistical & Number',
    icon: '📊',
    tags: [
      {
        id: 'violet-turning',
        name: '#VioletTurning',
        description: 'Violet (0 သို့မဟုတ် 5) ထွက်ပြီးရင် Trend ပြောင်းတတ်တဲ့ အလေ့အထကြောင့် ထိုးခြင်း',
        color: '#9c27b0',
        bgColor: 'rgba(156, 39, 176, 0.15)',
        category: 'statistical',
      },
      {
        id: 'hot-number',
        name: '#HotNumber',
        description: 'မကြာခဏ ထွက်နေတဲ့ နံပါတ် (ဥပမာ 7) ပါတဲ့ Side ကို လိုက်ခြင်း',
        color: '#00bcd4',
        bgColor: 'rgba(0, 188, 212, 0.15)',
        category: 'statistical',
      },
    ],
  },
  {
    id: 'mindset',
    name: 'Mindset',
    icon: '🧠',
    tags: [
      {
        id: 'intuition',
        name: '#Intuition',
        description: 'ကိုယ့်ရဲ့ ဗီဇ၊ အတွေ့အကြုံအရ ထိုးခြင်း',
        color: '#3f51b5',
        bgColor: 'rgba(63, 81, 181, 0.15)',
        category: 'mindset',
      },
    ],
  },
];

// Legacy support for old tags
const LEGACY_TAGS: TagInfo[] = [
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

// Get all tags (categories + custom + legacy)
export function getAllTags(): TagInfo[] {
  const categoryTags: TagInfo[] = [];
  TAG_CATEGORIES.forEach(category => {
    categoryTags.push(...category.tags);
  });
  
  const customTags = getCustomTags().map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    bgColor: `${tag.color}26`,
    isCustom: true,
    category: tag.category,
  }));
  
  return [...categoryTags, ...customTags, ...LEGACY_TAGS];
}

// Get categories with their tags
export function getTagCategories(): TagCategory[] {
  const categories = [...TAG_CATEGORIES];
  
  // Add custom tags as a separate category
  const customTags = getCustomTags();
  if (customTags.length > 0) {
    categories.push({
      id: 'custom',
      name: 'Custom Tags',
      icon: '🏷️',
      tags: customTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        bgColor: `${tag.color}26`,
        isCustom: true,
        category: 'custom',
      })),
    });
  }
  
  return categories;
}

// Get all custom tags
export function getCustomTags(): CustomTag[] {
  if (typeof window === 'undefined') return [];
  const tags = localStorage.getItem(CUSTOM_TAGS_KEY);
  return tags ? JSON.parse(tags) : [];
}

// Add custom tag
export function addCustomTag(name: string, color: string, category?: string): CustomTag {
  const tags = getCustomTags();
  const newTag: CustomTag = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    color,
    category,
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
  
  const notes = getBetNotes();
  const updatedNotes = notes.filter(n => !(n.tag === 'custom' && n.customTagId === tagId));
  localStorage.setItem(BET_NOTES_KEY, JSON.stringify(updatedNotes));
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
export function setBetNote(betId: string, tag: string, customTagId?: string, note?: string): void {
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

export function getTagStats(bets: any[], betNotes: BetNote[]): TagStats[] {
  const allTags = getAllTags();
  const statsMap: Map<string, { win: number; lose: number }> = new Map();
  
  allTags.forEach(tag => {
    statsMap.set(tag.id, { win: 0, lose: 0 });
  });
  
  bets.forEach(bet => {
    const note = betNotes.find(n => n.betId === bet.id);
    if (note && (bet.status === 'win' || bet.status === 'lost')) {
      const tagId = note.customTagId || note.tag;
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
    if (tagInfo && (counts.win > 0 || counts.lose > 0)) {
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
