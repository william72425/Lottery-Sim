'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getFund,
  setFund,
  canEditFund,
  getFundEditCountdown,
  getWallet,
} from '@/lib/storage';
import { validateFundAmount } from '@/lib/trx-utils';

export default function AccountPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [fund, setFundState] = useState(0);
  const [newFund, setNewFund] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setWallet(getWallet());
    setFundState(getFund());

    const canEditNow = canEditFund();
    setCanEdit(canEditNow);

    if (!canEditNow) {
      const { daysRemaining: days } = getFundEditCountdown();
      setDaysRemaining(days);
    }
  }, []);

  const handleUpdateFund = () => {
    setError('');
    setSuccess('');

    const amount = parseInt(newFund);
    if (isNaN(amount)) {
      setError('မှားယွင်းတဲ့ပမ္ဆာဏ');
      return;
    }

    const validation = validateFundAmount(amount);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (!canEdit) {
      setError(`နောက်ထပ် ${daysRemaining} ရက်အကြာမှ ပြင်ဆင်လို့ရပါမည်`);
      return;
    }

    setFund(amount);
    setFundState(amount);
    setNewFund('');
    setCanEdit(false);
    setDaysRemaining(30);
    setSuccess('ရန်ပုံငွေ အဆင်သင့်လုပ်ဆောင်ပြီးပါပြီ');

    setTimeout(() => setSuccess(''), 3000);
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

        {/* Fund Balance */}
        <Card
          className="p-6 border"
          style={{
            background: 'linear-gradient(135deg, #1e2329, #111)',
            borderColor: '#ffc107',
            borderBottomWidth: '4px',
          }}
        >
          <div className="text-xs text-gray-400 mb-2">ရန်ပုံငွေ</div>
          <div
            className="text-4xl font-black"
            style={{ color: '#ffc107' }}
          >
            {fund.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            10,000 - 200,000 အကြား
          </div>
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

          {!canEdit && daysRemaining > 0 && (
            <div
              className="p-3 rounded-lg mb-4 text-sm"
              style={{
                background: 'rgba(255, 193, 7, 0.1)',
                borderLeft: '3px solid #ffc107',
                color: '#ffc107',
              }}
            >
              နောက်ထပ် {daysRemaining} ရက်အကြာမှ ပြင်ဆင်လို့ရပါမည်
            </div>
          )}

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
            disabled={!canEdit}
          />

          <Button
            onClick={handleUpdateFund}
            disabled={!canEdit || !newFund}
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
            <p>• ရန်ပုံငွေကို လစ်လျှင် တစ်ကြိမ်သာ ပြင်ဆင်လို့ရပါသည်</p>
            <p>• ရန်ပုံငွေ အများဆုံး 200,000 MMK ထည့်သွင်းနိုင်ပါသည်</p>
            <p>• ရန်ပုံငွေမှ အနည်းဆုံး 10,000 MMK ထည့်သွင်းရမည်</p>
          </div>
        </Card>
      </div>
    </main>
  );
    }
