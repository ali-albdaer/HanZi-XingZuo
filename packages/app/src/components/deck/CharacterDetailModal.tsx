import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { useDeckStore } from '../../stores/deckStore';
import { MasteryBadge } from '../shared/MasteryBadge';
import { HskBadge } from '../shared/HskBadge';
import { CopyButton } from '../shared/CopyButton';
import { Play, Hash, GitFork, ChevronLeft, ChevronRight, CheckCircle2, Check, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDeckCharacters, sortCharacters } from '../../db/queries';
import { searchAndRankCharacters } from '../../core/search';
import { generatePracticeQueue } from '../../core/queue';
import { usePracticeStore } from '../../stores/practiceStore';
import { useSettingsStore } from '../../stores/settingsStore';

export const CharacterDetailModal: React.FC = () => {
  const navigate = useNavigate();
  const selectedCharacter = useDeckStore((s) => s.selectedCharacter);
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);
  const sortOption = useDeckStore((s) => s.sortOption);
  const randomSeed = useDeckStore((s) => s.randomSeed);
  const searchQuery = useDeckStore((s) => s.searchQuery);
  const showKnownCharacters = useSettingsStore((s) => s.listFilterOptions.showKnownCharacters);
  const cardDisplayOptions = useSettingsStore((s) => s.cardDisplayOptions);

  const [expandedSentenceId, setExpandedSentenceId] = useState<string | null>(null);
  const [knownToast, setKnownToast] = useState(false);

  // Gesture state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [cardTransition, setCardTransition] = useState<string>('none');
  const [cardOpacity, setCardOpacity] = useState<number>(1);
  const [cardScale, setCardScale] = useState<number>(1);

  // Refs for tracking drag coordinates without re-renders during active drag
  const startPosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const currentOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const hasMovedPastThresholdRef = useRef(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setExpandedSentenceId(null);
  }, [selectedCharacter]);

  const rawCharacters = useLiveQuery(
    () => (selectedCharacter ? getDeckCharacters(selectedCharacter.deckId) : Promise.resolve([])),
    [selectedCharacter?.deckId]
  );

  // Track characters that become known during this modal session
  const newlyKnownIds = useRef<Set<string>>(new Set());

  const characters = useMemo(() => {
    if (!rawCharacters) return [];

    // Filter known characters if setting is disabled
    // But preserve characters that became known while the modal was open
    const filtered = rawCharacters.filter(
      (c) => showKnownCharacters || !c.progress.isKnown || newlyKnownIds.current.has(c.id)
    );

    return searchQuery.trim()
      ? searchAndRankCharacters(filtered, searchQuery)
      : sortCharacters(filtered, sortOption, randomSeed);
  }, [rawCharacters, searchQuery, sortOption, randomSeed, showKnownCharacters]);

  const currentIndex = selectedCharacter ? characters.findIndex((c) => c.id === selectedCharacter.id) : -1;

  const handleToggleKnown = useCallback(async () => {
    if (!selectedCharacter) return;
    const current = selectedCharacter.progress.isKnown || false;
    const newKnown = !current;

    if (newKnown) {
      newlyKnownIds.current.add(selectedCharacter.id);
    } else {
      newlyKnownIds.current.delete(selectedCharacter.id);
    }

    await db.userProgress.update(selectedCharacter.id, { isKnown: newKnown });
    // Update local state to reflect change immediately without closing modal
    setSelectedCharacter({
      ...selectedCharacter,
      progress: { ...selectedCharacter.progress, isKnown: newKnown },
    });
  }, [selectedCharacter, setSelectedCharacter]);

  // Specific Mark as Known action for swipe-up
  const handleMarkKnownAndAdvance = useCallback(async () => {
    if (!selectedCharacter) return;

    newlyKnownIds.current.add(selectedCharacter.id);
    await db.userProgress.update(selectedCharacter.id, { isKnown: true });

    // Show celebratory toast
    setKnownToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setKnownToast(false), 1600);

    // Animate card flying up
    setCardTransition('transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.2s ease');
    setDragOffset({ x: currentOffsetRef.current.x * 0.4, y: -window.innerHeight * 0.7 });
    setCardOpacity(0);
    setCardScale(0.85);

    setTimeout(() => {
      if (currentIndex >= 0 && currentIndex < characters.length - 1) {
        setSelectedCharacter(characters[currentIndex + 1]);
      } else {
        // Update current character in-place if at end of list
        setSelectedCharacter({
          ...selectedCharacter,
          progress: { ...selectedCharacter.progress, isKnown: true },
        });
      }

      // Enter from center/bottom smoothly
      setCardTransition('none');
      setDragOffset({ x: 0, y: 40 });
      setCardScale(0.95);
      setCardOpacity(0);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCardTransition('transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease');
          setDragOffset({ x: 0, y: 0 });
          setCardScale(1);
          setCardOpacity(1);
        });
      });
    }, 220);
  }, [selectedCharacter, currentIndex, characters, setSelectedCharacter]);

  // Card slide left -> Next character transition
  const handleSlideNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < characters.length - 1) {
      setCardTransition('transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.2s ease');
      setDragOffset({ x: -window.innerWidth * 0.8, y: currentOffsetRef.current.y * 0.3 });
      setCardOpacity(0);

      setTimeout(() => {
        setSelectedCharacter(characters[currentIndex + 1]);
        setCardTransition('none');
        setDragOffset({ x: 60, y: 0 });
        setCardOpacity(0);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setCardTransition('transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease');
            setDragOffset({ x: 0, y: 0 });
            setCardOpacity(1);
          });
        });
      }, 200);
    } else {
      // Elastic bounce back
      setCardTransition('transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)');
      setDragOffset({ x: 0, y: 0 });
    }
  }, [currentIndex, characters, setSelectedCharacter]);

  // Card slide right -> Previous character transition
  const handleSlidePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCardTransition('transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.2s ease');
      setDragOffset({ x: window.innerWidth * 0.8, y: currentOffsetRef.current.y * 0.3 });
      setCardOpacity(0);

      setTimeout(() => {
        setSelectedCharacter(characters[currentIndex - 1]);
        setCardTransition('none');
        setDragOffset({ x: -60, y: 0 });
        setCardOpacity(0);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setCardTransition('transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease');
            setDragOffset({ x: 0, y: 0 });
            setCardOpacity(1);
          });
        });
      }, 200);
    } else {
      // Elastic bounce back
      setCardTransition('transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)');
      setDragOffset({ x: 0, y: 0 });
    }
  }, [currentIndex, characters, setSelectedCharacter]);

  // Reset drag position with spring
  const springBack = useCallback(() => {
    setCardTransition('transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease');
    setDragOffset({ x: 0, y: 0 });
    setCardScale(1);
    setCardOpacity(1);
  }, []);

  // Pointer event handlers for touch and mouse sliding
  const handlePointerDown = (e: React.PointerEvent) => {
    // Avoid initiating drag on interactive buttons or text inputs
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('.btn-copy')) {
      return;
    }

    startPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    currentOffsetRef.current = { x: 0, y: 0 };
    isPointerDownRef.current = true;
    hasMovedPastThresholdRef.current = false;
    setCardTransition('none');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;

    if (!hasMovedPastThresholdRef.current) {
      const dist = Math.hypot(dx, dy);
      if (dist > 7) {
        hasMovedPastThresholdRef.current = true;
        setIsDragging(true);
        try {
          cardRef.current?.setPointerCapture(e.pointerId);
        } catch {
          // pointer capture might fail if already released
        }
      }
    }

    if (hasMovedPastThresholdRef.current) {
      let finalX = dx;
      let finalY = dy;

      // Swipe up intent
      if (dy < 0 && Math.abs(dy) > Math.abs(dx) * 0.6) {
        finalX = dx * 0.25; // dampen horizontal when swiping up
      } else {
        // Horizontal intent: check bounds
        if ((currentIndex === 0 && dx > 0) || (currentIndex === characters.length - 1 && dx < 0)) {
          finalX = dx * 0.25; // rubber band resistance at deck edge
        }
        finalY = dy * 0.25;
      }

      currentOffsetRef.current = { x: finalX, y: finalY };
      setDragOffset({ x: finalX, y: finalY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (hasMovedPastThresholdRef.current) {
      try {
        cardRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      const dt = Math.max(1, Date.now() - startPosRef.current.time);
      const vx = dx / dt;
      const vy = dy / dt;

      setIsDragging(false);

      // 1. Swipe UP -> Mark character as known
      if (dy < -65 || (vy < -0.38 && dy < -25)) {
        handleMarkKnownAndAdvance();
      }
      // 2. Swipe LEFT -> Next character
      else if (dx < -65 || (vx < -0.38 && dx < -25)) {
        handleSlideNext();
      }
      // 3. Swipe RIGHT -> Previous character
      else if (dx > 65 || (vx > 0.38 && dx > 25)) {
        handleSlidePrev();
      }
      // 4. Cancelled / Below threshold
      else {
        springBack();
      }
    } else {
      setIsDragging(false);
      springBack();
    }
  };

  const handlePracticeNow = async () => {
    if (!selectedCharacter) return;
    const charId = selectedCharacter.id;
    const deckId = selectedCharacter.deckId;
    setSelectedCharacter(null);
    const queue = await generatePracticeQueue(deckId, {
      guaranteedCharacterId: charId,
      singleCharacterMode: true,
    });
    usePracticeStore.getState().startSession(queue, false, `/decks/${deckId}`);
    navigate('/practice');
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleSlideNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleSlidePrev();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        handleMarkKnownAndAdvance();
      } else if (e.key === 'k' || e.key === 'K') {
        handleToggleKnown();
      } else if (e.key === 'Escape') {
        setSelectedCharacter(null);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
      }
    };

    if (selectedCharacter) {
      window.addEventListener('keydown', handleKeyDown);
      const knownIds = newlyKnownIds.current;
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (!useDeckStore.getState().selectedCharacter) {
          knownIds.clear();
        }
      };
    } else {
      newlyKnownIds.current.clear();
    }
  }, [handleSlideNext, handleSlidePrev, handleMarkKnownAndAdvance, handleToggleKnown, selectedCharacter, setSelectedCharacter]);

  if (!selectedCharacter) return null;

  const copyText = `${selectedCharacter.id} [${selectedCharacter.pinyin.join(', ')}]\nDefinitions: ${selectedCharacter.definitions.join('; ')}\nSentences:\n` +
    selectedCharacter.sentences.map((s) => `• ${s.chinese} (${s.english})`).join('\n');

  // Swipe up progress (0 to 1)
  const swipeUpProgress = Math.min(1, Math.max(0, -dragOffset.y / 70));
  const isSwipingUp = dragOffset.y < -15;

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
        padding: '12px 14px',
        touchAction: 'none',
      }}
      onClick={() => setSelectedCharacter(null)}
    >
      {/* Celebratory Known Toast Notification */}
      {knownToast && (
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 350,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            padding: '10px 22px',
            borderRadius: 30,
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'toastPopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            pointerEvents: 'none',
          }}
        >
          <style>{`
            @keyframes toastPopIn {
              from { opacity: 0; transform: translate(-50%, -16px) scale(0.9); }
              to { opacity: 1; transform: translate(-50%, 0) scale(1); }
            }
          `}</style>
          <Check size={18} strokeWidth={3} />
          <span>Marked as Known!</span>
        </div>
      )}

      {/* Navigation Buttons (Desktop only - floating on sides) */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSlidePrev();
          }}
          className="btn btn-icon desktop-nav-btn"
          style={{
            position: 'absolute',
            left: 'calc(50% - 330px)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 46,
            height: 46,
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            backgroundColor: 'var(--bg-card)',
            zIndex: 210,
          }}
          title="Previous [Left Arrow] or [A]"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {currentIndex >= 0 && currentIndex < characters.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSlideNext();
          }}
          className="btn btn-icon desktop-nav-btn"
          style={{
            position: 'absolute',
            right: 'calc(50% - 330px)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 46,
            height: 46,
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            backgroundColor: 'var(--bg-card)',
            zIndex: 210,
          }}
          title="Next [Right Arrow] or [D]"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Main Slidable Card */}
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90dvh',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 22,
          border: isSwipingUp
            ? `1px solid rgba(24, 231, 236, ${0.3 + swipeUpProgress * 0.7})`
            : '1px solid var(--border-color)',
          padding: '20px 22px 14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 6,
          boxShadow: isSwipingUp
            ? `0 20px 50px rgba(0, 0, 0, 0.7), 0 0 ${20 * swipeUpProgress}px rgba(24, 231, 236, ${0.4 * swipeUpProgress})`
            : '0 20px 50px rgba(0, 0, 0, 0.7)',
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.04}deg) scale(${cardScale})`,
          transition: cardTransition,
          opacity: cardOpacity,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visual Cue: Swipe Up to Mark Known indicator */}
        {isSwipingUp && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              background: swipeUpProgress >= 0.9 ? 'var(--accent-cyan)' : 'rgba(24, 231, 236, 0.15)',
              color: swipeUpProgress >= 0.9 ? '#000' : 'var(--accent-cyan)',
              border: '1px solid var(--accent-cyan)',
              padding: '5px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 16px rgba(24, 231, 236, 0.25)',
              transition: 'background 0.12s, color 0.12s',
              pointerEvents: 'none',
            }}
          >
            {swipeUpProgress >= 0.9 ? <Check size={14} strokeWidth={3} /> : <ArrowUp size={14} />}
            <span>{swipeUpProgress >= 0.9 ? 'Release to Mark Known!' : 'Swipe Up to Mark Known'}</span>
          </div>
        )}

        {/* Header bar: Mastery & Deck position counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 }}>
          {cardDisplayOptions.showMastery ? (
            <MasteryBadge level={selectedCharacter.progress.mastery} />
          ) : (
            <div />
          )}

          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
            {currentIndex + 1} / {characters.length}
          </div>
        </div>

        {/* Character Main Header */}
        <div style={{ textAlign: 'center', margin: '2px 0' }}>
          <div
            style={{
              fontSize: 'clamp(68px, 14vw, 84px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {selectedCharacter.id}
          </div>
          {cardDisplayOptions.showPinyin && (
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--accent-cyan)',
                marginTop: 4,
              }}
            >
              {selectedCharacter.pinyin.join(', ')}
            </div>
          )}
          {cardDisplayOptions.showMeaning && (
            <div
              className="custom-scrollbar"
              style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                marginTop: 6,
                lineHeight: 1.3,
                maxHeight: 60,
                overflowY: 'auto',
                padding: '0 4px',
              }}
            >
              {selectedCharacter.definitions.join('; ')}
            </div>
          )}
        </div>

        {/* Meta info tags */}
        {(cardDisplayOptions.showHsk ||
          cardDisplayOptions.showRank ||
          (cardDisplayOptions.showRadical && selectedCharacter.radical)) && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {cardDisplayOptions.showHsk && <HskBadge level={selectedCharacter.hskLevel || '1'} />}

            {cardDisplayOptions.showRank && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '3px 9px',
                  borderRadius: 6,
                }}
              >
                <Hash size={13} />
                <span>Rank #{selectedCharacter.frequency}</span>
              </div>
            )}

            {cardDisplayOptions.showRadical && selectedCharacter.radical && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '3px 9px',
                  borderRadius: 6,
                }}
              >
                <GitFork size={13} />
                <span>Radical: {selectedCharacter.radical}</span>
              </div>
            )}
          </div>
        )}

        {/* Example Sentences */}
        {cardDisplayOptions.showSentences && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              flex: 1,
              justifyContent: 'center',
              margin: '4px 0',
            }}
          >
            {selectedCharacter.sentences.slice(0, 2).map((sentence, idx) => (
              <div
                key={sentence.id || idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedSentenceId(sentence.id || String(idx));
                }}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  padding: '9px 12px',
                  minWidth: 0,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, transform 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card)')}
              >
                <div
                  style={{
                    fontSize: 'clamp(20px, 5vw, 24px)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {sentence.chinese}
                </div>
                {sentence.pinyin && (
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--accent-cyan)',
                      marginTop: 3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {sentence.pinyin}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    marginTop: 3,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {sentence.english}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {cardDisplayOptions.showActions && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={handleToggleKnown}
              className={`btn btn-secondary ${selectedCharacter.progress.isKnown ? 'active' : ''}`}
              style={{ flex: 1, padding: '10px 10px', fontSize: 13 }}
              title="Toggle Known [K]"
            >
              <CheckCircle2 size={15} />
              <span>{selectedCharacter.progress.isKnown ? 'Known [K]' : 'Mark Known [K]'}</span>
            </button>

            <CopyButton textToCopy={copyText} label="Copy" className="flex-1" />

            <button
              onClick={handlePracticeNow}
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px 10px', fontSize: 13 }}
            >
              <Play size={15} fill="#000" />
              <span>Practice</span>
            </button>
          </div>
        )}

        {/* Mobile Gestures & Shortcuts Hint */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
        </div>
      </div>

      {/* Pop-up for expanded sentence */}
      {expandedSentenceId && (() => {
        const sentence = selectedCharacter.sentences.find((s, i) => (s.id || String(i)) === expandedSentenceId);
        if (!sentence) return null;

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              animation: 'sentenceFadeIn 0.2s ease-out forwards',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setExpandedSentenceId(null);
            }}
          >
            <style>{`
              @keyframes sentenceFadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes sentenceScaleUp { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
            `}</style>
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: 22,
                padding: '32px 28px',
                maxWidth: 800,
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
                animation: 'sentenceScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {sentence.chinese}
              </div>
              {sentence.pinyin && (
                <div style={{ fontSize: 'clamp(16px, 3.5vw, 24px)', fontWeight: 600, color: 'var(--accent-cyan)', marginTop: 14 }}>
                  {sentence.pinyin}
                </div>
              )}
              <div style={{ fontSize: 'clamp(15px, 3vw, 20px)', color: 'var(--text-secondary)', marginTop: 14, lineHeight: 1.4 }}>
                {sentence.english}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
