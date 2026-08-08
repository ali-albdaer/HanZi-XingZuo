import React from 'react';
import { usePracticeStore } from '../../stores/practiceStore';
import { SentenceMagnet } from './SentenceMagnet';
import { ClozeExercise } from './ClozeExercise';
import { MasteryBadge } from '../shared/MasteryBadge';
import { X, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PracticeView: React.FC = () => {
  const navigate = useNavigate();
  const {
    queue,
    currentIndex,
    userAnswers,
    isCompleted,
    recordAnswer,
    nextExercise,
    resetSession,
  } = usePracticeStore();

  const currentItem = queue[currentIndex];

  const handleExerciseComplete = (isCorrect: boolean) => {
    recordAnswer(currentIndex, isCorrect);
    nextExercise();
  };

  const handleClose = () => {
    resetSession();
    navigate('/decks');
  };

  // Completion Summary Screen
  if (isCompleted || queue.length === 0) {
    const total = queue.length;
    const correctCount = Array.from(userAnswers.values()).filter(Boolean).length;
    const accuracyPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 24,
          textAlign: 'center',
          backgroundColor: 'var(--bg-main)',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(0, 229, 255, 0.15)',
            border: '1px solid var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <Sparkles size={36} color="var(--accent-cyan)" />
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          Session Complete!
        </h2>

        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, marginBottom: 24 }}>
          Great job practicing your characters and contextual reading.
        </p>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            width: '100%',
            maxWidth: 320,
            marginBottom: 32,
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
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {correctCount} / {total}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Correct Answers
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
            <div style={{ fontSize: 28, fontWeight: 700, color: accuracyPct >= 80 ? '#4CAF50' : '#FFC107' }}>
              {accuracyPct}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Accuracy
            </div>
          </div>
        </div>

        {/* Reviewed Characters List */}
        <div style={{ width: '100%', maxWidth: 360, marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Characters Reviewed
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {queue.map((item, idx) => {
              const wasCorrect = userAnswers.get(idx) ?? false;
              return (
                <div
                  key={`${item.character.id}-${idx}`}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${wasCorrect ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)'}`,
                    borderRadius: 10,
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{item.character.id}</span>
                  <span style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>{item.character.pinyin[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
          <button
            onClick={resetSession}
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
            }}
          >
            <RefreshCw size={18} />
            <span>Start Next Session</span>
          </button>

          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: 16,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <Layers size={18} />
            <span>Return to Decks</span>
          </button>
        </div>
      </div>
    );
  }

  const progressPct = Math.round(((currentIndex + 1) / queue.length) * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-main)',
        padding: '12px 18px calc(var(--tab-bar-height) + 12px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
        <button
          onClick={handleClose}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Progress Bar */}
        <div style={{ flex: 1, height: 8, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'var(--accent-cyan)',
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Stage & Progress Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MasteryBadge level={currentItem.progress.mastery} showLabel={false} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {currentIndex + 1}/{queue.length}
          </span>
        </div>
      </div>

      {/* Exercise Container */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {currentItem.type === 'magnet' ? (
          <SentenceMagnet key={`magnet-${currentIndex}`} exercise={currentItem} onComplete={handleExerciseComplete} />
        ) : (
          <ClozeExercise key={`cloze-${currentIndex}`} exercise={currentItem} onComplete={handleExerciseComplete} />
        )}
      </div>
    </div>
  );
};
