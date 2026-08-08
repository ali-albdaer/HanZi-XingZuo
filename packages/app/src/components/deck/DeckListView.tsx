import React from 'react';
import type { CharacterWithProgress } from '../../db/queries';
import { CharacterCard } from './CharacterCard';
import { useDeckStore } from '../../stores/deckStore';
import type { SortOption } from '../../config/app.config';
import { Search, ArrowUpDown } from 'lucide-react';

interface DeckListViewProps {
  characters: CharacterWithProgress[];
}

const SORT_LABELS: Record<SortOption, string> = {
  frequency: 'Frequency',
  alphabetical: 'Pinyin (A-Z)',
  mastery: 'Mastery Level',
  radical: 'Shared Radical',
};

export const DeckListView: React.FC<DeckListViewProps> = ({ characters }) => {
  const sortOption = useDeckStore((s) => s.sortOption);
  const setSortOption = useDeckStore((s) => s.setSortOption);
  const searchQuery = useDeckStore((s) => s.searchQuery);
  const setSearchQuery = useDeckStore((s) => s.setSearchQuery);

  const filtered = characters.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.id.includes(q) ||
      c.pinyin.some((p) => p.toLowerCase().includes(q)) ||
      c.definitions.some((d) => d.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Search Bar & Sort selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '10px 14px',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search character, pinyin, meaning..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
          />
        </div>

        {/* Sort option pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>
            <ArrowUpDown size={14} />
            <span>Sort:</span>
          </div>

          {(['frequency', 'alphabetical', 'mastery', 'radical'] as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortOption(opt)}
              style={{
                whiteSpace: 'nowrap',
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: sortOption === opt ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.06)',
                color: sortOption === opt ? '#000' : 'var(--text-secondary)',
                border: sortOption === opt ? 'none' : '1px solid var(--border-color)',
                transition: 'all 0.15s ease',
              }}
            >
              {SORT_LABELS[opt]}
            </button>
          ))}
        </div>
      </div>

      {/* Result Count */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 4 }}>
        Showing {filtered.length} of {characters.length} characters
      </div>

      {/* Character List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((item) => (
          <CharacterCard key={item.id} item={item} />
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No characters match "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
