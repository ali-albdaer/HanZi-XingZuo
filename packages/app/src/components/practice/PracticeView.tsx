import React from 'react';
import { usePracticeStore } from '../../stores/practiceStore';
import { SentenceMagnet } from './SentenceMagnet';
import { ClozeExercise } from './ClozeExercise';
import { MasteryBadge } from '../shared/MasteryBadge';
import { X, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PracticeView: React.FC = () => {
  const navigate = useNavigate();
  const {
    queue,
    currentIndex,
    userAnswers,
    recordAnswer,
    nextExercise,
    resetSession,
    isCompleted,
    returnToPath,
  } = usePracticeStore();

  const currentItem = queue[currentIndex];

  const handleExerciseComplete = (isCorrect: boolean) => {
    recordAnswer(currentIndex, isCorrect);
    nextExercise();
  };

  const handleClose = () => {
    resetSession();
    navigate(returnToPath);
  };

  // Live Session Stats
  const practicedCount = userAnswers.size;
  const correctCount = Array.from(userAnswers.values()).filter(Boolean).length;
  const wrongCount = practicedCount - correctCount;

  if (!currentItem) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        No exercises available.
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: 'var(--bg-main)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 16 }}>
          Session Complete!
        </div>
        <button
          onClick={handleClose}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            background: 'var(--accent-cyan)',
            color: '#000',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Return to Deck
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-main)',
        padding: '12px 18px calc(var(--tab-bar-height) + 24px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Practice Header Bar: Close Button, Live Stats (Practiced, Right, Wrong), Mastery Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
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

        {/* Live Practiced / Right / Wrong Counters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 20,
            padding: '6px 14px',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Practiced: {practicedCount}
          </span>

          <div style={{ height: 12, width: 1, background: 'var(--border-color)' }} />

          {/* Correct Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4CAF50', fontSize: 13, fontWeight: 700 }}>
            <Check size={14} />
            <span>{correctCount}</span>
          </div>

          {/* Wrong Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F44336', fontSize: 13, fontWeight: 700 }}>
            <AlertCircle size={14} />
            <span>{wrongCount}</span>
          </div>
        </div>

        {/* Stage Badge for Current Character */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MasteryBadge level={currentItem.progress.mastery} showLabel={false} />
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
