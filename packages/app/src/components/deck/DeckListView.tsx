import React, { useState } from 'react';
import type { CharacterWithProgress } from '../../db/queries';
import { sortCharacters } from '../../db/queries';
import { searchAndRankCharacters } from '../../core/search';
import { CharacterCard } from './CharacterCard';
import { useDeckStore } from '../../stores/deckStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { SortOption, MasteryLevel } from '../../config/app.config';
import { Search, LayoutGrid, List, SlidersHorizontal, ChevronDown, Eye, Square } from 'lucide-react';
import { HskBadge } from '../shared/HskBadge';

interface DeckListViewProps {
  characters: CharacterWithProgress[];
}

const SORT_LABELS: Record<SortOption, string> = {
  frequency: 'Frequency',
  alphabetical: 'Pinyin A–Z',
  mastery: 'Mastery',
  radical: 'Radical',
  random: 'Random',
  hsk: 'HSK Level',
};

function getMasteryAccent(level: MasteryLevel): string {
  switch (level) {
    case 'gold':   return 'rgba(255,215,0,0.55)';
    case 'silver': return 'rgba(160,176,192,0.45)';
    case 'bronze': return 'rgba(205,127,50,0.45)';
    default:       return 'var(--border-color)';
  }
}

function getMasteryGlow(level: MasteryLevel): string {
  switch (level) {
    case 'gold':   return '0 0 10px rgba(255,215,0,0.18)';
    case 'silver': return 'none';
    case 'bronze': return 'none';
    default:       return 'none';
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

  const listFilterOptions = useSettingsStore((s) => s.listFilterOptions);
  const setListFilterOptions = useSettingsStore((s) => s.setListFilterOptions);

  const cardDisplayOptions = useSettingsStore((s) => s.cardDisplayOptions);
  const setCardDisplayOptions = useSettingsStore((s) => s.setCardDisplayOptions);

  const [displayLayout, setDisplayLayout] = useState<'list' | 'grid'>('grid');
  const [showDisplayOptions, setShowDisplayOptions] = useState(true);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showCardViewOptions, setShowCardViewOptions] = useState(false);

  // Filter by Known status and mastery
  const filteredByKnown = characters.filter((c) => {
    if (!listFilterOptions.showKnownCharacters && c.progress.isKnown) return false;
    
    const mastery = c.progress.mastery;
    if (mastery === 'gold' && !listFilterOptions.showMasteryGold) return false;
    if (mastery === 'silver' && !listFilterOptions.showMasterySilver) return false;
    if (mastery === 'bronze' && !listFilterOptions.showMasteryBronze) return false;
    if (mastery === 'grey' && !listFilterOptions.showMasteryGrey) return false;
    
    return true;
  });

  // Apply sort / search
  const sortedAndFiltered = searchQuery.trim()
    ? searchAndRankCharacters(filteredByKnown, searchQuery)
    : sortCharacters(filteredByKnown, sortOption, randomSeed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Compact Toolbar ─────────────────────────────── */}
      <div
        style={{
          padding: '8px 12px 8px',
          background: 'var(--bg-main)',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {/* Row 1: Search + Sort + Layout + Filter toggle */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

          {/* Search */}
          <div
            style={{
              flex: '0 1 120px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: '7px 12px',
            }}
          >
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 13,
                minWidth: 0,
              }}
            />
          </div>

          {/* Sort dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: '7px 28px 7px 10px',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
              ))}
            </select>
            <ChevronDown
              size={12}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Grid / List toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: 3,
              gap: 2,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setDisplayLayout('grid')}
              title="Grid View"
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                backgroundColor: displayLayout === 'grid' ? 'var(--accent-cyan)' : 'transparent',
                color: displayLayout === 'grid' ? '#000' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setDisplayLayout('list')}
              title="List View"
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                backgroundColor: displayLayout === 'list' ? 'var(--accent-cyan)' : 'transparent',
                color: displayLayout === 'list' ? '#000' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <List size={14} />
            </button>
          </div>

          {/* Display options toggle */}
          <button
            onClick={() => setShowDisplayOptions((v) => !v)}
            title="Display options"
            className={`btn btn-secondary ${showDisplayOptions ? 'active' : ''}`}
            style={{
              padding: '7px 10px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Eye size={14} />
            <span>Display</span>
          </button>

          {/* Filter options toggle */}
          <button
            onClick={() => setShowFilterOptions((v) => !v)}
            title="Filter options"
            className={`btn btn-secondary ${showFilterOptions ? 'active' : ''}`}
            style={{
              padding: '7px 10px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <SlidersHorizontal size={14} />
            <span>Filter</span>
          </button>
          {/* Card-View options toggle */}
          <button
            onClick={() => setShowCardViewOptions((v) => !v)}
            title="Card-View options"
            className={`btn btn-secondary ${showCardViewOptions ? 'active' : ''}`}
            style={{
              padding: '7px 10px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Square size={14} />
            <span>Card-View</span>
          </button>
        </div>

        {/* Row 2: Expandable options */}
        {(showDisplayOptions || showFilterOptions || showCardViewOptions) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              paddingTop: 2,
              paddingBottom: 2,
              flexWrap: 'wrap',
            }}
          >
            {showDisplayOptions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, marginRight: 2 }}>DISPLAY:</span>
                {[
                  { key: 'showPinyin', label: 'Pinyin' },
                  { key: 'showRank',   label: 'Rank' },
                  { key: 'showHsk',    label: 'HSK' },
                ].map(({ key, label }) => {
                  const isOn = listDisplayOptions[key as keyof typeof listDisplayOptions] as boolean;
                  return (
                    <button
                      key={key}
                      onClick={() => setListDisplayOptions({ [key]: !isOn })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: `1px solid ${isOn ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                        background: isOn ? 'rgba(24,231,236,0.12)' : 'transparent',
                        color: isOn ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        transition: 'all 0.12s ease',
                        letterSpacing: 0.2,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            
            {showFilterOptions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, marginRight: 2 }}>FILTER:</span>
                {[
                  { key: 'showKnownCharacters', label: 'Known' },
                  { key: 'showMasteryGold', label: 'Gold' },
                  { key: 'showMasterySilver', label: 'Silver' },
                  { key: 'showMasteryBronze', label: 'Bronze' },
                  { key: 'showMasteryGrey', label: 'Grey' },
                ].map(({ key, label }) => {
                  const isOn = listFilterOptions[key as keyof typeof listFilterOptions] as boolean;
                  return (
                    <button
                      key={key}
                      onClick={() => setListFilterOptions({ [key]: !isOn })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: `1px solid ${isOn ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                        background: isOn ? 'rgba(24,231,236,0.12)' : 'transparent',
                        color: isOn ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        transition: 'all 0.12s ease',
                        letterSpacing: 0.2,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {showCardViewOptions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, marginRight: 2 }}>CARD-VIEW:</span>
                {[
                  { key: 'showMeaning', label: 'Meaning' },
                  { key: 'showMastery', label: 'Mastery' },
                  { key: 'showHsk', label: 'HSK' },
                  { key: 'showPinyin', label: 'Pinyin' },
                  { key: 'showRank', label: 'Rank' },
                  { key: 'showRadical', label: 'Radical' },
                  { key: 'showSentences', label: 'Sentences' },
                  { key: 'showActions', label: 'Actions' },
                ].map(({ key, label }) => {
                  const isOn = cardDisplayOptions[key as keyof typeof cardDisplayOptions] as boolean;
                  return (
                    <button
                      key={key}
                      onClick={() => setCardDisplayOptions({ [key]: !isOn })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: `1px solid ${isOn ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                        background: isOn ? 'rgba(24,231,236,0.12)' : 'transparent',
                        color: isOn ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        transition: 'all 0.12s ease',
                        letterSpacing: 0.2,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Result info bar ─────────────────────────────── */}
      <div
        style={{
          padding: '5px 14px',
          fontSize: 11,
          color: 'var(--text-muted)',
          flexShrink: 0,
          letterSpacing: 0.2,
        }}
      >
        {sortedAndFiltered.length.toLocaleString()} / {characters.length.toLocaleString()} chars
      </div>

      {/* ── Scrollable Content ───────────────────────────── */}
      <div
        className="custom-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 24px' }}
      >
        {displayLayout === 'grid' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
              gap: 8,
            }}
          >
            {sortedAndFiltered.map((item) => {
              const mastery = item.progress.mastery;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCharacter(item)}
                  className="grid-card-item"
                  style={{
                    borderRadius: 12,
                    padding: '10px 6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    height: 90,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    background: 'var(--bg-card)',
                    border: `1px solid ${getMasteryAccent(mastery)}`,
                    boxShadow: getMasteryGlow(mastery),
                    transition: 'transform 0.13s ease, border-color 0.13s ease',
                  }}
                >
                  {/* Character */}
                  <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                      {item.id}
                    </div>
                    {listDisplayOptions.showPinyin && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-cyan)', lineHeight: 1 }}>
                        {item.pinyin[0]}
                      </div>
                    )}
                  </div>

                  {/* Footer row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', minHeight: 16 }}>
                    {listDisplayOptions.showRank && (
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
                        #{item.frequency}
                      </span>
                    )}
                    {listDisplayOptions.showHsk && (
                      <HskBadge level={item.hskLevel || '1'} size="sm" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sortedAndFiltered.map((item) => (
              <CharacterCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {sortedAndFiltered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {searchQuery ? `No results for "${searchQuery}"` : 'No characters to display.'}
          </div>
        )}
      </div>
    </div>
  );
};
