'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, History, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  getWallet,
  setFund,
} from '@/lib/storage';
import {
  getMonthlyFund,
  setInitialMonthlyFund,
  addToMonthlyFund,
  getTotalMonthlyFund,
  getCurrentMonthYear,
  formatFundDateTime,
  getFundHistory,
  FundHistoryDisplay,
} from '@/lib/monthly-fund';
import { validateFundAmount } from '@/lib/trx-utils';

export default function AccountPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [fund, setFundState] = useState(0);
  const [newFund, setNewFund] = useState('');
  const [additionAmount, setAdditionAmount] = useState('');
  const [additionNote, setAdditionNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fundHistory, setFundHistory] = useState<FundHistoryDisplay[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Monthly fund state
  const { year, month } = getCurrentMonthYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthName = `${monthNames[month - 1]} ${year}`;
  const [currentMonthlyFund, setCurrentMonthlyFund] = useState<{ initial: number; additions: any[]; total: number; hasFund: boolean }>({
    initial: 0,
    additions: [],
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
        additions: monthlyFund.additions,
        total: total,
        hasFund: true,
      });
      setFundState(total);
    } else {
      setCurrentMonthlyFund({
        initial: 0,
        additions: [],
        total: 0,
        hasFund: false,
      });
      setFundState(0);
    }
    
    // Load all fund history
    setFundHistory(getFundHistory());
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

  const handleAddFund = () => {
    const amount = parseInt(additionAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!additionNote.trim()) {
      setError('Please provide a reason for adding fund');
      return;
    }

    const result = addToMonthlyFund(year, month, amount, additionNote);
    if (result) {
      setSuccess(`Added ${amount.toLocaleString()} MMK to fund`);
      setAdditionAmount('');
      setAdditionNote('');
      setShowAddForm(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Failed to add fund. Make sure initial fund is set first.');
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

        {/* Add Additional Fund Section */}
        {currentMonthlyFund.hasFund && (
          <Card
            className="p-6 border"
            style={{
              background: '#1e2329',
              borderColor: '#222',
            }}
          >
            <h3 className="font-bold mb-4">ထပ်ဆောင်းရန်ပုံငွေ ထည့်သွင်းမည်</h3>

            {!showAddForm ? (
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 text-sm"
                style={{
                  background: '#2a2a2a',
                  color: '#ffc107',
                  border: '1px solid #ffc107',
                }}
              >
                <Plus size={14} className="mr-1" />
                Add Additional Fund
              </Button>
            ) : (
              <div>
                <Input
                  type="number"
                  value={additionAmount}
                  onChange={(e) => setAdditionAmount(e.target.value)}
                  placeholder="Amount (MMK)"
                  className="mb-2"
                  style={{
                    background: '#000',
                    borderColor: '#444',
                    color: '#fff',
                  }}
                />
                <Textarea
                  value={additionNote}
                  onChange={(e) => setAdditionNote(e.target.value)}
                  placeholder="Reason for adding fund (e.g., Deposit profit, Bonus, etc.)"
                  className="mb-2 resize-none"
                  rows={2}
                  style={{
                    background: '#000',
                    borderColor: '#444',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 text-sm"
                    style={{ background: '#333', color: '#fff' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddFund}
                    disabled={!additionAmount || !additionNote.trim()}
                    className="flex-1 py-2 text-sm"
                    style={{ background: '#ffc107', color: '#000' }}
                  >
                    Add Fund
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Fund History Section */}
        <Card
          className="p-6 border"
          style={{
            background: '#1e2329',
            borderColor: '#222',
          }}
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-center gap-2 mb-4"
          >
            <History size={16} style={{ color: '#ffc107' }} />
            <span className="font-bold" style={{ color: '#ffc107' }}>
              {showHistory ? 'Hide Fund History' : 'Show Fund History'}
            </span>
          </button>

          {showHistory && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {fundHistory.length === 0 && (
                <div className="text-center text-xs text-gray-500 py-4">
                  No fund history yet. Set initial fund to get started.
                </div>
              )}
              {fundHistory.map((history) => (
                <div
                  key={`${history.year}-${history.month}`}
                  className="p-3 rounded-lg"
                  style={{
                    background: history.year === year && history.month === month ? '#ffc10720' : '#0f1419',
                    border: '1px solid #333',
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium" style={{ color: '#ffc107' }}>
                      {history.monthName}
                    </span>
                    <span className="text-xs text-white">
                      Total: {history.totalFund.toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="space-y-1">
                    {history.history.map((entry) => (
                      <div key={entry.id} className="text-[10px] flex justify-between items-center py-1 border-t border-gray-800">
                        <div className="flex items-center gap-2">
                          <span>{entry.type === 'add' ? '➕' : entry.type === 'edit' ? '✏️' : '📌'}</span>
                          <span style={{ color: entry.type === 'add' ? '#00c853' : '#ffc107' }}>
                            {entry.newAmount.toLocaleString()} MMK
                          </span>
                          {entry.previousAmount && (
                            <span className="text-gray-500">(was {entry.previousAmount.toLocaleString()} MMK)</span>
                          )}
                        </div>
                        <span className="text-gray-500">{formatFundDateTime(entry.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <p>• Deposit limit ကို Settings မှာ ဖွင့်/ပိတ် လုပ်နိုင်ပါသည်</p>
          </div>
        </Card>
      </div>
    </main>
  );
        }
