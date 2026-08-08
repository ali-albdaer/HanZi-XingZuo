import React from 'react';
import type { CharacterWithProgress } from '../../db/queries';
import { MasteryBadge } from '../shared/MasteryBadge';
import { HskBadge } from '../shared/HskBadge';
import { useDeckStore } from '../../stores/deckStore';

interface CharacterCardProps {
  item: CharacterWithProgress;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ item }) => {
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);

  return (
    <div
      onClick={() => setSelectedCharacter(item)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, background 0.15s ease',
      }}
      className="character-card-item"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Character Node Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {item.id}
        </div>

        {/* Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {item.pinyin.join(', ')}
            </span>
            <HskBadge level={item.hskLevel || '1'} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              #{item.frequency}
            </span>
          </div>

          <div
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginTop: 2,
              maxLines: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 180,
            }}
          >
            {item.definitions.join('; ')}
          </div>
        </div>
      </div>

      {/* Mastery level badge */}
      <MasteryBadge level={item.progress.mastery} showLabel={false} />
    </div>
  );
};
