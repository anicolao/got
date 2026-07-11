import { firestore } from './config';
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import {
  disneyBiasCards,
  nextDeckDraw,
  shuffledPromptAt,
  type PromptCard,
  type PromptDeckId,
  type PromptDeckState
} from '$lib/domain/prompt-deck';

const PROMPTS_COLLECTION = 'thingsPrompts';
const POSITIVE_PROMPTS_COLLECTION = 'thingsPositivePrompts';
const DISNEY_PROMPTS_COLLECTION = 'thingsDisneyPrompts';
const DECK_STATE_COLLECTION = 'thingsPromptDeck';
const DECK_STATE_DOCUMENTS = {
  main: 'state',
  disneyBiased: 'disneyBiased'
} satisfies Record<PromptDeckId, string>;

function randomSeed() {
  return Math.floor(Math.random() * 0x7fffffff);
}

async function readPromptCollection(kind: PromptCard['kind'], collectionName: string) {
  if (!firestore) throw new Error('Firestore is unavailable outside the browser');
  const snapshot = await getDocs(collection(firestore, collectionName));
  return snapshot.docs.map((promptDoc) => {
    const data = promptDoc.data() as { text?: unknown; ordinal?: unknown };
    return {
      id: promptDoc.id,
      kind,
      text: String(data.text || ''),
      ordinal: Number(data.ordinal || 0)
    } satisfies PromptCard;
  }).filter((card) => card.text);
}

export async function readPromptCards() {
  const [prompts, positivePrompts] = await Promise.all([
    readPromptCollection('prompt', PROMPTS_COLLECTION),
    readPromptCollection('positive', POSITIVE_PROMPTS_COLLECTION)
  ]);
  return [...prompts, ...positivePrompts];
}

export async function readDisneyPromptCards() {
  return readPromptCollection('disney', DISNEY_PROMPTS_COLLECTION);
}

function buildCardsForDeck(deckId: PromptDeckId, mainCards: PromptCard[], disneyCards: PromptCard[], seed: number) {
  if (deckId === 'disneyBiased') return disneyBiasCards(mainCards, disneyCards, seed);
  return mainCards;
}

export async function drawNextPromptCard(deckId: PromptDeckId = 'main') {
  if (!firestore) throw new Error('Firestore is unavailable outside the browser');
  const [mainCards, disneyCards] = await Promise.all([
    readPromptCards(),
    deckId === 'disneyBiased' ? readDisneyPromptCards() : Promise.resolve([])
  ]);
  if (mainCards.length === 0) throw new Error('No prompt cards are available.');

  const stateRef = doc(firestore, DECK_STATE_COLLECTION, DECK_STATE_DOCUMENTS[deckId]);
  const draw = await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(stateRef);
    const existing = snapshot.exists()
      ? (snapshot.data() as Partial<PromptDeckState>)
      : {};
    const seed = Number(existing.seed || randomSeed());
    const cards = buildCardsForDeck(deckId, mainCards, disneyCards, seed);
    const state: PromptDeckState = {
      currentIndex: Number(existing.currentIndex || 0),
      seed,
      totalEntries: cards.length
    };
    const result = nextDeckDraw(state, randomSeed());
    const nextCards = buildCardsForDeck(deckId, mainCards, disneyCards, result.nextState.seed);
    transaction.set(
      stateRef,
      {
        ...result.nextState,
        totalEntries: nextCards.length,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return {
      drawIndex: result.drawIndex,
      seed: result.nextState.seed
    };
  });

  const cards = buildCardsForDeck(deckId, mainCards, disneyCards, draw.seed);
  const card = shuffledPromptAt(cards, draw.seed, draw.drawIndex);
  if (!card) throw new Error('No prompt card matched the deck draw.');
  return card;
}
