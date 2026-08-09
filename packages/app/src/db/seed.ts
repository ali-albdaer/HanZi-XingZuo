import { db, type DeckEntity, type CharacterEntity, type SentenceEntity, type UserProgressEntity } from './schema';

export async function ensureDatabaseSeeded(): Promise<void> {
  const existingDecks = await db.decks.count();

  if (existingDecks > 0) {
    return;
  }

  console.log('[SEED] Initializing/Updating database from seed-data.json...');
  try {
    await db.transaction('rw', [db.decks, db.characters, db.sentences, db.userProgress], async () => {
      await db.decks.clear();
      await db.characters.clear();
      await db.sentences.clear();
    });
    const seedUrls = [
      `${import.meta.env.BASE_URL}seed-data.json`,
      './seed-data.json',
      'seed-data.json',
      '/seed-data.json',
    ];

    let response: Response | null = null;
    for (const url of seedUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          response = res;
          break;
        }
      } catch (err) {
        // try next
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Failed to fetch seed data from any path`);
    }

    const data = await response.json();
    const builtInDeck: DeckEntity = data.deck;
    const characters: CharacterEntity[] = data.characters;
    const sentences: SentenceEntity[] = data.sentences;

    const vaultDeck: DeckEntity = {
      id: 'my-vault',
      name: 'My Vault',
      description: 'Custom characters and sentences mined from your reading',
      isBuiltIn: false,
      createdAt: Date.now(),
    };

    const initialProgress: UserProgressEntity[] = characters.map((c) => ({
      characterId: c.id,
      deckId: c.deckId,
      mastery: 'grey',
      lastReviewedAt: null,
      correctStreak: 0,
      totalReviews: 0,
      keyboardCleared: false,
    }));

    await db.transaction('rw', [db.decks, db.characters, db.sentences, db.userProgress], async () => {
      await db.decks.bulkPut([builtInDeck, vaultDeck]);
      await db.characters.bulkPut(characters);
      await db.sentences.bulkPut(sentences);
      await db.userProgress.bulkPut(initialProgress);
    });

    console.log('[SEED] Database successfully populated!');
  } catch (error) {
    console.error('[SEED] Failed to seed database:', error);
  }
}
