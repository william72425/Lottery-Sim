'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wallet, Menu } from 'lucide-react';

interface HeaderProps {
  walletBalance: number;
  onMenuClick?: () => void;
}

export function Header({ walletBalance, onMenuClick }: HeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b"
      style={{
        background: '#090b0d',
        borderColor: '#222',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="text-lg font-black"
          style={{ color: '#ffc107' }}
        >
          TRX WIN GO
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/account"
          className="flex items-center gap-1 p-2 rounded-lg transition-colors hover:opacity-80"
          style={{
            background: 'rgba(255, 193, 7, 0.1)',
          }}
        >
          <Wallet size={20} style={{ color: '#ffc107' }} />
          <span
            className="text-sm font-bold"
            style={{ color: '#ffc107' }}
          >
            {walletBalance.toLocaleString()}
          </span>
        </Link>

        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg transition-colors hover:opacity-80"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          <Menu size={20} style={{ color: '#ffc107' }} />
        </button>
      </div>
    </header>
  );
}
