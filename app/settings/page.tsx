'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Palette, Check, Moon, Flame, Leaf, Zap, Shield } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storage';
import { THEMES, ThemeType, getCurrentTheme, setTheme } from '@/lib/theme';
import { isDepositLimitEnabled, toggleDepositLimit } from '@/lib/settings';

export default function SettingsPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('dark');
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('dark');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [depositLimitEnabled, setDepositLimitEnabled] = useState(true);

  useEffect(() => {
    const savedTheme = getCurrentTheme();
    setCurrentTheme(savedTheme);
    setSelectedTheme(savedTheme);
    setDepositLimitEnabled(isDepositLimitEnabled());
  }, []);

  const handleReset = () => {
    if (password !== '2026') {
      setResetMessage('Invalid password');
      return;
    }

    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem('trx_results');
    localStorage.removeItem('app_theme');
    localStorage.removeItem('monthly_funds');
    localStorage.removeItem('earnedBadges');
    localStorage.removeItem('bet_notes');
    localStorage.removeItem('custom_tags');

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

  const handleDepositLimitToggle = (enabled: boolean) => {
    toggleDepositLimit(enabled);
    setDepositLimitEnabled(enabled);
  };

  const getThemeIcon = (theme: ThemeType) => {
    switch (theme) {
      case 'dark': return <Moon size={16} />;
      case 'red': return <Flame size={16} />;
      case 'cyberpunk': return <Zap size={16} />;
      case 'nature': return <Leaf size={16} />;
      default: return <Palette size={16} />;
    }
  };

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

      <div className="w-full max-w-md mx-auto px-4 pt-6 pb-20">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--theme-primary, #ffc107)' }}>
          Settings
        </h1>

        {/* Deposit Limit Toggle */}
        <Card
          className="p-5 border mb-6"
          style={{ 
            background: 'var(--theme-card-bg, #1e2329)', 
            borderColor: 'var(--theme-card-border, #333)' 
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} style={{ color: 'var(--theme-primary, #ffc107)' }} />
            <h2 className="text-lg font-bold">Deposit Limit</h2>
          </div>
          
          <p className="text-xs mb-4" style={{ color: 'var(--theme-fg-muted, #888)' }}>
            Enable to limit deposits to 3 per day. Disable for unlimited deposits.
          </p>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--theme-bg-secondary, #0f1419)' }}>
            <span className="text-sm">Limit 3 deposits per day</span>
            <button
              onClick={() => handleDepositLimitToggle(!depositLimitEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              style={{
                backgroundColor: depositLimitEnabled ? 'var(--theme-primary, #ffc107)' : '#555',
              }}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform`}
                style={{
                  transform: depositLimitEnabled ? 'translateX(22px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>
          
          <div className="text-[10px] mt-3 text-center" style={{ color: depositLimitEnabled ? '#00c853' : '#ff9800' }}>
            {depositLimitEnabled ? '✅ Limit ENABLED - Max 3 deposits per day' : '⚠️ Limit DISABLED - Unlimited deposits'}
          </div>
        </Card>

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
            Enter the reset password (2026) to clear all data and start over
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
                      ? 'rgba(0, 200, 83, 0.3)'
                      : 'rgba(255, 61, 0, 0.3)',
                    color: resetMessage.includes('successfully') ? '#00c853' : '#ff3d00',
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
                  style={{ background: '#333', color: '#fff' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReset}
                  className="flex-1"
                  style={{ background: 'var(--theme-danger, #ff3d00)', color: '#fff' }}
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
            <li>• Fund Account: Can be edited anytime (no 30-day limit)</li>
            <li>• Fund additions are tracked with history</li>
            <li>• Deposit limit can be toggled on/off above</li>
            <li>• Theme preferences are saved automatically</li>
          </ul>
        </Card>
      </div>
    </main>
  );
                  }
