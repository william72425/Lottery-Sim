'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Palette, Check, Moon, Flame, Leaf, Zap } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storage';
import { THEMES, ThemeType, getCurrentTheme, setTheme } from '@/lib/theme';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('dark');
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('dark');
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Load current theme on mount
  useEffect(() => {
    const savedTheme = getCurrentTheme();
    setCurrentTheme(savedTheme);
    setSelectedTheme(savedTheme);
  }, []);

  const handleReset = () => {
    if (password !== '2026') {
      setResetMessage('Invalid password');
      return;
    }

    // Clear all storage
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem('trx_results');
    localStorage.removeItem('app_theme'); // Don't remove theme on reset

    // Reinitialize with defaults
    localStorage.setItem(STORAGE_KEYS.WALLET, '0');
    localStorage.setItem(STORAGE_KEYS.FUND, '0');
    localStorage.setItem(STORAGE_KEYS.BETS, '[]');
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, '[]');
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, '[]');
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, 'true');
    localStorage.setItem('trx_results', '[]');

    setResetMessage('All data reset successfully');
    setPassword('');
    setShowResetForm(false);

    // Reload page after 2 seconds
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  const handleThemeChange = (theme: ThemeType) => {
    setSelectedTheme(theme);
    setTheme(theme);
    setCurrentTheme(theme);
    setShowThemeSelector(false);
  };

  // Get icon for theme
  const getThemeIcon = (theme: ThemeType) => {
    switch (theme) {
      case 'dark': return <Moon size={16} />;
      case 'red': return <Flame size={16} />;
      case 'cyberpunk': return <Zap size={16} />;
      case 'nature': return <Leaf size={16} />;
      default: return <Palette size={16} />;
    }
  };

  // Get theme preview style
  const getThemePreviewStyle = (theme: ThemeType) => {
    const config = THEMES[theme];
    return {
      background: config.colors.background,
      border: `1px solid ${config.colors.border}`,
    };
  };

  return (
    <main
      className="min-h-screen pb-20"
      style={{ 
        background: 'var(--theme-bg, #090b0d)', 
        color: 'var(--theme-fg, #fff)' 
      }}
    >
      {/* Header */}
      <div
        className="flex items-center p-4 sticky top-0 z-20 border-b"
        style={{ 
          background: 'var(--theme-bg-secondary, #0f1419)', 
          borderColor: 'var(--theme-border, #222)' 
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold"
          style={{ color: 'var(--theme-primary, #ffc107)' }}
        >
          <ChevronLeft size={20} />
          Back
        </button>
      </div>

      {/* Content */}
      <div className="w-full max-w-md mx-auto px-4 pt-6 pb-20">
        {/* Title */}
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--theme-primary, #ffc107)' }}>
          Settings
        </h1>

        {/* Theme Section */}
        <Card
          className="p-5 border mb-6"
          style={{ 
            background: 'var(--theme-card-bg, #1e2329)', 
            borderColor: 'var(--theme-card-border, #333)' 
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Palette size={20} style={{ color: 'var(--theme-primary, #ffc107)' }} />
            <h2 className="text-lg font-bold">Theme</h2>
          </div>
          
          <p className="text-xs mb-4" style={{ color: 'var(--theme-fg-muted, #888)' }}>
            Choose your preferred theme for the entire application
          </p>

          {/* Current Theme Display */}
          <div 
            className="p-3 rounded-lg mb-4 flex items-center justify-between cursor-pointer"
            style={{ 
              background: 'var(--theme-bg-secondary, #0f1419)',
              border: `1px solid var(--theme-border, #333)`
            }}
            onClick={() => setShowThemeSelector(!showThemeSelector)}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: THEMES[currentTheme].colors.primary }}
              >
                {getThemeIcon(currentTheme)}
              </div>
              <div>
                <div className="font-medium text-sm">{THEMES[currentTheme].name}</div>
                <div className="text-xs" style={{ color: 'var(--theme-fg-muted, #888)' }}>
                  {THEMES[currentTheme].description}
                </div>
              </div>
            </div>
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ 
                background: 'var(--theme-primary, #ffc107)',
                transform: showThemeSelector ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)', color: '#000' }} />
            </div>
          </div>

          {/* Theme Options Dropdown */}
          {showThemeSelector && (
            <div className="space-y-2 mt-2">
              {(Object.keys(THEMES) as ThemeType[]).map((theme) => (
                <div
                  key={theme}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    currentTheme === theme ? 'ring-2' : ''
                  }`}
                  style={{
                    background: 'var(--theme-bg-secondary, #0f1419)',
                    border: `1px solid var(--theme-border, #333)`,
                    ringColor: currentTheme === theme ? 'var(--theme-primary, #ffc107)' : 'transparent',
                  }}
                  onClick={() => handleThemeChange(theme)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={getThemePreviewStyle(theme)}
                      >
                        {getThemeIcon(theme)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{THEMES[theme].name}</div>
                        <div className="text-xs" style={{ color: 'var(--theme-fg-muted, #888)' }}>
                          {THEMES[theme].description}
                        </div>
                      </div>
                    </div>
                    {currentTheme === theme && (
                      <Check size={18} style={{ color: 'var(--theme-primary, #ffc107)' }} />
                    )}
                  </div>
                  
                  {/* Color Preview Strip */}
                  <div className="flex mt-2 gap-1">
                    <div className="h-1 flex-1 rounded" style={{ background: THEMES[theme].colors.primary }} />
                    <div className="h-1 flex-1 rounded" style={{ background: THEMES[theme].colors.accent }} />
                    <div className="h-1 flex-1 rounded" style={{ background: THEMES[theme].colors.success }} />
                    <div className="h-1 flex-1 rounded" style={{ background: THEMES[theme].colors.danger }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Reset Section */}
        <Card
          className="p-6 border"
          style={{ background: 'var(--theme-card-bg, #1e2329)', borderColor: 'var(--theme-card-border, #333)' }}
        >
          <h2 className="text-lg font-bold mb-4">Reset All Data</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--theme-fg-muted, #888)' }}>
            Enter the reset password to clear all data and start over
          </p>

          {!showResetForm ? (
            <Button
              onClick={() => setShowResetForm(true)}
              className="w-full"
              style={{
                background: 'var(--theme-danger, #ff3d00)',
                color: '#fff',
              }}
            >
              Reset Data
            </Button>
          ) : (
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  background: 'var(--theme-bg-secondary, #0f1419)',
                  borderColor: 'var(--theme-border, #333)',
                  color: 'var(--theme-fg, #fff)',
                }}
              />

              {resetMessage && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    background: resetMessage.includes('successfully')
                      ? 'var(--theme-success, #00c853)30'
                      : 'var(--theme-danger, #ff3d00)30',
                    color: resetMessage.includes('successfully')
                      ? 'var(--theme-success, #00c853)'
                      : 'var(--theme-danger, #ff3d00)',
                  }}
                >
                  {resetMessage}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowResetForm(false);
                    setPassword('');
                    setResetMessage('');
                  }}
                  className="flex-1"
                  style={{
                    background: '#333',
                    color: '#fff',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReset}
                  className="flex-1"
                  style={{
                    background: 'var(--theme-danger, #ff3d00)',
                    color: '#fff',
                  }}
                >
                  Confirm Reset
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Info Section */}
        <Card
          className="p-6 border mt-6"
          style={{ background: 'var(--theme-card-bg, #1e2329)', borderColor: 'var(--theme-card-border, #333)' }}
        >
          <h3 className="text-sm font-bold mb-3">Information</h3>
          <ul className="text-xs space-y-2" style={{ color: 'var(--theme-fg-muted, #888)' }}>
            <li>• Game Account: Used for betting</li>
            <li>• Fund Account: Monthly allowance for transfers</li>
            <li>• Fund account can only be edited once per month</li>
            <li>• Withdrawals deduct from Game Account</li>
            <li>• Profits add to Fund Account</li>
            <li>• Theme preferences are saved automatically</li>
          </ul>
        </Card>
      </div>
    </main>
  );
          }
