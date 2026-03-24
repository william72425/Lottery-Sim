'use client';

import { useState } from 'react';
import { Plus, X, Edit2, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TagInfo, TagType, getAllTags, addCustomTag, deleteCustomTag, getCustomTags } from '@/lib/bet-notes';

interface BetTagSelectorProps {
  selectedTagId: string | null;
  selectedCustomTagId?: string;
  note: string;
  onTagChange: (tagId: string, customTagId?: string) => void;
  onNoteChange: (note: string) => void;
  required?: boolean;
}

export function BetTagSelector({
  selectedTagId,
  selectedCustomTagId,
  note,
  onTagChange,
  onNoteChange,
  required = true,
}: BetTagSelectorProps) {
  const [showCustomTagForm, setShowCustomTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#ff6b6b');
  const [customTags, setCustomTags] = useState(getCustomTags());

  const allTags = getAllTags();
  const defaultTags = allTags.filter(t => !t.isCustom);
  const customTagList = allTags.filter(t => t.isCustom);

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
      if (selectedTagId === tagId) {
        onTagChange('trend-follow');
      }
    }
  };

  const handleTagSelect = (tagId: string, isCustom: boolean, customTagId?: string) => {
    if (isCustom && customTagId) {
      onTagChange('custom', customTagId);
    } else {
      onTagChange(tagId);
    }
  };

  const isTagSelected = (tagId: string, isCustom: boolean, customTagId?: string): boolean => {
    if (isCustom && customTagId) {
      return selectedTagId === 'custom' && selectedCustomTagId === customTagId;
    }
    return selectedTagId === tagId;
  };

  return (
    <div className="space-y-3">
      {/* Tag Selection Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium" style={{ color: 'var(--theme-fg, #fff)' }}>
          Strategy Tag {required && <span className="text-red-500">*</span>}
        </div>
        <button
          onClick={() => setShowCustomTagForm(!showCustomTagForm)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded"
          style={{
            background: 'var(--theme-bg-secondary, #0f1419)',
            border: '1px solid var(--theme-border, #333)',
            color: 'var(--theme-primary, #ffc107)',
          }}
        >
          <Plus size={12} />
          Custom Tag
        </button>
      </div>

      {/* Default Tags */}
      <div className="grid grid-cols-2 gap-2">
        {defaultTags.map((tag) => {
          const isSelected = isTagSelected(tag.id, false);
          return (
            <button
              key={tag.id}
              onClick={() => handleTagSelect(tag.id, false)}
              className="p-2 rounded-lg text-left transition-all"
              style={{
                background: isSelected ? tag.bgColor : 'var(--theme-bg-secondary, #0f1419)',
                border: `1px solid ${isSelected ? tag.color : 'var(--theme-border, #333)'}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: tag.color }}>
                  {tag.name}
                </span>
                {isSelected && <Check size={14} style={{ color: tag.color }} />}
              </div>
              {tag.description && (
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--theme-fg-muted, #888)' }}>
                  {tag.description}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Tags */}
      {customTagList.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 mt-1">Custom Tags</div>
          <div className="grid grid-cols-2 gap-2">
            {customTagList.map((tag) => {
              const isSelected = isTagSelected(tag.id, true, tag.id);
              return (
                <div key={tag.id} className="relative">
                  <button
                    onClick={() => handleTagSelect(tag.id, true, tag.id)}
                    className="w-full p-2 rounded-lg text-left transition-all"
                    style={{
                      background: isSelected ? tag.bgColor : 'var(--theme-bg-secondary, #0f1419)',
                      border: `1px solid ${isSelected ? tag.color : 'var(--theme-border, #333)'}`,
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
                    style={{
                      background: 'var(--theme-danger, #ff3d00)',
                    }}
                  >
                    <X size={10} style={{ color: '#fff' }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Custom Tag Form */}
      {showCustomTagForm && (
        <div
          className="p-3 rounded-lg space-y-2"
          style={{
            background: 'var(--theme-bg-secondary, #0f1419)',
            border: '1px solid var(--theme-border, #333)',
          }}
        >
          <div className="flex gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name (e.g., Morning Session)"
              className="flex-1 text-sm"
              style={{
                background: 'var(--theme-bg, #090b0d)',
                borderColor: 'var(--theme-border, #333)',
                color: 'var(--theme-fg, #fff)',
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
              style={{ background: 'var(--theme-primary, #ffc107)', color: '#000' }}
            >
              Add Tag
            </Button>
          </div>
        </div>
      )}

      {/* Note Input */}
      <div>
        <div className="text-sm font-medium mb-1" style={{ color: 'var(--theme-fg, #fff)' }}>
          Note (Optional)
        </div>
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Add your thoughts, observations, or strategy notes..."
          className="resize-none"
          rows={2}
          style={{
            background: 'var(--theme-bg-secondary, #0f1419)',
            borderColor: 'var(--theme-border, #333)',
            color: 'var(--theme-fg, #fff)',
            fontSize: '12px',
          }}
        />
      </div>
    </div>
  );
  }
