import React from 'react';
import { Play } from 'lucide-react';

export const PracticePage: React.FC = () => {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'rgba(0, 229, 255, 0.12)',
          color: 'var(--accent-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Play size={32} />
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Practice Mode</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 300, lineHeight: 1.4 }}>
        Dual-priority review queue, Sentence Magnet chunking, and Contextual Cloze exercises coming in Phase 2!
      </p>
    </div>
  );
};
