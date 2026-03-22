'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storage';

export default function SettingsPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

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

  return (
    <main
      className="min-h-screen pb-20"
      style={{ background: '#090b0d', color: '#fff' }}
    >
      {/* Header */}
      <div
        className="flex items-center p-4 sticky top-0 z-20 border-b"
        style={{ background: '#0f1419', borderColor: '#222' }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold"
          style={{ color: '#ffc107' }}
        >
          <ChevronLeft size={20} />
          Back
        </button>
      </div>

      {/* Content */}
      <div className="w-full max-w-md mx-auto px-4 pt-6 pb-20">
        {/* Title */}
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#ffc107' }}>
          Settings
        </h1>

        {/* Reset Section */}
        <Card
          className="p-6 border"
          style={{ background: '#1e2329', borderColor: '#333' }}
        >
          <h2 className="text-lg font-bold mb-4">Reset All Data</h2>
          <p className="text-xs mb-4" style={{ color: '#888' }}>
            Enter the reset password to clear all data and start over
          </p>

          {!showResetForm ? (
            <Button
              onClick={() => setShowResetForm(true)}
              className="w-full"
              style={{
                background: '#ff3d00',
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
                  background: '#0f1419',
                  borderColor: '#333',
                  color: '#fff',
                }}
              />

              {resetMessage && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    background: resetMessage.includes('successfully')
                      ? '#00c85330'
                      : '#ff3d0030',
                    color: resetMessage.includes('successfully')
                      ? '#00c853'
                      : '#ff3d00',
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
                    background: '#ff3d00',
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
          style={{ background: '#1e2329', borderColor: '#333' }}
        >
          <h3 className="text-sm font-bold mb-3">Information</h3>
          <ul className="text-xs space-y-2" style={{ color: '#888' }}>
            <li>• Game Account: Used for betting</li>
            <li>• Fund Account: Monthly allowance for transfers</li>
            <li>• Fund account can only be edited once per month</li>
            <li>• Withdrawals deduct from Game Account</li>
            <li>• Profits add to Fund Account</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
