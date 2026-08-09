import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDeckCharacters } from '../db/queries';
import { db } from '../db/schema';
import { useDeckStore } from '../stores/deckStore';
import { DeckListView } from '../components/deck/DeckListView';
import { ConstellationCanvas } from '../components/constellation/ConstellationCanvas';
import { CharacterDetailModal } from '../components/deck/CharacterDetailModal';
import { ArrowLeft, List, Share2, Globe } from 'lucide-react';

export const DeckDetailPage: React.FC = () => {
  const { deckId = 'top-1000' } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId]);
  const characters = useLiveQuery(() => getDeckCharacters(deckId), [deckId]);

  const viewMode = useDeckStore((s) => s.viewMode);
  const setViewMode = useDeckStore((s) => s.setViewMode);

  const tabs: { key: typeof viewMode; icon: React.ReactNode; label: string }[] = [
    { key: 'list',    icon: <List size={14} />,    label: 'List'     },
    { key: 'orbit',   icon: <Share2 size={14} />,  label: 'Orbit'    },
    { key: 'showAll', icon: <Globe size={14} />,   label: 'Show All' },
  ];

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div
        style={{
          padding: '0 14px',
          height: 52,
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
          gap: 12,
        }}
      >
        {/* Back button + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button
            onClick={() => navigate('/decks')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
          </button>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {deck?.name || 'Deck'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
              {characters?.length?.toLocaleString() ?? 0} characters
            </div>
          </div>
        </div>

        {/* View-mode segmented control */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(0,0,0,0.25)',
            borderRadius: 9,
            padding: 3,
            border: '1px solid var(--border-color)',
            gap: 2,
            flexShrink: 0,
          }}
        >
          {tabs.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: viewMode === key ? 'var(--accent-cyan)' : 'transparent',
                color: viewMode === key ? '#000' : 'var(--text-muted)',
                transition: 'all 0.14s ease',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {viewMode === 'list' ? (
          <DeckListView characters={characters || []} />
        ) : (
          <ConstellationCanvas
            characters={characters || []}
            initialMode={viewMode === 'showAll' ? 'showAll' : 'orbit'}
          />
        )}
      </div>

      {/* ── Detail Modal overlay ─────────────────────────── */}
      <CharacterDetailModal />
    </div>
  );
};
