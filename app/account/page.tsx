'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getWallet,
  setFund,
} from '@/lib/storage';
import {
  getMonthlyFund,
  setInitialMonthlyFund,
  getTotalMonthlyFund,
  getCurrentMonthYear,
  formatFundDateTime,
} from '@/lib/monthly-fund';
import { validateFundAmount } from '@/lib/trx-utils';

export default function AccountPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [fund, setFundState] = useState(0);
  const [newFund, setNewFund] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Monthly fund state
  const { year, month } = getCurrentMonthYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthName = `${monthNames[month - 1]} ${year}`;
  const [currentMonthlyFund, setCurrentMonthlyFund] = useState<{ initial: number; total: number; hasFund: boolean }>({
    initial: 0,
    total: 0,
    hasFund: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setWallet(getWallet());
    
    // Load monthly fund
    const monthlyFund = getMonthlyFund(year, month);
    if (monthlyFund) {
      const total = getTotalMonthlyFund(year, month);
      setCurrentMonthlyFund({
        initial: monthlyFund.initialFund,
        total: total,
        hasFund: true,
      });
      setFundState(total);
    } else {
      setCurrentMonthlyFund({
        initial: 0,
        total: 0,
        hasFund: false,
      });
      setFundState(0);
    }
  };

  const handleUpdateFund = () => {
    setError('');
    setSuccess('');

    const amount = parseInt(newFund);
    if (isNaN(amount)) {
      setError('မှားယွင်းတဲ့ပမာဏ');
      return;
    }

    const validation = validateFundAmount(amount);
    if (!validation.valid) {
      setError(validation.error || 'Invalid amount');
      return;
    }

    // Use monthly fund system (NO 30-day limit)
    const result = setInitialMonthlyFund(year, month, amount, 'Manual fund update from account page');
    
    if (result) {
      setFundState(amount);
      setNewFund('');
      loadData();
      setSuccess(`ရန်ပုံငွေ ${amount.toLocaleString()} MMK အဆင်သင့်လုပ်ဆောင်ပြီးပါပြီ`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('ရန်ပုံငွေ သတ်မှတ်ရာတွင် အမှားရှိပါသည်');
    }
  };

  return (
    <main
      className="min-h-screen pb-20"
      style={{ background: '#090b0d', color: '#fff' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 border-b"
        style={{
          background: '#090b0d',
          borderColor: '#222',
        }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={24} style={{ color: '#ffc107' }} />
        </button>
        <h1 className="text-xl font-bold">အကောင့်ချမှတ်</h1>
      </div>

      {/* Content */}
      <div className="w-full max-w-md mx-auto px-2 pt-6 space-y-6">
        {/* Wallet Balance */}
        <Card
          className="p-6 border"
          style={{
            background: 'linear-gradient(135deg, #1a3a1a 0%, #0a1a0a 100%)',
            borderColor: '#00c853',
            borderBottomWidth: '4px',
          }}
        >
          <div className="text-xs text-gray-400 mb-2">လက်ကျန်ပိုက်ဆံ</div>
          <div
            className="text-4xl font-black"
            style={{ color: '#00c853' }}
          >
            {wallet.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">MMK</div>
        </Card>

        {/* Monthly Fund Display */}
        <Card
          className="p-6 border"
          style={{
            background: 'linear-gradient(135deg, #1e2329, #111)',
            borderColor: '#ffc107',
            borderBottomWidth: '4px',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-400">ရန်ပုံငွေ ({currentMonthName})</div>
            {currentMonthlyFund.hasFund && (
              <div className="text-[10px] text-green-500">✓ အဆင်သင့်ဖြစ်ပြီး</div>
            )}
          </div>
          <div
            className="text-4xl font-black"
            style={{ color: '#ffc107' }}
          >
            {currentMonthlyFund.total.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            10,000 - 200,000 အကြား • အချိန်မရွေး ပြင်ဆင်နိုင်ပါသည်
          </div>
          {currentMonthlyFund.hasFund && currentMonthlyFund.initial !== currentMonthlyFund.total && (
            <div className="text-[10px] text-gray-500 mt-1">
              (Initial: {currentMonthlyFund.initial.toLocaleString()} MMK + Additions)
            </div>
          )}
        </Card>

        {/* Update Fund Section */}
        <Card
          className="p-6 border"
          style={{
            background: '#1e2329',
            borderColor: '#222',
          }}
        >
          <h3 className="font-bold mb-4">ရန်ပုံငွေ သတ်မှတ်မည်</h3>

          {error && (
            <div
              className="p-3 rounded-lg mb-4 text-sm"
              style={{
                background: '#ff3d00',
                color: '#fff',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="p-3 rounded-lg mb-4 text-sm"
              style={{
                background: '#00c853',
                color: '#fff',
              }}
            >
              {success}
            </div>
          )}

          {/* No 30-day limit info */}
          <div
            className="p-3 rounded-lg mb-4 text-sm"
            style={{
              background: 'rgba(0, 200, 83, 0.1)',
              borderLeft: '3px solid #00c853',
              color: '#00c853',
            }}
          >
            ✅ အချိန်မရွေး ပြင်ဆင်နိုင်ပါသည် (ရက် 30 ကန့်သတ်ချက် မရှိတော့ပါ)
          </div>

          <Input
            type="number"
            value={newFund}
            onChange={(e) => setNewFund(e.target.value)}
            placeholder="10000 - 200000"
            className="mb-4"
            style={{
              background: '#000',
              borderColor: '#444',
              color: '#fff',
            }}
          />

          <Button
            onClick={handleUpdateFund}
            disabled={!newFund}
            className="w-full py-6 font-bold text-black disabled:opacity-50"
            style={{
              background: '#ffc107',
            }}
          >
            အဆင်သင့်လုပ်ဆောင်မည်
          </Button>
        </Card>

        {/* Info */}
        <Card
          className="p-4 border text-xs"
          style={{
            background: '#0f1215',
            borderColor: '#222',
          }}
        >
          <div className="space-y-2" style={{ color: '#888' }}>
            <p>• ရန်ပုံငွေကို အချိန်မရွေး ပြင်ဆင်နိုင်ပါသည်</p>
            <p>• ရန်ပုံငွေ အများဆုံး 200,000 MMK ထည့်သွင်းနိုင်ပါသည်</p>
            <p>• ရန်ပုံငွေမှ အနည်းဆုံး 10,000 MMK ထည့်သွင်းရမည်</p>
            <p>• ပြောင်းလဲမှုတိုင်းကို မှတ်တမ်းတင်ပါသည်</p>
          </div>
        </Card>
      </div>
    </main>
  );
  }
