import { describe, expect, it } from 'vitest';
import {
  disneyBiasCardCount,
  disneyBiasCards,
  nextDeckDraw,
  shuffledPromptAt,
  type PromptCard
} from '../../src/lib/domain/prompt-deck';

const cards: PromptCard[] = [
  { id: '0000', kind: 'prompt', ordinal: 0, text: 'one' },
  { id: '0001', kind: 'prompt', ordinal: 1, text: 'two' },
  { id: '0000', kind: 'positive', ordinal: 0, text: 'three' }
];

const disneyCards: PromptCard[] = [
  { id: '0000', kind: 'disney', ordinal: 0, text: 'castle' },
  { id: '0001', kind: 'disney', ordinal: 1, text: 'monorail' }
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

  it('adds Disney cards as one third of the biased deck', () => {
    const biased = disneyBiasCards(cards, disneyCards, 123);

    expect(disneyBiasCardCount(cards.length)).toBe(2);
    expect(biased).toHaveLength(5);
    expect(biased.filter((card) => card.kind === 'disney')).toHaveLength(2);
    expect(biased.filter((card) => card.kind !== 'disney')).toEqual(cards);
  });

  it('chooses Disney bias cards deterministically for the seed', () => {
    expect(disneyBiasCards(cards, disneyCards, 123)).toEqual(disneyBiasCards(cards, disneyCards, 123));
    expect(shuffledPromptAt(disneyBiasCards(cards, disneyCards, 123), 123, 0)).toEqual(
      shuffledPromptAt(disneyBiasCards(cards, disneyCards, 123), 123, 0)
    );
  });
});
