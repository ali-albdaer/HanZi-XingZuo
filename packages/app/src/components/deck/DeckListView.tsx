import React, { useState } from 'react';
import type { CharacterWithProgress } from '../../db/queries';
import { sortCharacters } from '../../db/queries';
import { searchAndRankCharacters } from '../../core/search';
import { CharacterCard } from './CharacterCard';
import { useDeckStore } from '../../stores/deckStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { SortOption, MasteryLevel } from '../../config/app.config';
import { Search, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import { HskBadge } from '../shared/HskBadge';

interface DeckListViewProps {
  characters: CharacterWithProgress[];
}

const SORT_LABELS: Record<SortOption, string> = {
  frequency: 'Frequency',
  alphabetical: 'Pinyin (A-Z)',
  mastery: 'Mastery Level',
  radical: 'Shared Radical',
  random: 'Random',
};

function getMasteryCellStyle(level: MasteryLevel) {
  switch (level) {
    case 'gold':
      return {
        background: 'rgba(255, 215, 0, 0.12)',
        border: '1px solid rgba(255, 215, 0, 0.45)',
        boxShadow: '0 0 12px rgba(255, 215, 0, 0.15)',
      };
    case 'silver':
      return {
        background: 'rgba(160, 176, 192, 0.12)',
        border: '1px solid rgba(160, 176, 192, 0.4)',
        boxShadow: 'none',
      };
    case 'bronze':
      return {
        background: 'rgba(205, 127, 50, 0.12)',
        border: '1px solid rgba(205, 127, 50, 0.4)',
        boxShadow: 'none',
      };
    case 'grey':
    default:
      return {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'none',
      };
  }
}

export const DeckListView: React.FC<DeckListViewProps> = ({ characters }) => {
  const sortOption = useDeckStore((s) => s.sortOption);
  const setSortOption = useDeckStore((s) => s.setSortOption);
  const randomSeed = useDeckStore((s) => s.randomSeed);
  const searchQuery = useDeckStore((s) => s.searchQuery);
  const setSearchQuery = useDeckStore((s) => s.setSearchQuery);
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);
  
  const listDisplayOptions = useSettingsStore((s) => s.listDisplayOptions);
  const setListDisplayOptions = useSettingsStore((s) => s.setListDisplayOptions);

  const [displayLayout, setDisplayLayout] = useState<'list' | 'grid'>('grid');

  // Filter by Known status
  const filteredByKnown = characters.filter((c) => listDisplayOptions.showKnownCharacters || !c.progress.isKnown);

  // Apply tiered search ranking if search query is present, otherwise standard sort
  const sortedAndFiltered = searchQuery.trim()
    ? searchAndRankCharacters(filteredByKnown, searchQuery)
    : sortCharacters(filteredByKnown, sortOption, randomSeed);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Search Bar & Layout Controls (Fixed Top Controls) */}
      <div
        style={{
          padding: '14px 16px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: 'var(--bg-main)',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
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
                cursor: 'pointer',
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
                cursor: 'pointer',
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Sort option pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>
            <ArrowUpDown size={14} />
            <span>Sort:</span>
          </div>

          {(['frequency', 'alphabetical', 'mastery', 'radical', 'random'] as SortOption[]).map((opt) => (
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
                cursor: 'pointer',
              }}
            >
              {SORT_LABELS[opt]}
            </button>
          ))}
        </div>

        {/* Display Options Checkboxes (Visible in both layouts) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 4, paddingBottom: 2, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={listDisplayOptions.showPinyin} 
                onChange={(e) => setListDisplayOptions({ showPinyin: e.target.checked })} 
              />
              Pinyin
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={listDisplayOptions.showRank} 
                onChange={(e) => setListDisplayOptions({ showRank: e.target.checked })} 
              />
              Rank
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={listDisplayOptions.showHsk} 
                onChange={(e) => setListDisplayOptions({ showHsk: e.target.checked })} 
              />
              HSK
            </label>
            <div style={{ width: 1, height: 12, background: 'var(--border-color)', margin: '0 4px' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={listDisplayOptions.showKnownCharacters} 
                onChange={(e) => setListDisplayOptions({ showKnownCharacters: e.target.checked })} 
              />
              Show Known
            </label>
          </div>
      </div>

      {/* Result Count bar */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 16px 4px', flexShrink: 0 }}>
        Showing {sortedAndFiltered.length} of {characters.length} characters
      </div>

      {/* Scrollable Cards Area */}
      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 16px 24px',
        }}
      >
        {displayLayout === 'grid' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
              gap: 10,
            }}
          >
            {sortedAndFiltered.map((item) => {
              const masteryStyle = getMasteryCellStyle(item.progress.mastery);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCharacter(item)}
                  style={{
                    ...masteryStyle,
                    borderRadius: 14,
                    padding: '10px 6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    height: 96,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    transition: 'transform 0.15s ease, border-color 0.15s ease, background 0.15s ease',
                  }}
                  className="grid-card-item"
                >
                  <div style={{ textAlign: 'center', marginTop: 2 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                      {item.id}
                    </div>
                    {listDisplayOptions.showPinyin && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-cyan)', marginTop: 2 }}>
                        {item.pinyin[0]}
                      </div>
                    )}
                  </div>

                  {/* Clean Footer Row: Same font size (#Rank & HSK badge), Zero overflow */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      width: '100%',
                    }}
                  >
                    {listDisplayOptions.showRank && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        #{item.frequency}
                      </span>
                    )}
                    {listDisplayOptions.showHsk && (
                      <div style={{ opacity: 0.75, display: 'flex' }}>
                        <HskBadge level={item.hskLevel || '1'} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
    </div>
  );
};
