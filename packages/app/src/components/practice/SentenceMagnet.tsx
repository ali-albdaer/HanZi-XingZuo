import React, { useState, useEffect } from 'react';
import type { ExerciseItem } from '../../core/queue';
import { saveExerciseResult } from '../../core/srs';
import { Check, X, RotateCcw, ArrowRight } from 'lucide-react';

interface SentenceMagnetProps {
  exercise: ExerciseItem;
  onComplete: (isCorrect: boolean) => void;
}

export const SentenceMagnet: React.FC<SentenceMagnetProps> = ({ exercise, onComplete }) => {
  const { sentence, character: targetChar } = exercise;
  const originalChunks = sentence.chunks;

  // State for user's selected tray and remaining bank
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [shuffledBank, setShuffledBank] = useState<{ id: number; text: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Initialize shuffled bank
  useEffect(() => {
    const indexed = originalChunks.map((text, idx) => ({ id: idx, text }));
    // Shuffle chunks
    const shuffled = [...indexed].sort(() => Math.random() - 0.5);
    setShuffledBank(shuffled);
    setSelectedIndices([]);
    setSubmitted(false);
    setIsCorrect(false);
  }, [sentence]);

  const handleSelectChunk = (chunkId: number) => {
    if (submitted) return;
    if (selectedIndices.includes(chunkId)) {
      // Unselect chunk
      setSelectedIndices(selectedIndices.filter((id) => id !== chunkId));
    } else {
      // Add chunk to tray
      setSelectedIndices([...selectedIndices, chunkId]);
    }
  };

  const handleResetTray = () => {
    if (submitted) return;
    setSelectedIndices([]);
  };

  const handleSubmit = async () => {
    if (submitted || selectedIndices.length === 0) return;

    // Check constructed sentence
    const constructedText = selectedIndices.map((id) => originalChunks[id]).join('');
    const targetText = sentence.chinese;

    const correct = constructedText === targetText;
    setIsCorrect(correct);
    setSubmitted(true);

    // Record SRS exercise result in IndexedDB
    await saveExerciseResult(targetChar.id, targetChar.deckId, correct);
  };

  const handleNext = () => {
    onComplete(isCorrect);
  };

  // Keyboard Enter listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (submitted) {
          handleNext();
        } else if (selectedIndices.length > 0) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitted, selectedIndices, isCorrect]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        padding: '8px 0 12px',
        boxSizing: 'border-box',
      }}
    >
      {/* Target prompt header */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
          {sentence.english}
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Reassemble the word blocks in correct grammatical order.
        </div>
      </div>

      {/* Answer Tray (Constructed Sentence) */}
      <div
        style={{
          minHeight: 74,
          background: 'rgba(255, 255, 255, 0.03)',
          border: `2px dashed ${
            submitted
              ? isCorrect
                ? 'var(--accent-green, #4CAF50)'
                : 'var(--accent-red, #F44336)'
              : selectedIndices.length > 0
              ? 'var(--accent-cyan)'
              : 'var(--border-color)'
          }`,
          borderRadius: 16,
          padding: 10,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          alignContent: 'flex-start',
          position: 'relative',
          transition: 'border-color 0.2s ease',
        }}
      >
        {selectedIndices.length === 0 ? (
          <span style={{ fontSize: 13, color: 'var(--text-muted)', width: '100%', textAlign: 'center', margin: 'auto' }}>
            Tap word blocks below to build sentence
          </span>
        ) : (
          selectedIndices.map((chunkId) => (
            <button
              key={`selected-${chunkId}`}
              onClick={() => handleSelectChunk(chunkId)}
              disabled={submitted}
              style={{
                background: 'rgba(0, 229, 255, 0.15)',
                border: '1px solid var(--accent-cyan)',
                color: 'var(--text-primary)',
                padding: '7px 12px',
                borderRadius: 10,
                fontSize: 18,
                fontWeight: 600,
                cursor: submitted ? 'default' : 'pointer',
                transition: 'transform 0.1s ease',
              }}
            >
              {originalChunks[chunkId]}
            </button>
          ))
        )}

        {selectedIndices.length > 0 && !submitted && (
          <button
            onClick={handleResetTray}
            title="Clear Tray"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* Result Pinyin Reveal after submission */}
      {submitted && (
        <div
          style={{
            background: isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            border: `1px solid ${isCorrect ? '#4CAF50' : '#F44336'}`,
            borderRadius: 12,
            padding: '10px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            {isCorrect ? <Check size={16} color="#4CAF50" /> : <X size={16} color="#F44336" />}
            <span style={{ fontWeight: 700, fontSize: 13, color: isCorrect ? '#4CAF50' : '#F44336' }}>
              {isCorrect ? 'Correct!' : 'Correct Sentence:'}
            </span>
          </div>

          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
            {sentence.chinese}
          </div>
          <div style={{ fontSize: 13, color: 'var(--accent-cyan)', marginTop: 2 }}>
            {sentence.pinyin}
          </div>
        </div>
      )}

      {/* Word Chunk Bank */}
      {!submitted && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {shuffledBank.map((item) => {
            const isUsed = selectedIndices.includes(item.id);
            return (
              <button
                key={`bank-${item.id}`}
                onClick={() => handleSelectChunk(item.id)}
                disabled={isUsed}
                style={{
                  background: isUsed ? 'rgba(255, 255, 255, 0.02)' : 'var(--bg-card)',
                  border: `1px solid ${isUsed ? 'transparent' : 'var(--border-color)'}`,
                  color: isUsed ? 'transparent' : 'var(--text-primary)',
                  padding: '9px 14px',
                  borderRadius: 12,
                  fontSize: 19,
                  fontWeight: 600,
                  cursor: isUsed ? 'default' : 'pointer',
                  opacity: isUsed ? 0.2 : 1,
                  boxShadow: isUsed ? 'none' : '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'opacity 0.15s ease, transform 0.15s ease',
                }}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      )}

      {/* Action Footer Button */}
      <div>
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIndices.length === 0}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: selectedIndices.length === 0 ? 'rgba(255, 255, 255, 0.08)' : 'var(--accent-cyan)',
              color: selectedIndices.length === 0 ? 'var(--text-muted)' : '#000',
              fontSize: 15,
              fontWeight: 700,
              cursor: selectedIndices.length === 0 ? 'default' : 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            Check Answer (Enter)
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: 'var(--accent-cyan)',
              color: '#000',
              fontSize: 15,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <span>Next (Enter)</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
