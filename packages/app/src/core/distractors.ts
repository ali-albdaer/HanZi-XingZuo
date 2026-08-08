import type { CharacterEntity } from '../db/schema';

/**
 * Selects distractor characters for Contextual Cloze exercise.
 * Distractors are chosen from the same HSK level / frequency tier to ensure a meaningful challenge.
 */
export function generateClozeDistractors(
  targetCharacter: CharacterEntity,
  allCharacters: CharacterEntity[],
  count = 3
): CharacterEntity[] {
  // Candidate pool: characters excluding the target character
  const candidates = allCharacters.filter((c) => c.id !== targetCharacter.id);

  if (candidates.length <= count) {
    return candidates;
  }

  // 1. Same HSK level pool
  const sameHsk = candidates.filter((c) => c.hskLevel === targetCharacter.hskLevel);

  // 2. Similar frequency tier pool (within +- 150 rank)
  const targetRank = targetCharacter.frequency;
  const similarRank = candidates.filter(
    (c) => Math.abs(c.frequency - targetRank) <= 150
  );

  // Combine preferred candidates, fallback to all candidates
  const preferredPool = Array.from(new Set([...sameHsk, ...similarRank]));
  const pool = preferredPool.length >= count ? preferredPool : candidates;

  // Shuffle pool and take `count` items
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
