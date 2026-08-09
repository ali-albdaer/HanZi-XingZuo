import React, { useState, useEffect } from 'react';
import { usePracticeStore } from '../stores/practiceStore';
import { generatePracticeQueue } from '../core/queue';
import { PracticeView } from '../components/practice/PracticeView';
import { getDeckCharacters } from '../db/queries';
import { isMasteryDecayed } from '../core/srs';
import { useDeckStore } from '../stores/deckStore';
import { Play, Sparkles } from 'lucide-react';

export const PracticePage: React.FC = () => {
  const { sessionActive, startSession } = usePracticeStore();
  const activeDeckId = useDeckStore((s) => s.activeDeckId) || 'top-1000';
  const [loading, setLoading] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    async function loadStats() {
      const all = await getDeckCharacters(activeDeckId);
      const now = Date.now();

      let due = 0;
      let unseen = 0;

      for (const item of all) {
        if (item.progress.mastery === 'grey') {
          unseen++;
        } else {
          const decayed = isMasteryDecayed(item.progress.mastery, item.progress.lastReviewedAt, now);
          if (decayed) {
            due++;
          }
        }
      }

      setDueCount(due);
      setUnseenCount(unseen);
    }
    loadStats();
  }, [sessionActive]);

  const handleStartPractice = async () => {
    setLoading(true);
    try {
      const queue = await generatePracticeQueue(activeDeckId, { sessionSize: 10 });
      startSession(queue);
    } catch (err) {
      console.error('Failed to generate practice queue:', err);
    } finally {
      setLoading(false);
    }
  };

  if (sessionActive) {
    return <PracticeView />;
  }

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
        backgroundColor: 'var(--bg-main)',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 24,
          background: 'rgba(0, 229, 255, 0.15)',
          border: '1px solid var(--accent-cyan)',
          color: 'var(--accent-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Sparkles size={36} />
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
        Practice
      </h2>

      {/* Queue Breakdown Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          width: '100%',
          maxWidth: 320,
          margin: '28px 0',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: '16px 12px',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {dueCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Need Practice
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: '16px 12px',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: '#4CAF50' }}>
            {unseenCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            New Characters
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStartPractice}
        disabled={loading}
        style={{
          width: '100%',
          maxWidth: 320,
          padding: '16px 0',
          borderRadius: 16,
          border: 'none',
          background: 'var(--accent-cyan)',
          color: '#000',
          fontSize: 18,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          cursor: loading ? 'default' : 'pointer',
          boxShadow: '0 4px 16px rgba(0, 229, 255, 0.3)',
          transition: 'transform 0.15s ease',
        }}
      >
        <Play size={20} fill="#000" />
        <span>{loading ? 'Preparing Session...' : 'Start Practice Session'}</span>
      </button>
    </div>
  );
};
