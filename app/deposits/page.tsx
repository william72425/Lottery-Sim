'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  addDeposit,
  getDeposits,
  getRemainingDepositsToday,
  getWallet,
  getFund,
  Deposit,
} from '@/lib/storage';
import { validateDepositAmount } from '@/lib/trx-utils';
import { formatDate, formatTime, groupByDate } from '@/lib/sound';

export default function DepositsPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [fund, setFund] = useState(0);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [remainingDeposits, setRemainingDeposits] = useState(3);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setWallet(getWallet());
    setFund(getFund());
    setDeposits(getDeposits());
    setRemainingDeposits(getRemainingDepositsToday());
  }, []);

  const handleDeposit = () => {
    setError('');
    setSuccess('');

    if (fund <= 0) {
      setError('Fund account has no balance to transfer');
      return;
    }

    const depositAmount = parseInt(amount);
    if (isNaN(depositAmount)) {
      setError('Invalid amount');
      return;
    }

    if (depositAmount > fund) {
      setError(`Cannot deposit more than your fund balance (${fund.toLocaleString()})`);
      return;
    }

    const validation = validateDepositAmount(depositAmount);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (remainingDeposits <= 0) {
      setError('Max 3 deposits per day');
      return;
    }

    const newDeposit = addDeposit(depositAmount, note);
    if (newDeposit) {
      setWallet(getWallet());
      setDeposits(getDeposits());
      setRemainingDeposits(getRemainingDepositsToday());
      setAmount('');
      setNote('');
      setSuccess(
        `${depositAmount.toLocaleString()} MMK deposited successfully`
      );
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const groupedDeposits = groupByDate(deposits);
  const dateOrder = Object.keys(groupedDeposits).sort((a, b) => {
    const aDate = deposits.find((d) => formatDate(d.createdAt) === a)?.createdAt || '';
    const bDate = deposits.find((d) => formatDate(d.createdAt) === b)?.createdAt || '';
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
        <h1 className="text-xl font-bold">Deposits</h1>
      </div>

      {/* Content */}
      <div className="w-full max-w-md mx-auto px-2 pt-6 space-y-6">
        {/* Fund Balance */}
        <Card
          className="p-6 border"
          style={{
            background: 'linear-gradient(135deg, #1a3a1a 0%, #0a1a0a 100%)',
            borderColor: '#00c853',
            borderBottomWidth: '4px',
          }}
        >
          <div className="text-xs text-gray-400 mb-2">Fund Account</div>
          <div
            className="text-4xl font-black"
            style={{ color: '#00c853' }}
          >
            {fund.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">MMK</div>
        </Card>

        {/* Deposit Form */}
        <Card
          className="p-6 border"
          style={{
            background: '#1e2329',
            borderColor: '#222',
          }}
        >
          <h3 className="font-bold mb-4">Deposit to Game Account</h3>

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

          <div
            className="p-3 rounded-lg mb-4 text-sm"
            style={{
              background: 'rgba(255, 193, 7, 0.1)',
              borderLeft: '3px solid #ffc107',
              color: '#ffc107',
            }}
          >
            Remaining deposits today: {remainingDeposits}/3
          </div>

          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10000 - 100000"
            className="mb-3"
            style={{
              background: '#000',
              borderColor: '#444',
              color: '#fff',
            }}
          />

          <Input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="mb-4"
            style={{
              background: '#000',
              borderColor: '#444',
              color: '#fff',
            }}
          />

          <Button
            onClick={handleDeposit}
            disabled={!amount || remainingDeposits <= 0 || fund <= 0}
            className="w-full py-6 font-bold text-black disabled:opacity-50"
            style={{
              background: '#00c853',
            }}
          >
            Confirm
          </Button>
        </Card>

        {/* Deposit History */}
        {deposits.length > 0 && (
          <div>
            <h3
              className="text-sm font-bold mb-4"
              style={{ color: '#ffc107' }}
            >
              Deposit History
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
                    {groupedDeposits[date].map((deposit) => (
                      <Card
                        key={deposit.id}
                        className="p-4 border flex items-center justify-between"
                        style={{
                          background: '#0f1215',
                          borderColor: '#1f252b',
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-bold">
                            +{deposit.amount.toLocaleString()} MMK
                          </div>
                          <div
                            className="text-xs mt-1"
                            style={{ color: '#555' }}
                          >
                            {formatTime(deposit.createdAt)}
                            {deposit.note && ` • ${deposit.note}`}
                          </div>
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: '#00c853' }}
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
