import React from 'react';
import type { CharacterWithProgress } from '../../db/queries';
import { MasteryBadge } from '../shared/MasteryBadge';
import { HskBadge } from '../shared/HskBadge';
import { useDeckStore } from '../../stores/deckStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { MASTERY_COLORS } from '../../config/app.config';

interface CharacterCardProps {
  item: CharacterWithProgress;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ item }) => {
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);
  const listDisplayOptions = useSettingsStore((s) => s.listDisplayOptions);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
        {/* Character Box */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.02)',
            border: `2px solid ${MASTERY_COLORS[item.progress.mastery]}80`, // 50% opacity
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text-primary)',
            flexShrink: 0,
          }}
        >
          {item.id}
        </div>

        {/* Info */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {listDisplayOptions.showPinyin && (
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent-cyan)' }}>
                {item.pinyin.join(', ')}
              </span>
            )}
            {listDisplayOptions.showRank && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                #{item.frequency}
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.definitions.join('; ')}
          </div>
        </div>
      </div>

      {/* Badges on Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, opacity: 0.85 }}>
        {listDisplayOptions.showHsk && (
          <HskBadge level={item.hskLevel || '1'} size="sm" />
        )}
        <MasteryBadge level={item.progress.mastery} showLabel={false} />
      </div>
    </div>
  );
};
