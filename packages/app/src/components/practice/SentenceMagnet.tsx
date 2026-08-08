import React, { useState, useEffect } from 'react';
import type { ExerciseItem } from '../../core/queue';
import { saveExerciseResult } from '../../core/srs';
import { Check, X, RotateCcw, ArrowRight } from 'lucide-react';

interface SentenceMagnetProps {
  exercise: ExerciseItem;
  onComplete: (isCorrect: boolean) => void;
}

/**
 * Maps a specific word block chunk (e.g. "近照" or "那") to its exact Pinyin syllables.
 * Punctuation symbols return "" so sentence pinyin is never leaked.
 */
function getChunkPinyin(chunkText: string, chinese: string, fullPinyin: string): string {
  // If chunk is punctuation or contains no Chinese ideographs, return empty string
  if (!/[\u4e00-\u9fa5]/.test(chunkText)) {
    return '';
  }

  // Clean Chinese characters and pinyin tokens
  const chars = chinese.replace(/[^\u4e00-\u9fa5]/g, '').split('');
  const pyTokens = fullPinyin.split(/\s+/).filter(Boolean);

  if (chars.length === pyTokens.length) {
    const pyMap = new Map<string, string>();
    chars.forEach((ch, idx) => {
      pyMap.set(ch, pyTokens[idx]);
    });

    const result = chunkText
      .split('')
      .map((ch) => pyMap.get(ch) || '')
      .filter(Boolean)
      .join(' ');

    if (result) return result;
  }

  return '';
}

