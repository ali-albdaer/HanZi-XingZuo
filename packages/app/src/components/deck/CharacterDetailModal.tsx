import React from 'react';
import { useDeckStore } from '../../stores/deckStore';
import { MasteryBadge } from '../shared/MasteryBadge';
import { HskBadge } from '../shared/HskBadge';
import { CopyButton } from '../shared/CopyButton';
import { X, Play, Hash, GitFork } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { generatePracticeQueue } from '../../core/queue';
import { usePracticeStore } from '../../stores/practiceStore';

export const CharacterDetailModal: React.FC = () => {
  const navigate = useNavigate();
  const selectedCharacter = useDeckStore((s) => s.selectedCharacter);
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);

  if (!selectedCharacter) return null;

  const copyText =
    `${selectedCharacter.id} [${selectedCharacter.pinyin.join(', ')}]\nDefinitions: ${selectedCharacter.definitions.join('; ')}\nSentences:\n` +
    selectedCharacter.sentences.map((s) => `• ${s.chinese} (${s.english})`).join('\n');

  const handlePracticeNow = async () => {
    const charId = selectedCharacter.id;
    const deckId = selectedCharacter.deckId;
    setSelectedCharacter(null);
    const queue = await generatePracticeQueue(deckId, { guaranteedCharacterId: charId });
    usePracticeStore.getState().startSession(queue);
    navigate('/practice');
  };

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
