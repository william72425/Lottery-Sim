'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle, Info, History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  getMonthlyFund, 
  setInitialMonthlyFund, 
  addToMonthlyFund,
  getTotalMonthlyFund,
  hasMonthlyFund,
  getFundHistory,
  FundHistoryEntry
} from '@/lib/monthly-fund';

interface MonthlyFundModalProps {
  isOpen: boolean;
  year: number;
  month: number;
  monthName: string;
  onClose: () => void;
  onSave?: () => void;
}

export function MonthlyFundModal({ isOpen, year, month, monthName, onClose, onSave }: MonthlyFundModalProps) {
  const [initialFund, setInitialFund] = useState('');
  const [additionAmount, setAdditionAmount] = useState('');
  const [additionNote, setAdditionNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentFund, setCurrentFund] = useState<{ initial: number; additions: any[]; total: number } | null>(null);
  const [fundHistory, setFundHistory] = useState<FundHistoryEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, year, month]);

  const loadData = () => {
    const fund = getMonthlyFund(year, month);
    if (fund) {
      setCurrentFund({
        initial: fund.initialFund,
        additions: fund.additions,
        total: fund.initialFund + fund.additions.reduce((sum, a) => sum + a.amount, 0),
      });
    } else {
      setCurrentFund(null);
    }
    setFundHistory(getFundHistory());
    setError('');
    setSuccess('');
    setInitialFund('');
    setAdditionAmount('');
    setAdditionNote('');
    setShowAddForm(false);
  };

  const handleSetInitialFund = () => {
    const amount = parseInt(initialFund);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount (minimum 10,000 MMK)');
      return;
    }
    if (amount < 10000) {
      setError('Initial fund must be at least 10,000 MMK');
      return;
    }
    if (amount > 200000) {
      setError('Initial fund cannot exceed 200,000 MMK');
      return;
    }

    const result = setInitialMonthlyFund(year, month, amount);
    if (result) {
      setSuccess(`Initial fund of ${amount.toLocaleString()} MMK set for ${monthName}`);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
      onSave?.();
    } else {
      setError('Fund already set for this month');
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
      onSave?.();
    } else {
      setError('Failed to add fund. Make sure initial fund is set first.');
    }
  };

  if (!isOpen) return null;

  const hasFund = currentFund !== null;

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
          borderTop: '3px solid #ffc107',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#fff' }}>
              Monthly Fund Settings
            </h3>
            <div className="text-xs mt-1" style={{ color: '#ffc107' }}>
              {monthName}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:opacity-80">
            <X size={20} style={{ color: '#888' }} />
          </button>
        </div>

        {/* Current Fund Display */}
        {hasFund && (
          <div
            className="p-3 rounded-lg mb-4"
            style={{
              background: '#0f1419',
              border: '1px solid #333',
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Initial Fund</span>
              <span className="text-sm font-bold" style={{ color: '#ffc107' }}>
                {currentFund.initial.toLocaleString()} MMK
              </span>
            </div>
            {currentFund.additions.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-gray-400 mb-1">Additional Funds:</div>
                {currentFund.additions.map((add, idx) => (
                  <div key={add.id} className="flex justify-between items-center text-xs py-1 border-t border-gray-800">
                    <div className="flex-1">
                      <span style={{ color: '#00c853' }}>+{add.amount.toLocaleString()} MMK</span>
                      <div className="text-[10px] text-gray-500">{add.note}</div>
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {new Date(add.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-800">
              <span className="text-sm font-semibold text-white">Total Fund</span>
              <span className="text-lg font-bold" style={{ color: '#ffc107' }}>
                {currentFund.total.toLocaleString()} MMK
              </span>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="p-2 rounded-lg mb-3 text-xs flex items-center gap-2" style={{ background: '#ff3d0030', color: '#ff3d00' }}>
            <AlertTriangle size={12} />
            {error}
          </div>
        )}
        {success && (
          <div className="p-2 rounded-lg mb-3 text-xs" style={{ background: '#00c85330', color: '#00c853' }}>
            {success}
          </div>
        )}

        {/* Set Initial Fund Form */}
        {!hasFund && (
          <div className="mb-4">
            <div className="text-sm font-medium mb-2" style={{ color: '#fff' }}>
              Set Initial Fund for {monthName}
            </div>
            <div className="text-xs text-gray-400 mb-3">
              Minimum: 10,000 MMK | Maximum: 200,000 MMK
            </div>
            <Input
              type="number"
              value={initialFund}
              onChange={(e) => setInitialFund(e.target.value)}
              placeholder="Enter amount (MMK)"
              className="mb-3"
              style={{
                background: '#0f1419',
                borderColor: '#333',
                color: '#fff',
              }}
            />
            <Button
              onClick={handleSetInitialFund}
              disabled={!initialFund}
              className="w-full py-2 text-sm font-medium disabled:opacity-50"
              style={{
                background: '#ffc107',
                color: '#000',
              }}
            >
              Set Fund
            </Button>
          </div>
        )}

        {/* Add Additional Fund (only if initial fund exists) */}
        {hasFund && !showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2 text-sm mb-4"
            style={{
              background: '#2a2a2a',
              color: '#ffc107',
              border: '1px solid #ffc107',
            }}
          >
            <Plus size={14} className="mr-1" />
            Add Additional Fund
          </Button>
        )}

        {/* Add Fund Form */}
        {hasFund && showAddForm && (
          <div className="mb-4 p-3 rounded-lg" style={{ background: '#0f1419', border: '1px solid #333' }}>
            <div className="text-sm font-medium mb-2" style={{ color: '#fff' }}>
              Add Additional Fund
            </div>
            <Input
              type="number"
              value={additionAmount}
              onChange={(e) => setAdditionAmount(e.target.value)}
              placeholder="Amount (MMK)"
              className="mb-2"
              style={{
                background: '#090b0d',
                borderColor: '#333',
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
                background: '#090b0d',
                borderColor: '#333',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-1 text-xs"
                style={{ background: '#333', color: '#fff' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddFund}
                disabled={!additionAmount || !additionNote.trim()}
                className="flex-1 py-1 text-xs"
                style={{ background: '#ffc107', color: '#000' }}
              >
                Add Fund
              </Button>
            </div>
          </div>
        )}

        {/* Fund History Button */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs rounded-lg"
          style={{
            background: '#0f1419',
            border: '1px solid #333',
            color: '#ffc107',
          }}
        >
          <History size={12} />
          {showHistory ? 'Hide Fund History' : 'Show Fund History'}
        </button>

        {/* Fund History */}
        {showHistory && fundHistory.length > 0 && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-400 mb-2">Previous Months</div>
            {fundHistory.map((history) => (
              <div
                key={`${history.year}-${history.month}`}
                className="p-2 rounded-lg text-xs"
                style={{
                  background: history.year === year && history.month === month ? '#ffc10720' : '#0f1419',
                  border: '1px solid #333',
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{history.monthName}</span>
                  <span style={{ color: '#ffc107' }}>{history.totalFund.toLocaleString()} MMK</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  Initial: {history.initialFund.toLocaleString()} MMK
                  {history.additions.length > 0 && ` + ${history.additions.length} additions`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Note */}
        <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-500 text-center">
          <Info size={10} className="inline mr-1" />
          Fund can only be set once per month. Additional funds can be added with reason notes.
        </div>
      </div>
    </>
  );
    }
