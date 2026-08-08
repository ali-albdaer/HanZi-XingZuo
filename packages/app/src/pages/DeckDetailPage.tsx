import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDeckCharacters } from '../db/queries';
import { db } from '../db/schema';
import { useDeckStore } from '../stores/deckStore';
import { DeckListView } from '../components/deck/DeckListView';
import { ConstellationCanvas } from '../components/constellation/ConstellationCanvas';
import { CharacterDetailModal } from '../components/deck/CharacterDetailModal';
import { ArrowLeft, List, Share2 } from 'lucide-react';

export const DeckDetailPage: React.FC = () => {
  const { deckId = 'top-1000' } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId]);
  const characters = useLiveQuery(() => getDeckCharacters(deckId), [deckId]);

  const viewMode = useDeckStore((s) => s.viewMode);
  const setViewMode = useDeckStore((s) => s.setViewMode);

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-glass)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/decks')}
            style={{
              padding: 6,
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-primary)',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{deck?.name || 'Deck'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {characters?.length || 0} characters
            </div>
          </div>
        </div>

        {/* View mode toggle */}
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
            onClick={() => setViewMode('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: viewMode === 'list' ? 'var(--accent-cyan)' : 'transparent',
              color: viewMode === 'list' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <List size={14} />
            <span>List</span>
          </button>

          <button
            onClick={() => setViewMode('constellation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: viewMode === 'constellation' ? 'var(--accent-cyan)' : 'transparent',
              color: viewMode === 'constellation' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <Share2 size={14} />
            <span>Constellation</span>
          </button>
        </div>
      </div>

      {/* Main View Content */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {viewMode === 'list' ? (
          <DeckListView characters={characters || []} />
        ) : (
          <div style={{ flex: 1, minHeight: 'calc(100vh - 120px)' }}>
            <ConstellationCanvas characters={characters || []} />
          </div>
        )}
      </div>

      {/* Detail Modal overlay */}
      <CharacterDetailModal />
    </div>
  );
};
