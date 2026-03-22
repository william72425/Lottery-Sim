'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getNumberColor } from '@/lib/trx-utils';

interface GameResult {
  issueNumber: string;
  number: number;
  color?: string;
  datetime?: string;
}

const ITEMS_PER_PAGE = 10;

function loadFromStorage(): GameResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('trx_results');
    if (!raw) return [];
    return JSON.parse(raw) as GameResult[];
  } catch {
    return [];
  }
}

export function ResultsDisplay() {
  const [results, setResults] = useState<GameResult[]>(() => loadFromStorage());
  const [page, setPage] = useState(0);

  // Stable ref so intervals/listeners don't get stale state
  const resultsRef = useRef<GameResult[]>(results);

  useEffect(() => {
    // Poll every 5 seconds — only update state when data actually changed
    const interval = setInterval(() => {
      const fresh = loadFromStorage();
      // Compare by first issueNumber to avoid unnecessary renders
      const changed =
        fresh.length !== resultsRef.current.length ||
        (fresh.length > 0 &&
          fresh[0].issueNumber !== resultsRef.current[0]?.issueNumber);
      if (changed) {
        resultsRef.current = fresh;
        setResults(fresh);
        // If a new result was added and we're on page 0, no page reset needed
        // but if current page is now out of range, reset to 0
        const totalPages = Math.ceil(fresh.length / ITEMS_PER_PAGE);
        setPage(prev => (prev >= totalPages ? 0 : prev));
      }
    }, 5000);

    // Also listen for storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'trx_results') {
        const fresh = loadFromStorage();
        resultsRef.current = fresh;
        setResults(fresh);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Derive display slice directly — no intermediate state needed
  const totalPages = Math.max(1, Math.ceil(results.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * ITEMS_PER_PAGE;
  const displayResults = results.slice(start, start + ITEMS_PER_PAGE);

  const isSmall = (num: number) => num < 5;

  return (
    <div className="w-full space-y-3">
      {/* Results Container */}
      <div
        className="rounded-xl p-3 space-y-2"
        style={{ background: '#1e2329', border: '1px solid #333' }}
      >
        {displayResults.length === 0 ? (
          <div className="text-center py-6 text-xs" style={{ color: '#666' }}>
            မည်သည့်ရလဒ်မျှမရှိသေးပါ
          </div>
        ) : (
          displayResults.map((result, idx) => (
            <div
              key={result.issueNumber}
              className="flex items-center justify-between p-2 rounded-lg"
              style={{ background: '#0f1419' }}
            >
              {/* Period Number */}
              <div className="text-xs font-bold w-16" style={{ color: '#999' }}>
                {result.issueNumber}
              </div>

              {/* Result Digit */}
              <div className="flex items-center justify-center flex-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{
                    background: getNumberColor(result.number, result.color),
                    color: result.number === 9 ? '#000' : '#fff',
                  }}
                >
                  {result.number}
                </div>
              </div>

              {/* Big/Small Label */}
              <div
                className="text-xs font-bold text-right"
                style={{
                  color: isSmall(result.number) ? '#00e5ff' : '#ffc107',
                }}
              >
                {isSmall(result.number) ? 'Small' : 'Big'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(prev => Math.max(0, prev - 1))}
            disabled={safePage === 0}
            className="p-1.5 rounded-lg transition-all disabled:opacity-30"
            style={{
              background: safePage === 0 ? '#1e2329' : '#ffc107',
              color: safePage === 0 ? '#666' : '#000',
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-xs font-bold" style={{ color: '#ffc107' }}>
            {safePage + 1} / {totalPages}
          </div>

          <button
            onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={safePage >= totalPages - 1}
            className="p-1.5 rounded-lg transition-all disabled:opacity-30"
            style={{
              background: safePage >= totalPages - 1 ? '#1e2329' : '#ffc107',
              color: safePage >= totalPages - 1 ? '#666' : '#000',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
