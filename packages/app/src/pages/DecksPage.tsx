import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getAllDecks, getDeckCharacters, deleteCustomDeck } from '../db/queries';
import { useNavigate } from 'react-router-dom';
import { useDeckStore } from '../stores/deckStore';
import { BookOpen, Vault, Sparkles, ChevronRight, Plus, Trash2, FileText } from 'lucide-react';
import { APP_CONFIG } from '../config/app.config';
import { CreateDeckModal } from '../components/vault/CreateDeckModal';

export const DecksPage: React.FC = () => {
  const navigate = useNavigate();
  const setActiveDeckId = useDeckStore((s) => s.setActiveDeckId);

  const allDecks = useLiveQuery(() => getAllDecks(), []);
  const top1000Chars = useLiveQuery(() => getDeckCharacters('top-1000'), []);
  const vaultChars = useLiveQuery(() => getDeckCharacters('my-vault'), []);

  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleDeleteDeck = async (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this custom deck?')) {
      await deleteCustomDeck(deckId);
    }
  };

  const customDecks = allDecks?.filter((d) => d.id !== 'top-1000' && d.id !== 'my-vault') || [];

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 80 }}>
      {/* App Branding Header + Create Deck Button */}
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={24} style={{ color: 'var(--accent-cyan)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
              HanZi XingZuo
            </h1>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 12,
            background: 'var(--accent-cyan)',
            color: '#000',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Import Text</span>
        </button>
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

      {/* User Custom Decks Section */}
      {customDecks.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 }}>
            My Custom Decks ({customDecks.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {customDecks.map((deck) => (
              <div
                key={deck.id}
                onClick={() => handleSelectDeck(deck.id)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 16,
                  padding: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(0, 229, 255, 0.1)',
                      color: 'var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{deck.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {deck.description}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={(e) => handleDeleteDeck(e, deck.id)}
                    title="Delete Custom Deck"
                    style={{
                      padding: 6,
                      borderRadius: 8,
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Deck Modal */}
      {showCreateModal && <CreateDeckModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
};
