import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { auth, firestore } from './config';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import type { AnyAction } from '@reduxjs/toolkit';
import {
  create_table,
  define_game,
  gamedefsReducer,
  initialGameDefsState,
  initialTablesState,
  normalizeTableAction,
  replayTables,
  THINGS_GAME_ID,
  type GameDefsState,
  type TableAction,
  type TablesState
} from '$lib/domain/tables';

export interface LobbySnapshot {
  actions: TableAction[];
  error?: string;
  gamedefs: GameDefsState;
  loading: boolean;
  tables: TablesState;
}

const state = writable<LobbySnapshot>({
  actions: [],
  gamedefs: initialGameDefsState,
  loading: true,
  tables: initialTablesState
});

let actions: TableAction[] = [];
let gamedefs = initialGameDefsState;
let subscribed = false;
let unsubscribeActions: Unsubscribe | undefined;
let unsubscribeGamedefs: Unsubscribe | undefined;

function publish(patch: Partial<LobbySnapshot> = {}) {
  state.set({
    actions,
    gamedefs,
    loading: false,
    tables: replayTables(actions),
    ...patch
  });
}

export function subscribeLobby() {
  if (!browser || !firestore || subscribed) return;
  subscribed = true;

  unsubscribeActions = onSnapshot(
    query(collection(firestore, 'actions'), orderBy('timestamp')),
    (snapshot) => {
      actions = snapshot.docs
        .map((doc) => {
          const data = doc.data() as AnyAction & { timestamp?: unknown };
          const { timestamp: _timestamp, ...action } = data;
          return normalizeTableAction(action);
        })
        .filter((action): action is TableAction => !!action);
      publish();
    },
    (error) => publish({ error: error.message })
  );

  unsubscribeGamedefs = onSnapshot(
    query(collection(firestore, 'gamedef')),
    (snapshot) => {
      gamedefs = snapshot.docs.reduce((next, doc) => {
        return gamedefsReducer(
          next,
          define_game({ id: doc.id, properties: doc.data() as Record<string, string> })
        );
      }, initialGameDefsState);
      publish();
    },
    () => publish()
  );
}

export function stopLobbySubscription() {
  unsubscribeActions?.();
  unsubscribeGamedefs?.();
  subscribed = false;
}

export const lobbyStore = {
  subscribe: state.subscribe
};

export async function appendLobbyAction(action: TableAction) {
  if (!firestore) throw new Error('Firestore is unavailable outside the browser');
  const payload = action.payload === undefined ? {} : { payload: action.payload };
  await addDoc(collection(firestore, 'actions'), {
    type: action.type,
    ...payload,
    creator: auth?.currentUser?.uid ?? null,
    creatorEmail: auth?.currentUser?.email ?? null,
    timestamp: serverTimestamp()
  });
}

export async function createThingsTable(owner: string) {
  if (!firestore) throw new Error('Firestore is unavailable outside the browser');
  const tableRef = await addDoc(collection(firestore, 'tables'), {
    creator: auth?.currentUser?.uid ?? null,
    gameid: THINGS_GAME_ID,
    created: serverTimestamp()
  });
  await appendLobbyAction(create_table({ tableid: tableRef.id, gameid: THINGS_GAME_ID, owner }));
  return tableRef.id;
}
