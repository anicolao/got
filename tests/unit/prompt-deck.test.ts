import { describe, expect, it } from 'vitest';
import { nextDeckDraw, shuffledPromptAt, type PromptCard } from '../../src/lib/domain/prompt-deck';

const cards: PromptCard[] = [
  { id: '0000', kind: 'prompt', ordinal: 0, text: 'one' },
  { id: '0001', kind: 'prompt', ordinal: 1, text: 'two' },
  { id: '0000', kind: 'positive', ordinal: 0, text: 'three' }
];

describe('prompt deck', () => {
  it('selects deterministic cards for a seed and index', () => {
    expect(shuffledPromptAt(cards, 123, 0)).toEqual(shuffledPromptAt(cards, 123, 0));
    expect(shuffledPromptAt(cards, 123, 1)).toEqual(shuffledPromptAt(cards, 123, 1));
  });

  it('increments the shared index until rollover', () => {
    expect(nextDeckDraw({ currentIndex: 0, seed: 10, totalEntries: 3 }, 99)).toEqual({
      drawIndex: 0,
      nextState: { currentIndex: 1, seed: 10, totalEntries: 3 }
    });
    expect(nextDeckDraw({ currentIndex: 3, seed: 10, totalEntries: 3 }, 99)).toEqual({
      drawIndex: 0,
      nextState: { currentIndex: 1, seed: 99, totalEntries: 3 }
    });
  });
});
