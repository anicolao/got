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

export interface UserProfile {
  email: string;
  name?: string | null;
  photo?: string | null;
  uid?: string | null;
}

export interface LobbySnapshot {
  actions: TableAction[];
  error?: string;
  gamedefs: GameDefsState;
  loading: boolean;
  tables: TablesState;
  users: Record<string, UserProfile>;
}

const state = writable<LobbySnapshot>({
  actions: [],
  gamedefs: initialGameDefsState,
  loading: true,
  tables: initialTablesState,
  users: {}
});

let actions: TableAction[] = [];
let gamedefs = initialGameDefsState;
let users: Record<string, UserProfile> = {};
let subscribed = false;
let unsubscribeActions: Unsubscribe | undefined;
let unsubscribeGamedefs: Unsubscribe | undefined;
let unsubscribeUsers: Unsubscribe | undefined;

function publish(patch: Partial<LobbySnapshot> = {}) {
  state.set({
    actions,
    gamedefs,
    loading: false,
    tables: replayTables(actions),
    users,
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
          return normalizeTableAction(data);
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

  unsubscribeUsers = onSnapshot(
    query(collection(firestore, 'users')),
    (snapshot) => {
      users = Object.fromEntries(
        snapshot.docs.map((doc) => {
          const data = doc.data() as UserProfile;
          return [doc.id, { ...data, email: data.email || doc.id }];
        })
      );
      publish();
    },
    () => publish()
  );
}

export function stopLobbySubscription() {
  unsubscribeActions?.();
  unsubscribeGamedefs?.();
  unsubscribeUsers?.();
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

export async function createThingsTable(owner: string, gameid = THINGS_GAME_ID) {
  if (!firestore) throw new Error('Firestore is unavailable outside the browser');
  const tableRef = await addDoc(collection(firestore, 'tables'), {
    creator: auth?.currentUser?.uid ?? null,
    gameid,
    created: serverTimestamp()
  });
  await appendLobbyAction(create_table({ tableid: tableRef.id, gameid, owner }));
  return tableRef.id;
}
