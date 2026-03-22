'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  History,
  DollarSign,
  Send,
  LogOut,
  Settings,
  X,
} from 'lucide-react';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
  const router = useRouter();

  const menuItems = [
    {
      icon: Gamepad2,
      label: 'Betting',
      href: '/',
    },
    {
      icon: History,
      label: 'History',
      href: '/history',
    },
    {
      icon: DollarSign,
      label: 'Deposits',
      href: '/deposits',
    },
    {
      icon: Send,
      label: 'Withdrawals',
      href: '/withdrawals',
    },
    {
      icon: DollarSign,
      label: 'Account',
      href: '/account',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity"
        style={{ background: 'rgba(0, 0, 0, 0.85)' }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 bottom-0 z-50 w-64 overflow-y-auto"
        style={{
          background: '#1e2329',
          borderRight: '1px solid #222',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#222' }}>
          <h2 className="font-black" style={{ color: '#ffc107' }}>
            MENU
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:opacity-80 transition-opacity"
          >
            <X size={20} style={{ color: '#ffc107' }} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:opacity-80"
                style={{
                  background: 'rgba(255, 193, 7, 0.1)',
                  borderLeft: '3px solid #ffc107',
                }}
              >
                <Icon size={20} style={{ color: '#ffc107' }} />
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: '#222' }}>
          <button
            onClick={() => {
              // Can add logout/reset functionality here
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:opacity-80"
            style={{
              background: '#ff3d00',
              color: '#fff',
            }}
          >
            <LogOut size={20} />
            <span className="font-semibold">Exit</span>
          </button>
        </div>
      </div>
    </>
  );
}
