import React from 'react';
import type { CharacterWithProgress } from '../../db/queries';
import { useDeckStore } from '../../stores/deckStore';
import { BookOpen } from 'lucide-react';

interface CustomDeckReaderProps {
  characters: CharacterWithProgress[];
}

export const CustomDeckReader: React.FC<CustomDeckReaderProps> = ({ characters }) => {
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);

  const charMap = new Map<string, CharacterWithProgress>();
  characters.forEach((c) => charMap.set(c.id, c));

  return (
    <div
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
      className="custom-scrollbar"
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 18,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-cyan)', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
          <BookOpen size={16} />
          <span>Interactive Reader (Tap any character for detail)</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 2px', lineHeight: 1.8 }}>
          {characters.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => setSelectedCharacter(item)}
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: 'var(--text-primary)',
                padding: '2px 4px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {item.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
