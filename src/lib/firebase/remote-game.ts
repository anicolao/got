import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { appendTableAction, subscribeTableActions } from './action-log';
import {
  createInitialThingsState,
  replayThings,
  type ThingsAction,
  type ThingsState
} from '$lib/domain/things';

export interface RemoteGameSnapshot {
  actions: ThingsAction[];
  error?: string;
  loading: boolean;
  state: ThingsState;
}

export function createRemoteGame(tableId: string) {
  const initialState = createInitialThingsState(tableId);
  const store = writable<RemoteGameSnapshot>({
    actions: [],
    loading: true,
    state: initialState
  });

  let unsubscribe: () => void = () => undefined;
  if (browser) {
    unsubscribe = subscribeTableActions(tableId, (actions) => {
      store.set({
        actions,
        loading: false,
        state: replayThings(actions, initialState)
      });
    });
  }

  async function dispatch(action: ThingsAction) {
    try {
      await appendTableAction(tableId, action);
    } catch (error) {
      store.update((snapshot) => ({
        ...snapshot,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }

  return {
    subscribe: store.subscribe,
    dispatch,
    destroy: unsubscribe
  };
}
