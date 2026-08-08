import { db } from '../db/schema';
import type { CharacterEntity, SentenceEntity, UserProgressEntity } from '../db/schema';
import { getDeckCharacters } from '../db/queries';
import { isMasteryDecayed } from './srs';
import { generateClozeDistractors } from './distractors';

import { useSettingsStore } from '../stores/settingsStore';

export type ExerciseType = 'magnet' | 'cloze';

export interface ExerciseItem {
  character: CharacterEntity;
  progress: UserProgressEntity;
  sentence: SentenceEntity;
  type: ExerciseType;
  distractors: CharacterEntity[];
}

export interface QueueGenerationOptions {
  sessionSize?: number;
  guaranteedCharacterId?: string;
  preferredType?: ExerciseType;
}

/**
 * Builds a dual-priority practice queue:
 * Priority 1: Due SRS reviews (decayed mastery)
 * Priority 2: Deck progression (unseen characters in frequency order)
 */
export async function generatePracticeQueue(
  deckId: string,
  options: QueueGenerationOptions = {}
): Promise<ExerciseItem[]> {
  const sessionSize = options.sessionSize || 10;

  // Fetch characters with progress for the deck
  const allChars = await getDeckCharacters(deckId);
  const charEntities = allChars.map((item) => {
    const { progress, sentences, ...char } = item;
    return char as CharacterEntity;
  });

  const now = Date.now();
  const { repetitionFrequency } = useSettingsStore.getState();
  let multiplier = 3.0; // Default Low repetition: 3x longer review intervals!
  if (repetitionFrequency === 'balanced') multiplier = 1.0;
  if (repetitionFrequency === 'high') multiplier = 0.5;

  // Partition characters into due SRS reviews vs unseen progression
  const dueReviews: typeof allChars = [];
  const unseenProgression: typeof allChars = [];

  for (const item of allChars) {
    if (item.progress.mastery === 'grey') {
      unseenProgression.push(item);
    } else {
      const isDecayed = isMasteryDecayed(
        item.progress.mastery,
        item.progress.lastReviewedAt,
        now,
        multiplier
      );

      if (isDecayed) {
        dueReviews.push(item);
      }
    }
  }

  // Handle guaranteed character (e.g. from "Practice Now")
  let guaranteedItem: typeof allChars[0] | undefined;
  if (options.guaranteedCharacterId) {
    const foundIdx = allChars.findIndex((c) => c.id === options.guaranteedCharacterId);
    if (foundIdx !== -1) {
      guaranteedItem = allChars[foundIdx];
    }
  }

  // Assemble candidate list
  const selectedChars: typeof allChars = [];

  if (guaranteedItem) {
    selectedChars.push(guaranteedItem);
  }

  // Add due SRS reviews (shuffled)
  const shuffledDue = [...dueReviews]
    .filter((c) => c.id !== guaranteedItem?.id)
    .sort(() => Math.random() - 0.5);

  for (const c of shuffledDue) {
    if (selectedChars.length >= sessionSize) break;
    selectedChars.push(c);
  }

  // Fill remaining slots with unseen progression characters (in frequency rank order)
  const sortedUnseen = [...unseenProgression]
    .filter((c) => c.id !== guaranteedItem?.id)
    .sort((a, b) => a.frequency - b.frequency);

  for (const c of sortedUnseen) {
    if (selectedChars.length >= sessionSize) break;
    selectedChars.push(c);
  }

  // If queue is still under sessionSize, add any other characters
  if (selectedChars.length < sessionSize) {
    const remaining = allChars.filter(
      (c) => !selectedChars.some((s) => s.id === c.id)
    );
    for (const c of remaining) {
      if (selectedChars.length >= sessionSize) break;
      selectedChars.push(c);
    }
  }

  // Build ExerciseItem objects
  const queue: ExerciseItem[] = [];

  for (const item of selectedChars) {
    // Fetch sentences for character from DB
    const sents = await db.sentences.where({ characterId: item.id }).toArray();
    const sentence = sents.length > 0
      ? sents[Math.floor(Math.random() * sents.length)]
      : {
          id: `fallback-${item.id}`,
          characterId: item.id,
          deckId: item.deckId,
          chinese: `这是${item.id}。`,
          pinyin: `zhè shì ${item.pinyin[0]}。`,
          english: `This is '${item.definitions[0]}'.`,
          chunks: ['这是', item.id, '。'],
        };

    // Determine exercise type
    const type: ExerciseType =
      options.preferredType || (Math.random() > 0.5 ? 'magnet' : 'cloze');

    // Generate Cloze distractors if cloze
    const { progress, ...charEntity } = item;
    const distractors = type === 'cloze'
      ? generateClozeDistractors(charEntity as CharacterEntity, charEntities)
      : [];

    queue.push({
      character: charEntity as CharacterEntity,
      progress,
      sentence,
      type,
      distractors,
    });
  }

  return queue;
}
