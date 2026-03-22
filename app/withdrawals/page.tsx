'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  addWithdrawal,
  getWithdrawals,
  getWallet,
  getFund,
  Withdrawal,
} from '@/lib/storage';
import { validateWithdrawalAmount } from '@/lib/trx-utils';
import { formatDate, formatTime, groupByDate } from '@/lib/sound';

export default function WithdrawalsPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [fund, setFund] = useState(0);
  const [amount, setAmount] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setWallet(getWallet());
    setFund(getFund());
    setWithdrawals(getWithdrawals());
  }, []);

  const handleWithdrawal = () => {
    setError('');
    setSuccess('');

    const withdrawAmount = parseInt(amount);
    if (isNaN(withdrawAmount)) {
      setError('Invalid amount');
      return;
    }

    const validation = validateWithdrawalAmount(withdrawAmount, wallet);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmWithdrawal = () => {
    const withdrawAmount = parseInt(amount);
    const withdrawal = addWithdrawal(withdrawAmount);

    if (withdrawal) {
      setWallet(getWallet());
      setFund(getFund());
      setWithdrawals(getWithdrawals());
      setAmount('');
      setShowConfirm(false);
      setSuccess(
        `${withdrawAmount.toLocaleString()} MMK withdrawn successfully`
      );
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const groupedWithdrawals = groupByDate(withdrawals);
  const dateOrder = Object.keys(groupedWithdrawals).sort((a, b) => {
    const aDate = withdrawals.find(
      (w) => formatDate(w.createdAt) === a
    )?.createdAt || '';
    const bDate = withdrawals.find(
      (w) => formatDate(w.createdAt) === b
    )?.createdAt || '';
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

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
        <h1 className="text-xl font-bold">Withdrawals</h1>
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
          <div className="text-xs text-gray-400 mb-2">Game Account</div>
          <div
            className="text-4xl font-black"
            style={{ color: '#00c853' }}
          >
            {wallet.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">MMK</div>
        </Card>

        {/* Withdrawal Form */}
        <Card
          className="p-6 border"
          style={{
            background: '#1e2329',
            borderColor: '#222',
          }}
        >
          <h3 className="font-bold mb-4">Withdraw Amount</h3>

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

          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Minimum 100 MMK"
            className="mb-4"
            style={{
              background: '#000',
              borderColor: '#444',
              color: '#fff',
            }}
          />

          <Button
            onClick={handleWithdrawal}
            disabled={!amount || parseInt(amount) < 100}
            className="w-full py-6 font-bold text-black disabled:opacity-50"
            style={{
              background: '#ff3d00',
            }}
          >
            Withdraw
          </Button>
        </Card>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowConfirm(false)}
              style={{
                background: 'rgba(0, 0, 0, 0.85)',
              }}
            />
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowConfirm(false)}
            >
              <Card
                className="border"
                style={{
                  background: '#1e2329',
                  borderColor: '#222',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-4">
                  <h3 className="font-bold text-lg">Confirm Withdrawal</h3>
                  <div className="text-center">
                    <div
                      className="text-3xl font-black"
                      style={{ color: '#ff3d00' }}
                    >
                      {parseInt(amount).toLocaleString()} MMK
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      will be withdrawn from your account
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 py-3"
                      style={{
                        background: '#333',
                        color: '#fff',
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmWithdrawal}
                      className="flex-1 py-3 font-bold text-black"
                      style={{
                        background: '#ff3d00',
                      }}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <div>
            <h3
              className="text-sm font-bold mb-4"
              style={{ color: '#ffc107' }}
            >
              Withdrawal History
            </h3>

            <div className="space-y-4">
              {dateOrder.map((date) => (
                <div key={date}>
                  <div
                    className="text-xs font-bold mb-2 px-2"
                    style={{ color: '#888' }}
                  >
                    {date}
                  </div>

                  <div className="space-y-2">
                    {groupedWithdrawals[date].map((withdrawal) => (
                      <Card
                        key={withdrawal.id}
                        className="p-4 border flex items-center justify-between"
                        style={{
                          background: '#0f1215',
                          borderColor: '#1f252b',
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-bold">
                            -{withdrawal.amount.toLocaleString()} MMK
                          </div>
                          <div
                            className="text-xs mt-1"
                            style={{ color: '#555' }}
                          >
                            {formatTime(withdrawal.createdAt)}
                          </div>
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: '#ff3d00' }}
                        >
                          ✓
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
