import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || 'words-62ed1';
const firebaseClientId =
  process.env.FIREBASE_CLIENT_ID || '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const firebaseClientSecret = process.env.FIREBASE_CLIENT_SECRET || 'j9iVZfS8kkCEFUPaAeJV0sAi';

function firebaseCliCredential() {
  const configPath = join(process.env.HOME || '', '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  return { config, configPath };
}

function readPrompts(path) {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function writeCollection(db, collectionName, prompts) {
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

function restValue(value) {
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  return { stringValue: String(value) };
}

function restFields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, restValue(value)]));
}

async function firebaseCliAccessToken() {
  const { config, configPath } = firebaseCliCredential();
  if (config.tokens?.access_token && Number(config.tokens.expires_at || 0) > Date.now() + 60_000) {
    return config.tokens.access_token;
  }
  if (!config.tokens?.refresh_token) {
    throw new Error('No Firebase CLI refresh token is available. Run `npx firebase-tools login` first.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: firebaseClientId,
      client_secret: firebaseClientSecret,
      refresh_token: config.tokens.refresh_token,
      grant_type: 'refresh_token'
    })
  });
  if (!response.ok) throw new Error(`Could not refresh Firebase CLI token: ${response.status}`);
  const token = await response.json();
  config.tokens.access_token = token.access_token;
  config.tokens.expires_in = token.expires_in;
  config.tokens.expires_at = Date.now() + token.expires_in * 1000;
  config.tokens.token_type = token.token_type;
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  return token.access_token;
}

async function writeRestDocuments(accessToken, collectionName, rows) {
  const writes = rows.map(({ id, data }) => ({
    update: {
      name: `projects/${projectId}/databases/(default)/documents/${collectionName}/${id}`,
      fields: restFields(data)
    }
  }));
  const batchSize = 400;
  for (let start = 0; start < writes.length; start += batchSize) {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:batchWrite`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ writes: writes.slice(start, start + batchSize) })
      }
    );
    if (!response.ok) throw new Error(`Firestore batchWrite failed for ${collectionName}: ${response.status} ${await response.text()}`);
  }
}

async function seedWithAdmin(prompts, positivePrompts, disneyPrompts) {
  initializeApp({ projectId, credential: applicationDefault() });
  const db = getFirestore();
  await writeCollection(db, 'thingsPrompts', prompts);
  await writeCollection(db, 'thingsPositivePrompts', positivePrompts);
  await writeCollection(db, 'thingsDisneyPrompts', disneyPrompts);
  await db.collection('thingsPromptDeck').doc('state').set(
    {
      currentIndex: 0,
      seed: Math.floor(Math.random() * 0x7fffffff),
      totalEntries: prompts.length + positivePrompts.length,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  await db.collection('thingsPromptDeck').doc('disneyBiased').set(
    {
      currentIndex: 0,
      seed: Math.floor(Math.random() * 0x7fffffff),
      totalEntries: prompts.length + positivePrompts.length + Math.ceil((prompts.length + positivePrompts.length) / 2),
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

async function seedWithFirebaseCli(prompts, positivePrompts, disneyPrompts) {
  const accessToken = await firebaseCliAccessToken();
  await writeRestDocuments(
    accessToken,
    'thingsPrompts',
    prompts.map((text, ordinal) => ({ id: String(ordinal).padStart(4, '0'), data: { text, ordinal } }))
  );
  await writeRestDocuments(
    accessToken,
    'thingsPositivePrompts',
    positivePrompts.map((text, ordinal) => ({ id: String(ordinal).padStart(4, '0'), data: { text, ordinal } }))
  );
  await writeRestDocuments(
    accessToken,
    'thingsDisneyPrompts',
    disneyPrompts.map((text, ordinal) => ({ id: String(ordinal).padStart(4, '0'), data: { text, ordinal } }))
  );
  await writeRestDocuments(accessToken, 'thingsPromptDeck', [
    {
      id: 'state',
      data: {
        currentIndex: 0,
        seed: Math.floor(Math.random() * 0x7fffffff),
        totalEntries: prompts.length + positivePrompts.length,
        updatedAt: new Date()
      }
    },
    {
      id: 'disneyBiased',
      data: {
        currentIndex: 0,
        seed: Math.floor(Math.random() * 0x7fffffff),
        totalEntries: prompts.length + positivePrompts.length + Math.ceil((prompts.length + positivePrompts.length) / 2),
        updatedAt: new Date()
      }
    }
  ]);
}

const prompts = readPrompts('game_of_things_prompts.txt');
const positivePrompts = readPrompts('game_of_things_positive_prompts.txt');
const disneyPrompts = readPrompts('disney_parks_game_of_things.txt');

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  await seedWithAdmin(prompts, positivePrompts, disneyPrompts);
} else {
  await seedWithFirebaseCli(prompts, positivePrompts, disneyPrompts);
}

console.log(
  `Seeded ${prompts.length} prompt cards, ${positivePrompts.length} positive prompt cards, and ${disneyPrompts.length} Disney prompt cards.`
);
