import { readFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || 'words-62ed1';
const credential = applicationDefault();

initializeApp({ projectId, credential });
const db = getFirestore();

function readPrompts(path) {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function writeCollection(collectionName, prompts) {
  const batchSize = 400;
  for (let start = 0; start < prompts.length; start += batchSize) {
    const batch = db.batch();
    prompts.slice(start, start + batchSize).forEach((text, offset) => {
      const ordinal = start + offset;
      const ref = db.collection(collectionName).doc(String(ordinal).padStart(4, '0'));
      batch.set(ref, { text, ordinal });
    });
    await batch.commit();
  }
}

const prompts = readPrompts('game_of_things_prompts.txt');
const positivePrompts = readPrompts('game_of_things_positive_prompts.txt');

await writeCollection('thingsPrompts', prompts);
await writeCollection('thingsPositivePrompts', positivePrompts);
await db.collection('thingsPromptDeck').doc('state').set(
  {
    currentIndex: 0,
    seed: Math.floor(Math.random() * 0x7fffffff),
    totalEntries: prompts.length + positivePrompts.length,
    updatedAt: FieldValue.serverTimestamp()
  },
  { merge: true }
);

console.log(
  `Seeded ${prompts.length} prompt cards and ${positivePrompts.length} positive prompt cards.`
);
