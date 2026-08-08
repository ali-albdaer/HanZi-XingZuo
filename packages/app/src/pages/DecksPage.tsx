import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDeckCharacters } from '../db/queries';
import { useNavigate } from 'react-router-dom';
import { useDeckStore } from '../stores/deckStore';
import { BookOpen, Vault, Sparkles, ChevronRight } from 'lucide-react';
import { APP_CONFIG } from '../config/app.config';

export const DecksPage: React.FC = () => {
  const top1000Chars = useLiveQuery(() => getDeckCharacters('top-1000'), []);
  const vaultChars = useLiveQuery(() => getDeckCharacters('my-vault'), []);

  const setActiveDeckId = useDeckStore((s) => s.setActiveDeckId);
  const navigate = useNavigate();

  const getMasteryStats = (chars: typeof top1000Chars) => {
    if (!chars) return { total: 0, gold: 0, silver: 0, bronze: 0, grey: 0 };
    return chars.reduce(
      (acc, c) => {
        acc[c.progress.mastery]++;
        acc.total++;
        return acc;
      },
      { total: 0, gold: 0, silver: 0, bronze: 0, grey: 0 }
    );
  };

  const top1000Stats = getMasteryStats(top1000Chars);
  const vaultStats = getMasteryStats(vaultChars);

  const handleSelectDeck = (deckId: string) => {
    setActiveDeckId(deckId);
    navigate(`/decks/${deckId}`);
  };

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* App Branding Header */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={24} style={{ color: 'var(--accent-cyan)' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
            HanZi XingZuo
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Contextual reading & constellation mastery
        </p>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Available Decks
      </div>

      {/* Deck Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Top 1000 Deck */}
        <div
          onClick={() => handleSelectDeck('top-1000')}
          style={{
            background: 'linear-gradient(135deg, rgba(32, 32, 50, 0.9), rgba(24, 24, 36, 0.9))',
            border: '1px solid var(--border-color)',
            borderRadius: 18,
            padding: 20,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(0, 229, 255, 0.12)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={22} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Top 1000 Characters</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Sourced from SUBTLEX-CH spoken frequencies
                </div>
              </div>
            </div>

            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* Progress Bar Multi-color */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span>{top1000Stats.total - top1000Stats.grey} / {top1000Stats.total} Learned</span>
              <span>{Math.round(((top1000Stats.total - top1000Stats.grey) / (top1000Stats.total || 1)) * 100)}%</span>
            </div>

            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(top1000Stats.gold / (top1000Stats.total || 1)) * 100}%`, background: APP_CONFIG.mastery.colors.gold }} />
              <div style={{ width: `${(top1000Stats.silver / (top1000Stats.total || 1)) * 100}%`, background: APP_CONFIG.mastery.colors.silver }} />
              <div style={{ width: `${(top1000Stats.bronze / (top1000Stats.total || 1)) * 100}%`, background: APP_CONFIG.mastery.colors.bronze }} />
            </div>
          </div>
        </div>

        {/* My Vault Deck */}
        <div
          onClick={() => handleSelectDeck('my-vault')}
          style={{
            background: 'linear-gradient(135deg, rgba(32, 32, 50, 0.9), rgba(24, 24, 36, 0.9))',
            border: '1px solid var(--border-color)',
            borderRadius: 18,
            padding: 20,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(124, 77, 255, 0.12)',
                  color: 'var(--accent-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Vault size={22} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>My Vault</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Custom mined characters & sentences
                </div>
              </div>
            </div>

            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {vaultStats.total} custom characters saved
          </div>
        </div>
      </div>
    </div>
  );
};
