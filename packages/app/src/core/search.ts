import type { CharacterWithProgress } from '../db/queries';

/**
 * Strips tone diacritics from a Pinyin string.
 * e.g. "wǒ" -> "wo", "shàng" -> "shang"
 */
export function stripTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Scores and ranks search results strictly by:
 * 1. Character ID exact match / Pinyin exact or prefix match (highest tier)
 * 2. Meaning / Definition match (second tier)
 * 3. Sentence context match (third tier)
 * Breaks ties using character frequency rank.
 */
export function searchAndRankCharacters(
  characters: CharacterWithProgress[],
  query: string
): CharacterWithProgress[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return characters;

  const queryToneless = stripTones(trimmed);

  const scored: { item: CharacterWithProgress; score: number }[] = [];

  for (const c of characters) {
    let score = 0;

    const charId = c.id.toLowerCase();
    const tonelessPinyins = c.pinyin.map((p) => stripTones(p));

    // Tier 1: Character ID or Pinyin match
    if (charId === trimmed) {
      score = 1000;
    } else if (tonelessPinyins.some((p) => p === queryToneless)) {
      score = 950;
    } else if (tonelessPinyins.some((p) => p.startsWith(queryToneless))) {
      score = 900;
    } else if (c.pinyin.some((p) => p.toLowerCase().includes(trimmed))) {
      score = 850;
    }
    // Tier 2: Definition match
    else if (c.definitions.some((d) => d.toLowerCase().startsWith(trimmed))) {
      score = 500;
    } else if (c.definitions.some((d) => d.toLowerCase().includes(trimmed))) {
      score = 400;
    }
    // Tier 3: Sentence context match
    else if (c.sentences.some((s) => s.chinese.includes(trimmed) || stripTones(s.pinyin).includes(queryToneless))) {
      score = 100;
    }

    if (score > 0) {
      scored.push({ item: c, score });
    }
  }

  // Sort by score descending, then by frequency ascending
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.item.frequency - b.item.frequency;
  });

  return scored.map((s) => s.item);
}
