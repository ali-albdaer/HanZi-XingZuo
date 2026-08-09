import React, { useEffect, useMemo, useCallback } from 'react';
import { useDeckStore } from '../../stores/deckStore';
import { MasteryBadge } from '../shared/MasteryBadge';
import { HskBadge } from '../shared/HskBadge';
import { CopyButton } from '../shared/CopyButton';
import { X, Play, Hash, GitFork, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDeckCharacters, sortCharacters } from '../../db/queries';
import { searchAndRankCharacters } from '../../core/search';

import { generatePracticeQueue } from '../../core/queue';
import { usePracticeStore } from '../../stores/practiceStore';

export const CharacterDetailModal: React.FC = () => {
  const navigate = useNavigate();
  const selectedCharacter = useDeckStore((s) => s.selectedCharacter);
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);
  const sortOption = useDeckStore((s) => s.sortOption);
  const searchQuery = useDeckStore((s) => s.searchQuery);

  const copyText = selectedCharacter
    ? `${selectedCharacter.id} [${selectedCharacter.pinyin.join(', ')}]\nDefinitions: ${selectedCharacter.definitions.join('; ')}\nSentences:\n` +
      selectedCharacter.sentences.map((s) => `• ${s.chinese} (${s.english})`).join('\n')
    : '';

  const handlePracticeNow = async () => {
    if (!selectedCharacter) return;
    const charId = selectedCharacter.id;
    const deckId = selectedCharacter.deckId;
    setSelectedCharacter(null);
    const queue = await generatePracticeQueue(deckId, { guaranteedCharacterId: charId });
    usePracticeStore.getState().startSession(queue);
    navigate('/practice');
  };

  const rawCharacters = useLiveQuery(
    () => selectedCharacter ? getDeckCharacters(selectedCharacter.deckId) : Promise.resolve([]),
    [selectedCharacter?.deckId]
  );

  const characters = useMemo(() => {
    if (!rawCharacters) return [];
    return searchQuery.trim()
      ? searchAndRankCharacters(rawCharacters, searchQuery)
      : sortCharacters(rawCharacters, sortOption);
  }, [rawCharacters, searchQuery, sortOption]);

  const currentIndex = selectedCharacter ? characters.findIndex(c => c.id === selectedCharacter.id) : -1;

  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < characters.length - 1) {
      setSelectedCharacter(characters[currentIndex + 1]);
    }
  }, [currentIndex, characters, setSelectedCharacter]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedCharacter(characters[currentIndex - 1]);
    }
  }, [currentIndex, characters, setSelectedCharacter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input (e.g. search bar behind modal)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handlePrev();
      }
    };
    
    if (selectedCharacter) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleNext, handlePrev, selectedCharacter]);

  if (!selectedCharacter) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 16px',
      }}
      onClick={() => setSelectedCharacter(null)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 20,
          border: '1px solid var(--border-color)',
          padding: '16px 20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 10,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Buttons (Left/Right) floating outside */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: 'calc(50% - 260px)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {currentIndex >= 0 && currentIndex < characters.length - 1 && (
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: 'calc(50% - 260px)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <MasteryBadge level={selectedCharacter.progress.mastery} />
          <button
            onClick={() => setSelectedCharacter(null)}
            style={{
              padding: 5,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Character Main Header */}
        <div style={{ textAlign: 'center', margin: '2px 0' }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {selectedCharacter.id}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--accent-cyan)',
              marginTop: 4,
            }}
          >
            {selectedCharacter.pinyin.join(', ')}
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              marginTop: 4,
              lineHeight: 1.3,
            }}
          >
            {selectedCharacter.definitions.join('; ')}
          </div>
        </div>

        {/* Meta info tags */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <HskBadge level={selectedCharacter.hskLevel || '1'} />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            <Hash size={12} />
            <span>Rank #{selectedCharacter.frequency}</span>
          </div>

          {selectedCharacter.radical && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '3px 8px',
                borderRadius: 6,
              }}
            >
              <GitFork size={12} />
              <span>Radical: {selectedCharacter.radical}</span>
            </div>
          )}
        </div>

        {/* Example Sentences (No label, larger text, fitting 100%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'center' }}>
          {selectedCharacter.sentences.map((sentence, idx) => (
            <div
              key={sentence.id || idx}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {sentence.chinese}
              </div>
              {sentence.pinyin && (
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent-cyan)', marginTop: 2 }}>
                  {sentence.pinyin}
                </div>
              )}
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.3 }}>
                {sentence.english}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <CopyButton textToCopy={copyText} label="Copy Content" className="flex-1" />

          <button
            onClick={handlePracticeNow}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent-cyan), #0099FF)',
              color: '#000',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <Play size={16} fill="#000" />
            <span>Practice Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
