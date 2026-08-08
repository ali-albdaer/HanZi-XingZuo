import React, { useState } from 'react';
import type { CharacterWithProgress } from '../../db/queries';
import { sortCharacters } from '../../db/queries';
import { searchAndRankCharacters } from '../../core/search';
import { CharacterCard } from './CharacterCard';
import { useDeckStore } from '../../stores/deckStore';
import type { SortOption } from '../../config/app.config';
import { Search, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import { MasteryBadge } from '../shared/MasteryBadge';
import { HskBadge } from '../shared/HskBadge';

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
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);

  const [displayLayout, setDisplayLayout] = useState<'list' | 'grid'>('grid');

  // Apply tiered search ranking if search query is present, otherwise standard sort
  const sortedAndFiltered = searchQuery.trim()
    ? searchAndRankCharacters(characters, searchQuery)
    : sortCharacters(characters, sortOption);

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Search Bar & Layout Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Search input + Layout switcher */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
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

          {/* Grid / List layout toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 10,
              padding: 3,
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setDisplayLayout('grid')}
              title="Grid View"
              style={{
                padding: '8px 10px',
                borderRadius: 7,
                backgroundColor: displayLayout === 'grid' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: displayLayout === 'grid' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setDisplayLayout('list')}
              title="Detailed List View"
              style={{
                padding: '8px 10px',
                borderRadius: 7,
                backgroundColor: displayLayout === 'list' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: displayLayout === 'list' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              }}
            >
              <List size={16} />
            </button>
          </div>
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
        Showing {sortedAndFiltered.length} of {characters.length} characters
      </div>

      {/* Character Display: Grid vs List */}
      {displayLayout === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
            gap: 10,
          }}
        >
          {sortedAndFiltered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedCharacter(item)}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 14,
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              className="grid-card-item"
            >
              <div style={{ position: 'absolute', top: 6, right: 6 }}>
                <MasteryBadge level={item.progress.mastery} showLabel={false} />
              </div>

              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                {item.id}
              </div>

              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent-cyan)', marginTop: 2 }}>
                {item.pinyin[0]}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <HskBadge level={item.hskLevel || '1'} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>#{item.frequency}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortedAndFiltered.map((item) => (
            <CharacterCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {sortedAndFiltered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          No characters match "{searchQuery}"
        </div>
      )}
    </div>
  );
};
