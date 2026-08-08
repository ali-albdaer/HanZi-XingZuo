import React, { useState, useEffect, useRef } from 'react';
import type { ExerciseItem } from '../../core/queue';
import type { CharacterEntity } from '../../db/schema';
import { saveExerciseResult } from '../../core/srs';
import { usePracticeStore } from '../../stores/practiceStore';
import { Check, X, Keyboard, Grid, ArrowRight } from 'lucide-react';

interface ClozeExerciseProps {
  exercise: ExerciseItem;
  onComplete: (isCorrect: boolean) => void;
}

export const ClozeExercise: React.FC<ClozeExerciseProps> = ({ exercise, onComplete }) => {
  const { sentence, character: targetChar, distractors } = exercise;
  const { preferredClozeMode, setClozeMode } = usePracticeStore();

  const inputRef = useRef<HTMLInputElement>(null);

  // Replace target character with ___ in sentence
  const clozeSentence = sentence.chinese.replaceAll(targetChar.id, ' ___ ');

  // Options for selection mode (target + 3 distractors shuffled)
  const [options, setOptions] = useState<CharacterEntity[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [keyboardInput, setKeyboardInput] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    // Combine target and distractors and shuffle
    const combined = [targetChar, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(combined);
    setSelectedOptionId(null);
    setKeyboardInput('');
    setSubmitted(false);
    setIsCorrect(false);

    if (preferredClozeMode === 'keyboard') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [exercise, preferredClozeMode]);

  const handleSelectOption = async (option: CharacterEntity) => {
    if (submitted) return;

    setSelectedOptionId(option.id);
    const correct = option.id === targetChar.id;
    setIsCorrect(correct);
    setSubmitted(true);

    await saveExerciseResult(targetChar.id, targetChar.deckId, correct, false);
  };

  const handleKeyboardSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitted || !keyboardInput.trim()) return;

    const userInput = keyboardInput.trim();
    const correct = userInput === targetChar.id;
    setIsCorrect(correct);
    setSubmitted(true);

    await saveExerciseResult(targetChar.id, targetChar.deckId, correct, true);
  };

  const handleNext = () => {
    onComplete(isCorrect);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        padding: '16px 0',
      }}
    >
      {/* Header: Mode Switcher */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: 'var(--accent-cyan)',
            }}
          >
            Contextual Cloze
          </div>

          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 10,
              padding: 2,
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setClozeMode('selection')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 8,
                border: 'none',
                background: preferredClozeMode === 'selection' ? 'var(--accent-cyan)' : 'transparent',
                color: preferredClozeMode === 'selection' ? '#000' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Grid size={13} />
              <span>Choice</span>
            </button>

            <button
              onClick={() => setClozeMode('keyboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 8,
                border: 'none',
                background: preferredClozeMode === 'keyboard' ? 'var(--accent-cyan)' : 'transparent',
                color: preferredClozeMode === 'keyboard' ? '#000' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Keyboard size={13} />
              <span>Keyboard</span>
            </button>
          </div>
        </div>

        {/* Cloze Sentence Box */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: 20,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {clozeSentence}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
            {sentence.english}
          </div>
        </div>
      </div>

      {/* Result Pinyin Reveal after submission */}
      {submitted && (
        <div
          style={{
            background: isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            border: `1px solid ${isCorrect ? '#4CAF50' : '#F44336'}`,
            borderRadius: 12,
            padding: '12px 16px',
            margin: '8px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {isCorrect ? <Check size={18} color="#4CAF50" /> : <X size={18} color="#F44336" />}
            <span style={{ fontWeight: 700, color: isCorrect ? '#4CAF50' : '#F44336' }}>
              {isCorrect ? 'Correct!' : `Correct Character: ${targetChar.id}`}
            </span>
          </div>

          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
            {sentence.chinese}
          </div>
          <div style={{ fontSize: 14, color: 'var(--accent-cyan)', marginTop: 2 }}>
            {sentence.pinyin}
          </div>
        </div>
      )}

      {/* Mode Controls */}
      <div>
        {preferredClozeMode === 'selection' ? (
          /* Selection Mode Grid (4 Buttons) */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const isTarget = opt.id === targetChar.id;

              let btnBg = 'var(--bg-card)';
              let btnBorder = 'var(--border-color)';
              let btnColor = 'var(--text-primary)';

              if (submitted) {
                if (isTarget) {
                  btnBg = 'rgba(76, 175, 80, 0.2)';
                  btnBorder = '#4CAF50';
                  btnColor = '#4CAF50';
                } else if (isSelected && !isTarget) {
                  btnBg = 'rgba(244, 67, 54, 0.2)';
                  btnBorder = '#F44336';
                  btnColor = '#F44336';
                }
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt)}
                  disabled={submitted}
                  style={{
                    background: btnBg,
                    border: `1px solid ${btnBorder}`,
                    color: btnColor,
                    borderRadius: 16,
                    padding: '16px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: submitted ? 'default' : 'pointer',
                    transition: 'transform 0.15s ease, background 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: 32, fontWeight: 600 }}>{opt.id}</span>
                  <span style={{ fontSize: 13, color: 'var(--accent-cyan)', marginTop: 2 }}>
                    {opt.pinyin[0]}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Keyboard Mode Form Input */
          <form onSubmit={handleKeyboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={keyboardInput}
                onChange={(e) => setKeyboardInput(e.target.value)}
                disabled={submitted}
                placeholder="Type Chinese character..."
                maxLength={4}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: 16,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: 24,
                  fontWeight: 600,
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {!submitted && (
              <button
                type="submit"
                disabled={!keyboardInput.trim()}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 14,
                  border: 'none',
                  background: !keyboardInput.trim() ? 'rgba(255, 255, 255, 0.08)' : 'var(--accent-cyan)',
                  color: !keyboardInput.trim() ? 'var(--text-muted)' : '#000',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: !keyboardInput.trim() ? 'default' : 'pointer',
                }}
              >
                Submit Character
              </button>
            )}
          </form>
        )}

        {/* Continue Button after Submission */}
        {submitted && (
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              background: 'var(--accent-cyan)',
              color: '#000',
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              marginTop: 12,
            }}
          >
            <span>Continue</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
