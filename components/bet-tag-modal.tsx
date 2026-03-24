'use client';

import { useState, useEffect } from 'react';
import { X, Check, Edit2, Trash2, Tag, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Bet } from '@/lib/storage';
import { TagType, TAGS, BetNote, getBetNote, setBetNote, removeBetNote, getAllTags, addCustomTag, deleteCustomTag, getCustomTags } from '@/lib/bet-notes';

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
  const [showCustomTagForm, setShowCustomTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#ff6b6b');
  const [customTags, setCustomTags] = useState(getCustomTags());

  const allTags = getAllTags();
  const defaultTags = allTags.filter(t => !t.isCustom);
  const customTagList = allTags.filter(t => t.isCustom);

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
  }, [bet, isOpen]);

  if (!isOpen || !bet) return null;

  const refreshCustomTags = () => {
    setCustomTags(getCustomTags());
  };

  const handleAddCustomTag = () => {
    if (newTagName.trim()) {
      addCustomTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setShowCustomTagForm(false);
      refreshCustomTags();
    }
  };

  const handleDeleteCustomTag = (tagId: string) => {
    if (confirm('Delete this custom tag? All bets using this tag will lose the tag.')) {
      deleteCustomTag(tagId);
      refreshCustomTags();
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

    if (selectedTagId === 'custom' && !selectedCustomTagId) {
      alert('Please select a custom tag');
      return;
    }

    setBetNote(
      bet.id,
      selectedTagId === 'custom' ? 'custom' : selectedTagId as TagType,
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
          
          {/* Default Tags */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {defaultTags.map((tag) => {
              const isSelected = selectedTagId === tag.id;
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    setSelectedTagId(tag.id);
                    setSelectedCustomTagId(undefined);
                  }}
                  className="p-2 rounded-lg text-left transition-all"
                  style={{
                    background: isSelected ? tag.bgColor : '#0f1419',
                    border: `1px solid ${isSelected ? tag.color : '#333'}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: tag.color }}>
                      {tag.name}
                    </span>
                    {isSelected && <Check size={14} style={{ color: tag.color }} />}
                  </div>
                  {tag.description && (
                    <div className="text-[10px] mt-0.5" style={{ color: '#888' }}>
                      {tag.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Tags Header */}
          <div className="flex items-center justify-between mt-3 mb-2">
            <div className="text-xs text-gray-500">Custom Tags</div>
            <button
              onClick={() => setShowCustomTagForm(!showCustomTagForm)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{
                background: '#0f1419',
                border: '1px solid #333',
                color: '#ffc107',
              }}
            >
              + Add Custom
            </button>
          </div>

          {/* Custom Tags */}
          {customTagList.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {customTagList.map((tag) => {
                const isSelected = selectedTagId === 'custom' && selectedCustomTagId === tag.id;
                return (
                  <div key={tag.id} className="relative">
                    <button
                      onClick={() => {
                        setSelectedTagId('custom');
                        setSelectedCustomTagId(tag.id);
                      }}
                      className="w-full p-2 rounded-lg text-left transition-all"
                      style={{
                        background: isSelected ? tag.bgColor : '#0f1419',
                        border: `1px solid ${isSelected ? tag.color : '#333'}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: tag.color }}>
                          {tag.name}
                        </span>
                        {isSelected && <Check size={14} style={{ color: tag.color }} />}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteCustomTag(tag.id)}
                      className="absolute -top-1 -right-1 p-0.5 rounded-full"
                      style={{ background: '#ff3d00' }}
                    >
                      <X size={10} style={{ color: '#fff' }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Custom Tag Form */}
          {showCustomTagForm && (
            <div
              className="p-3 rounded-lg space-y-2 mt-2"
              style={{
                background: '#0f1419',
                border: '1px solid #333',
              }}
            >
              <div className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name (e.g., Morning Session)"
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
                  style={{ background: newTagColor }}
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
                  Add Tag
                </Button>
              </div>
            </div>
          )}

          {!selectedTagId && (
            <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
              <AlertTriangle size={12} />
              Please select a tag
            </div>
          )}
        </div>

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
