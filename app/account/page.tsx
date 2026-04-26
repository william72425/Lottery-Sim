'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getWallet } from '@/lib/storage';
import {
  getMonthlyFund,
  setInitialMonthlyFund,
  addToMonthlyFund,
  getTotalMonthlyFund,
  getCurrentMonthYear,
  formatFundDateTime,
  getFundHistory,
} from '@/lib/monthly-fund';
import { validateFundAmount } from '@/lib/trx-utils';

export default function AccountPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [newFund, setNewFund] = useState('');
  const [additionAmount, setAdditionAmount] = useState('');
  const [additionNote, setAdditionNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fundHistory, setFundHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const { year, month } = getCurrentMonthYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthName = `${monthNames[month - 1]} ${year}`;
  const [currentMonthlyFund, setCurrentMonthlyFund] = useState({
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
    const monthlyFund = getMonthlyFund(year, month);
    if (monthlyFund) {
      setCurrentMonthlyFund({
        initial: monthlyFund.initialFund,
        additions: monthlyFund.additions,
        total: getTotalMonthlyFund(year, month),
        hasFund: true,
      });
    } else {
      setCurrentMonthlyFund({
        initial: 0,
        additions: [],
        total: 0,
        hasFund: false,
      });
    }
    setFundHistory(getFundHistory());
  };

  const handleSetFund = () => {
    setError('');
    setSuccess('');
    const amount = parseInt(newFund);
    if (isNaN(amount)) {
      setError('Invalid amount');
      return;
    }
    const validation = validateFundAmount(amount);
    if (!validation.valid) {
      setError(validation.error || 'Invalid amount');
      return;
    }
    const result = setInitialMonthlyFund(year, month, amount, 'Fund updated from account page');
    if (result) {
      setNewFund('');
      loadData();
      setSuccess(`Fund set to ${amount.toLocaleString()} MMK`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Failed to set fund');
    }
  };

  const handleAddFund = () => {
    const amount = parseInt(additionAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!additionNote.trim()) {
      setError('Please provide a reason');
      return;
    }
    const result = addToMonthlyFund(year, month, amount, additionNote);
    if (result) {
      setSuccess(`Added ${amount.toLocaleString()} MMK`);
      setAdditionAmount('');
      setAdditionNote('');
      setShowAddForm(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Failed - set initial fund first');
    }
  };

  return (
    <main className="min-h-screen pb-20" style={{ background: '#090b0d', color: '#fff' }}>
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 border-b" style={{ background: '#090b0d', borderColor: '#222' }}>
        <button onClick={() => router.back()} className="p-2 hover:opacity-80">
          <ArrowLeft size={24} style={{ color: '#ffc107' }} />
        </button>
        <h1 className="text-xl font-bold">Account</h1>
      </div>

      <div className="w-full max-w-md mx-auto px-2 pt-6 space-y-6">
        <Card className="p-6 border" style={{ background: 'linear-gradient(135deg, #1a3a1a 0%, #0a1a0a 100%)', borderColor: '#00c853', borderBottomWidth: '4px' }}>
          <div className="text-xs text-gray-400 mb-2">Wallet Balance</div>
          <div className="text-4xl font-black" style={{ color: '#00c853' }}>{wallet.toLocaleString()} MMK</div>
        </Card>

        <Card className="p-6 border" style={{ background: 'linear-gradient(135deg, #1e2329, #111)', borderColor: '#ffc107', borderBottomWidth: '4px' }}>
          <div className="flex justify-between mb-2">
            <div className="text-xs text-gray-400">Fund ({currentMonthName})</div>
            {currentMonthlyFund.hasFund && <div className="text-[10px] text-green-500">✓ Set</div>}
          </div>
          <div className="text-4xl font-black" style={{ color: '#ffc107' }}>{currentMonthlyFund.total.toLocaleString()} MMK</div>
          <div className="text-xs text-gray-500 mt-2">10,000 - 200,000 • No 30-day limit</div>
        </Card>

        <Card className="p-6 border" style={{ background: '#1e2329', borderColor: '#222' }}>
          <h3 className="font-bold mb-4">Set Fund</h3>
          {error && <div className="p-3 rounded-lg mb-4 text-sm" style={{ background: '#ff3d00', color: '#fff' }}>{error}</div>}
          {success && <div className="p-3 rounded-lg mb-4 text-sm" style={{ background: '#00c853', color: '#fff' }}>{success}</div>}
          <div className="p-3 rounded-lg mb-4 text-sm" style={{ background: 'rgba(0,200,83,0.1)', borderLeft: '3px solid #00c853', color: '#00c853' }}>✅ No 30-day limit - edit anytime</div>
          <Input type="number" value={newFund} onChange={(e) => setNewFund(e.target.value)} placeholder="10000 - 200000" className="mb-4" style={{ background: '#000', borderColor: '#444', color: '#fff' }} />
          <Button onClick={handleSetFund} disabled={!newFund} className="w-full py-3 font-bold text-black" style={{ background: '#ffc107' }}>Set Fund</Button>
        </Card>

        {currentMonthlyFund.hasFund && (
          <Card className="p-6 border" style={{ background: '#1e2329', borderColor: '#222' }}>
            <h3 className="font-bold mb-4">Add Additional Fund</h3>
            {!showAddForm ? (
              <Button onClick={() => setShowAddForm(true)} className="w-full py-3 text-sm" style={{ background: '#2a2a2a', color: '#ffc107', border: '1px solid #ffc107' }}>
                <Plus size={14} className="mr-1" /> Add Fund
              </Button>
            ) : (
              <div>
                <Input type="number" value={additionAmount} onChange={(e) => setAdditionAmount(e.target.value)} placeholder="Amount (MMK)" className="mb-2" style={{ background: '#000', borderColor: '#444', color: '#fff' }} />
                <Textarea value={additionNote} onChange={(e) => setAdditionNote(e.target.value)} placeholder="Reason" className="mb-2 resize-none" rows={2} style={{ background: '#000', borderColor: '#444', color: '#fff', fontSize: '12px' }} />
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddForm(false)} className="flex-1 py-2 text-sm" style={{ background: '#333', color: '#fff' }}>Cancel</Button>
                  <Button onClick={handleAddFund} disabled={!additionAmount || !additionNote.trim()} className="flex-1 py-2 text-sm" style={{ background: '#ffc107', color: '#000' }}>Add</Button>
                </div>
              </div>
            )}
          </Card>
        )}

        <Card className="p-6 border" style={{ background: '#1e2329', borderColor: '#222' }}>
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-center gap-2 mb-4">
            <History size={16} style={{ color: '#ffc107' }} />
            <span className="font-bold" style={{ color: '#ffc107' }}>{showHistory ? 'Hide History' : 'Show History'}</span>
          </button>
          {showHistory && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {fundHistory.length === 0 && <div className="text-center text-xs text-gray-500 py-4">No history</div>}
              {fundHistory.map((h) => (
                <div key={`${h.year}-${h.month}`} className="p-3 rounded-lg" style={{ background: h.year === year && h.month === month ? '#ffc10720' : '#0f1419', border: '1px solid #333' }}>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: '#ffc107' }}>{h.monthName}</span>
                    <span className="text-xs">Total: {h.totalFund.toLocaleString()} MMK</span>
                  </div>
                  {h.history.map((entry: any) => (
                    <div key={entry.id} className="text-[10px] flex justify-between py-1 border-t border-gray-800">
                      <span>{entry.type === 'add' ? '➕' : entry.type === 'edit' ? '✏️' : '📌'} {entry.newAmount.toLocaleString()} MMK</span>
                      <span>{formatFundDateTime(entry.createdAt)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 border text-xs" style={{ background: '#0f1215', borderColor: '#222' }}>
          <div className="space-y-2 text-gray-500">
            <p>• Fund can be edited anytime (no 30-day limit)</p>
            <p>• Min: 10,000 | Max: 200,000 MMK</p>
            <p>• All changes are tracked</p>
            <p>• Deposit limit can be toggled in Settings</p>
          </div>
        </Card>
      </div>
    </main>
  );
    }
