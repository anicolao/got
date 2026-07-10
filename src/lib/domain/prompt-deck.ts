export interface PromptCard {
  id: string;
  kind: 'prompt' | 'positive';
  text: string;
  ordinal: number;
}

export interface PromptDeckState {
  currentIndex: number;
  seed: number;
  totalEntries: number;
  updatedAt?: unknown;
}

export function seededHash(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function shuffledPromptAt(cards: PromptCard[], seed: number, index: number) {
  if (cards.length === 0) return undefined;
  const ordered = [...cards].sort((a, b) => {
    const aHash = seededHash(`${seed}:${a.kind}:${a.ordinal}:${a.id}:${a.text}`);
    const bHash = seededHash(`${seed}:${b.kind}:${b.ordinal}:${b.id}:${b.text}`);
    if (aHash !== bHash) return aHash - bHash;
    return a.id.localeCompare(b.id);
  });
  return ordered[index % ordered.length];
}

export function nextDeckDraw(state: PromptDeckState, nextSeed: number) {
  const totalEntries = Math.max(0, state.totalEntries || 0);
  if (totalEntries === 0) {
    return {
      drawIndex: 0,
      nextState: { ...state, currentIndex: 0, seed: nextSeed, totalEntries }
    };
  }

  const currentIndex = Math.max(0, state.currentIndex || 0);
  if (currentIndex >= totalEntries) {
    return {
      drawIndex: 0,
      nextState: { ...state, currentIndex: 1, seed: nextSeed, totalEntries }
    };
  }

  return {
    drawIndex: currentIndex,
    nextState: { ...state, currentIndex: currentIndex + 1, totalEntries }
  };
}
