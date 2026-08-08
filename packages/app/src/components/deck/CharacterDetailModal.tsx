import React from 'react';
import { useDeckStore } from '../../stores/deckStore';
import { MasteryBadge } from '../shared/MasteryBadge';
import { CopyButton } from '../shared/CopyButton';
import { X, Play, Hash, GitFork } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CharacterDetailModal: React.FC = () => {
  const selectedCharacter = useDeckStore((s) => s.selectedCharacter);
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);
  const navigate = useNavigate();

  if (!selectedCharacter) return null;

  const copyText = `${selectedCharacter.id} [${selectedCharacter.pinyin.join(', ')}]\nDefinitions: ${selectedCharacter.definitions.join('; ')}\nSentences:\n` +
    selectedCharacter.sentences.map((s) => `• ${s.chinese} (${s.english})`).join('\n');

  const handlePracticeNow = () => {
    const charId = selectedCharacter.id;
    setSelectedCharacter(null);
    navigate(`/practice?forceChar=${encodeURIComponent(charId)}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={() => setSelectedCharacter(null)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 24,
          border: '1px solid var(--border-color)',
          padding: 24,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <MasteryBadge level={selectedCharacter.progress.mastery} />
          <button
            onClick={() => setSelectedCharacter(null)}
            style={{
              padding: 6,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Character Main Banner */}
        <div style={{ textAlign: 'center', margin: '4px 0' }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {selectedCharacter.id}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--accent-cyan)',
              marginTop: 8,
            }}
          >
            {selectedCharacter.pinyin.join(', ')}
          </div>
          <div
            style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              marginTop: 6,
              lineHeight: 1.4,
            }}
          >
            {selectedCharacter.definitions.join('; ')}
          </div>
        </div>

        {/* Meta info tags */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px 10px',
              borderRadius: 8,
            }}
          >
            <Hash size={13} />
            <span>Freq Rank #{selectedCharacter.frequency}</span>
          </div>

          {selectedCharacter.radical && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '4px 10px',
                borderRadius: 8,
              }}
            >
              <GitFork size={13} />
              <span>Radical: {selectedCharacter.radical}</span>
            </div>
          )}
        </div>

        {/* Example Sentences */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Example Sentences ({selectedCharacter.sentences.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedCharacter.sentences.map((sentence, idx) => (
              <div
                key={sentence.id || idx}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {sentence.chinese}
                </div>
                {sentence.pinyin && (
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent-cyan)', marginTop: 2 }}>
                    {sentence.pinyin}
                  </div>
                )}
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {sentence.english}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <CopyButton textToCopy={copyText} label="Copy Content" className="flex-1" />

          <button
            onClick={handlePracticeNow}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent-cyan), #0099FF)',
              color: '#000',
              fontWeight: 600,
              fontSize: 14,
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