export const SentenceMagnet: React.FC<SentenceMagnetProps> = ({ exercise, onComplete }) => {
  const { sentence, character: targetChar } = exercise;
  const originalChunks = sentence.chunks;

  // State for user's selected tray and remaining bank
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [shuffledBank, setShuffledBank] = useState<{ id: number; text: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Hover / Touch Peek state for word blocks
  const [peekedChunkId, setPeekedChunkId] = useState<number | null>(null);

  // Initialize shuffled bank
  useEffect(() => {
    const indexed = originalChunks.map((text, idx) => ({ id: idx, text }));
    const shuffled = [...indexed].sort(() => Math.random() - 0.5);
    setShuffledBank(shuffled);
    setSelectedIndices([]);
    setSubmitted(false);
    setIsCorrect(false);
    setPeekedChunkId(null);
  }, [sentence]);

  const handleSelectChunk = (chunkId: number) => {
    if (submitted) return;
    if (selectedIndices.includes(chunkId)) {
      setSelectedIndices(selectedIndices.filter((id) => id !== chunkId));
    } else {
      setSelectedIndices([...selectedIndices, chunkId]);
    }
  };

  const handleResetTray = () => {
    if (submitted) return;
    setSelectedIndices([]);
  };

  const handleSubmit = async () => {
    if (submitted || selectedIndices.length === 0) return;

    const rawConstructed = selectedIndices.map((id) => originalChunks[id]).join('');
    // Strip punctuation for flexible correctness evaluation (punctuation not strictly required)
    const cleanConstructed = rawConstructed.replace(/[^\u4e00-\u9fa5]/g, '');
    const cleanTarget = sentence.chinese.replace(/[^\u4e00-\u9fa5]/g, '');

    const correct = cleanConstructed === cleanTarget;
    setIsCorrect(correct);
    setSubmitted(true);

    await saveExerciseResult(targetChar.id, targetChar.deckId, correct);
  };

  const handleNext = () => {
    onComplete(isCorrect);
  };

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
        justifyContent: 'center',
        gap: 16,
        boxSizing: 'border-box',
      }}
    >
      {/* Target prompt header (Clean English Only - No Pinyin Leak) */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 18,
          padding: '20px 22px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          {sentence.english}
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
                ? '#4CAF50'
                : '#F44336'
              : selectedIndices.length > 0
              ? 'var(--accent-cyan)'
              : 'var(--border-color)'
          }`,
          borderRadius: 16,
          padding: 12,
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
          selectedIndices.map((chunkId) => {
            const chunkText = originalChunks[chunkId];
            const isPeeked = peekedChunkId === chunkId;
            const chunkPy = getChunkPinyin(chunkText, sentence.chinese, sentence.pinyin);

            return (
              <div
                key={`selected-${chunkId}`}
                style={{ position: 'relative', display: 'inline-flex' }}
              >
                <button
                  onClick={() => handleSelectChunk(chunkId)}
                  onMouseEnter={() => setPeekedChunkId(chunkId)}
                  onMouseLeave={() => setPeekedChunkId(null)}
                  onTouchStart={() => setPeekedChunkId(chunkId)}
                  onTouchEnd={() => setPeekedChunkId(null)}
                  disabled={submitted}
                  style={{
                    background: isPeeked ? 'rgba(0, 229, 255, 0.25)' : 'rgba(0, 229, 255, 0.15)',
                    border: '1px solid var(--accent-cyan)',
                    color: 'var(--text-primary)',
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: 18,
                    fontWeight: 600,
                    cursor: submitted ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {chunkText}
                </button>

                {/* Floating Tooltip displaying ONLY the hovered chunk's Pinyin NEXT to the button */}
                {isPeeked && chunkPy && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%) translateY(-6px)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--accent-cyan)',
                      color: 'var(--accent-cyan)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  >
                    {chunkPy}
                  </div>
                )}
              </div>
            );
          })
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

      {/* Reserved Result Pinyin Reveal Space (Prevents UI shifting/jumping) */}
      <div style={{ minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {submitted ? (
          <div
            style={{
              width: '100%',
              background: isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
              border: `1px solid ${isCorrect ? '#4CAF50' : '#F44336'}`,
              borderRadius: 14,
              padding: '10px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              {isCorrect ? <Check size={16} color="#4CAF50" /> : <X size={16} color="#F44336" />}
              <span style={{ fontWeight: 700, fontSize: 13, color: isCorrect ? '#4CAF50' : '#F44336' }}>
                {isCorrect ? 'Correct!' : 'Correct Sentence:'}
              </span>
            </div>

            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
              {sentence.chinese}
            </div>
            <div style={{ fontSize: 13, color: 'var(--accent-cyan)', marginTop: 2 }}>
              {sentence.pinyin}
            </div>
          </div>
        ) : null}
      </div>

      {/* Word Chunk Bank (Always Visible in Allocated Fixed Container) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', minHeight: 90, flexShrink: 0 }}>
          {shuffledBank.map((item) => {
            const isUsed = selectedIndices.includes(item.id);
            const isPeeked = peekedChunkId === item.id;
            const chunkPy = getChunkPinyin(item.text, sentence.chinese, sentence.pinyin);

            return (
              <div
                key={`bank-${item.id}`}
                style={{ position: 'relative', display: 'inline-flex' }}
              >
                <button
                  onClick={() => handleSelectChunk(item.id)}
                  onMouseEnter={() => setPeekedChunkId(item.id)}
                  onMouseLeave={() => setPeekedChunkId(null)}
                  onTouchStart={() => setPeekedChunkId(item.id)}
                  onTouchEnd={() => setPeekedChunkId(null)}
                  disabled={isUsed}
                  style={{
                    background: isUsed
                      ? 'rgba(255, 255, 255, 0.02)'
                      : isPeeked
                      ? 'rgba(0, 229, 255, 0.1)'
                      : 'var(--bg-card)',
                    border: `1px solid ${
                      isUsed
                        ? 'transparent'
                        : isPeeked
                        ? 'var(--accent-cyan)'
                        : 'var(--border-color)'
                    }`,
                    color: isUsed ? 'transparent' : 'var(--text-primary)',
                    padding: '10px 16px',
                    borderRadius: 12,
                    fontSize: 20,
                    fontWeight: 600,
                    cursor: isUsed ? 'default' : 'pointer',
                    opacity: isUsed ? 0.2 : 1,
                    boxShadow: isUsed ? 'none' : '0 2px 8px rgba(0,0,0,0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.text}
                </button>

                {/* Floating Tooltip displaying ONLY the hovered chunk's Pinyin directly ABOVE the button */}
                {isPeeked && !isUsed && chunkPy && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%) translateY(-6px)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--accent-cyan)',
                      color: 'var(--accent-cyan)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  >
                    {chunkPy}
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
