import Dexie, { type Table } from 'dexie';
import type { MasteryLevel } from '../config/app.config';

export interface DeckEntity {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  createdAt: number;
}

export interface CharacterEntity {
  id: string;              // Simplified character itself, e.g. "你"
  deckId: string;          // FK -> DeckEntity.id
  pinyin: string[];        // ["nǐ"]
  definitions: string[];   // ["you"]
  frequency: number;       // Rank 1-1000
  components: string[];    // Radicals / components
  radical: string;
}

export interface SentenceEntity {
  id: string;
  characterId: string;     // FK -> CharacterEntity.id
  deckId: string;          // FK -> DeckEntity.id
  chinese: string;
  english: string;
  chunks: string[];        // Pre-segmented chunks
}

export interface UserProgressEntity {
  characterId: string;     // Primary Key: characterId
  deckId: string;
  mastery: MasteryLevel;
  lastReviewedAt: number | null;
  correctStreak: number;
  totalReviews: number;
  keyboardCleared: boolean;
}

export class HanZiDatabase extends Dexie {
  decks!: Table<DeckEntity, string>;
  characters!: Table<CharacterEntity, string>;
  sentences!: Table<SentenceEntity, string>;
  userProgress!: Table<UserProgressEntity, string>;

  constructor() {
    super('HanZiXingZuoDB');
    this.version(1).stores({
      decks: 'id, name, isBuiltIn',
      characters: 'id, deckId, frequency, radical',
      sentences: 'id, characterId, deckId',
      userProgress: 'characterId, deckId, mastery, lastReviewedAt',
    });
  }
}

export const db = new HanZiDatabase();
