'use client';

import { useState, useEffect } from 'react';
import { X, Check, Trash2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Bet } from '@/lib/storage';
import { 
  getTagCategories, 
  getAllTags, 
  BetNote, 
  getBetNote, 
  setBetNote, 
  removeBetNote,
  addCustomTag,
  deleteCustomTag,
  getCustomTags
} from '@/lib/bet-notes';

interface BetTagModalProps {
  isOpen: boolean;
  bet: Bet | null;
  onClose: () => void;
  onSave?: () => void;
}

export function BetTagModal({ isOpen, bet, onClose, onSave }: BetTagModalProps) {
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [selectedCustomTagId, setSelectedCustomTagId] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [existingNote, setExistingNote] = useState<BetNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCustomTagForm, setShowCustomTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#ff6b6b');
  const [refreshKey, setRefreshKey] = useState(0);

  const categories = getTagCategories();
  const allTags = getAllTags();

  const toggleCategory = (categoryId: string) => {
    const newOpen = new Set(openCategories);
    if (newOpen.has(categoryId)) {
      newOpen.delete(categoryId);
      if (activeCategory === categoryId) setActiveCategory(null);
    } else {
      newOpen.add(categoryId);
      setActiveCategory(categoryId);
      for (const id of newOpen) {
        if (id !== categoryId) newOpen.delete(id);
      }
    }
    setOpenCategories(newOpen);
  };

  useEffect(() => {
    if (bet && isOpen) {
      const existing = getBetNote(bet.id);
      setExistingNote(existing || null);
      if (existing) {
        if (existing.tag === 'custom' && existing.customTagId) {
          setSelectedTagId('custom');
          setSelectedCustomTagId(existing.customTagId);
        } else {
          setSelectedTagId(existing.tag);
          setSelectedCustomTagId(undefined);
        }
        setNote(existing.note || '');
        setIsEditing(true);
      } else {
        setSelectedTagId('');
        setSelectedCustomTagId(undefined);
        setNote('');
        setIsEditing(false);
      }
    }
  }, [bet, isOpen, refreshKey]);

  if (!isOpen || !bet) return null;

  const handleAddCustomTag = () => {
    if (newTagName.trim()) {
      addCustomTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setShowCustomTagForm(false);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleDeleteCustomTag = (tagId: string) => {
    if (confirm('Delete this custom tag? All bets using this tag will lose the tag.')) {
      deleteCustomTag(tagId);
      setRefreshKey(prev => prev + 1);
      if (selectedTagId === tagId || (selectedTagId === 'custom' && selectedCustomTagId === tagId)) {
        setSelectedTagId('');
        setSelectedCustomTagId(undefined);
      }
    }
  };

  const handleSave = () => {
    if (!selectedTagId) {
      alert('Please select a tag');
      return;
    }

    setBetNote(
      bet.id,
      selectedTagId === 'custom' ? 'custom' : selectedTagId,
      selectedTagId === 'custom' ? selectedCustomTagId : undefined,
      note || undefined
    );
    onSave?.();
    onClose();
  };

  const handleRemove = () => {
    if (confirm('Remove tag and note from this bet?')) {
      removeBetNote(bet.id);
      onSave?.();
      onClose();
    }
  };

  const winLossColor = bet.status === 'win' ? '#00c853' : bet.status === 'lost' ? '#ff3d00' : '#ffc107';
  const winLossText = bet.status === 'win' ? 'Win Analysis' : bet.status === 'lost' ? 'Loss Analysis' : 'Pending';

  const isTagSelected = (tagId: string, isCustom: boolean, customTagId?: string): boolean => {
    if (isCustom && customTagId) {
      return selectedTagId === 'custom' && selectedCustomTagId === customTagId;
    }
    return selectedTagId === tagId;
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0, 0, 0, 0.85)' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 max-w-md mx-auto"
        style={{
          background: '#1e2329',
          borderTop: `3px solid ${winLossColor}`,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#fff' }}>
              {winLossText}
            </h3>
            <div className="text-xs mt-1" style={{ color: '#888' }}>
              #{bet.period} • {bet.val} • {bet.amt.toLocaleString()} MMK
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:opacity-80">
            <X size={20} style={{ color: '#888' }} />
          </button>
        </div>

        {/* Tag Selection */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2" style={{ color: '#fff' }}>
            Strategy Tag <span className="text-red-500">*</span>
          </div>
          
          {/* Category Dropdowns */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map((category) => {
              const isOpen = openCategories.has(category.id);
              const isActive = activeCategory === category.id;
              
              return (
                <div key={category.id} className="rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg transition-all"
                    style={{
                      background: isActive ? 'rgba(255, 193, 7, 0.1)' : '#0f1419',
                      border: `1px solid ${isActive ? '#ffc107' : '#333'}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{category.icon || '📁'}</span>
                      <span className="text-sm font-medium" style={{ color: '#fff' }}>
                        {category.name}
                      </span>
                      <span className="text-xs text-gray-500">({category.tags.length})</span>
                    </div>
                    {isOpen ? (
                      <X size={14} style={{ color: '#ffc107' }} />
                    ) : (
                      <ChevronRightIcon size={14} style={{ color: '#888' }} />
                    )}
                  </button>

                  {isOpen && (
                    <div className="mt-1 ml-4 space-y-1.5">
                      {category.tags.map((tag) => {
                        const isSelected = isTagSelected(tag.id, !!tag.isCustom, tag.id);
                        return (
                          <div key={tag.id} className="relative">
                            <button
                              onClick={() => {
                                if (tag.isCustom) {
                                  setSelectedTagId('custom');
                                  setSelectedCustomTagId(tag.id);
                                } else {
                                  setSelectedTagId(tag.id);
                                  setSelectedCustomTagId(undefined);
                                }
                              }}
                              className="w-full p-2 rounded-lg text-left transition-all"
                              style={{
                                background: isSelected ? tag.bgColor : '#0f1419',
                                border: `1px solid ${isSelected ? tag.color : '#333'}`,
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs font-medium" style={{ color: tag.color }}>
                                    {tag.name}
                                  </span>
                                  {tag.description && (
                                    <div className="text-[10px] mt-0.5" style={{ color: '#888' }}>
                                      {tag.description}
                                    </div>
                                  )}
                                </div>
                                {isSelected && <Check size={12} style={{ color: tag.color }} />}
                              </div>
                            </button>
                            {tag.isCustom && (
                              <button
                                onClick={() => handleDeleteCustomTag(tag.id)}
                                className="absolute -top-1 -right-1 p-0.5 rounded-full"
                                style={{ background: '#ff3d00' }}
                              >
                                <X size={10} style={{ color: '#fff' }} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!selectedTagId && (
            <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
              <AlertTriangle size={12} />
              Please select a tag
            </div>
          )}
        </div>

        {/* Add Custom Tag Button */}
        {!showCustomTagForm && (
          <button
            onClick={() => setShowCustomTagForm(true)}
            className="w-full flex items-center justify-center gap-1 py-2 mb-3 text-xs rounded-lg"
            style={{
              background: '#0f1419',
              border: '1px solid #333',
              color: '#ffc107',
            }}
          >
            <Plus size={12} />
            Create Custom Tag
          </button>
        )}

        {/* Add Custom Tag Form */}
        {showCustomTagForm && (
          <div className="mb-3 p-3 rounded-lg" style={{ background: '#0f1419', border: '1px solid #333' }}>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="flex-1 text-sm"
                style={{
                  background: '#090b0d',
                  borderColor: '#333',
                  color: '#fff',
                }}
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCustomTagForm(false)}
                className="flex-1 py-1 text-xs"
                style={{ background: '#333', color: '#fff' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomTag}
                disabled={!newTagName.trim()}
                className="flex-1 py-1 text-xs"
                style={{ background: '#ffc107', color: '#000' }}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Note Input */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-1" style={{ color: '#fff' }}>
            Note (Optional)
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add your thoughts, observations, or strategy notes..."
            className="resize-none"
            rows={3}
            style={{
              background: '#0f1419',
              borderColor: '#333',
              color: '#fff',
              fontSize: '12px',
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {isEditing && (
            <Button
              onClick={handleRemove}
              className="flex-1 py-2 text-sm"
              style={{
                background: '#ff3d00',
                color: '#fff',
              }}
            >
              <Trash2 size={14} className="mr-1" />
              Remove
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!selectedTagId}
            className="flex-1 py-2 text-sm font-medium disabled:opacity-50"
            style={{
              background: '#ffc107',
              color: '#000',
            }}
          >
            <Check size={14} className="mr-1" />
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>
    </>
  );
}

// Helper icon component
function ChevronRightIcon({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function Plus({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
            }
