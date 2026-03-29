'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TagCategory, getTagCategories, addCustomTag, deleteCustomTag, getCustomTags } from '@/lib/bet-notes';

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
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [showCustomTagForm, setShowCustomTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#ff6b6b');
  const [customTags, setCustomTags] = useState(getCustomTags());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = getTagCategories();

  const toggleCategory = (categoryId: string) => {
    const newOpen = new Set(openCategories);
    if (newOpen.has(categoryId)) {
      newOpen.delete(categoryId);
      if (activeCategory === categoryId) setActiveCategory(null);
    } else {
      newOpen.add(categoryId);
      setActiveCategory(categoryId);
      // Close other categories
      for (const id of newOpen) {
        if (id !== categoryId) newOpen.delete(id);
      }
    }
    setOpenCategories(newOpen);
  };

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
        onTagChange('');
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

      {/* Category Dropdowns */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {categories.map((category) => {
          const isOpen = openCategories.has(category.id);
          const isActive = activeCategory === category.id;
          
          return (
            <div key={category.id} className="rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-2 rounded-lg transition-all"
                style={{
                  background: isActive ? 'rgba(255, 193, 7, 0.1)' : 'var(--theme-bg-secondary, #0f1419)',
                  border: `1px solid ${isActive ? 'var(--theme-primary, #ffc107)' : 'var(--theme-border, #333)'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{category.icon || '📁'}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--theme-fg, #fff)' }}>
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-500">({category.tags.length})</span>
                </div>
                {isOpen ? (
                  <ChevronDown size={16} style={{ color: 'var(--theme-primary, #ffc107)' }} />
                ) : (
                  <ChevronRight size={16} style={{ color: 'var(--theme-fg-muted, #666)' }} />
                )}
              </button>

              {/* Category Tags (Dropdown Content) */}
              {isOpen && (
                <div className="mt-1 ml-4 space-y-1.5">
                  {category.tags.map((tag) => {
                    const isSelected = isTagSelected(tag.id, !!tag.isCustom, tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleTagSelect(tag.id, !!tag.isCustom, tag.id)}
                        className="w-full p-2 rounded-lg text-left transition-all"
                        style={{
                          background: isSelected ? tag.bgColor : 'var(--theme-bg-secondary, #0f1419)',
                          border: `1px solid ${isSelected ? tag.color : 'var(--theme-border, #333)'}`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-medium" style={{ color: tag.color }}>
                              {tag.name}
                            </span>
                            {tag.description && (
                              <div className="text-[10px] mt-0.5" style={{ color: 'var(--theme-fg-muted, #888)' }}>
                                {tag.description}
                              </div>
                            )}
                          </div>
                          {isSelected && <Check size={12} style={{ color: tag.color }} />}
                        </div>
                      </button>
                    );
                  })}
                  {category.id === 'custom' && (
                    <div className="text-[10px] text-center text-gray-500 pt-1">
                      Click + Custom Tag to add more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
