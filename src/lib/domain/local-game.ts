import { writable } from 'svelte/store';
import type { AnyAction } from '@reduxjs/toolkit';
import {
  initialThingsState,
  normalizeAction,
  replayThings,
  type ThingsAction,
  type ThingsState
} from './things';

export interface GameSnapshot {
  actions: ThingsAction[];
  error?: string;
  state: ThingsState;
}

function readStoredActions(tableId: string): ThingsAction[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(`got.actions.${tableId}`);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as AnyAction[];
  return parsed.map(normalizeAction).filter((action): action is ThingsAction => !!action);
}

function writeStoredActions(tableId: string, actions: ThingsAction[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`got.actions.${tableId}`, JSON.stringify(actions));
}

export function createLocalGame(tableId: string, seedActions: ThingsAction[] = []) {
  const actions = readStoredActions(tableId);
  const initialActions = actions.length > 0 ? actions : seedActions;
  const store = writable<GameSnapshot>({
    actions: initialActions,
    state: replayThings(initialActions, initialThingsState)
  });

  function dispatch(action: ThingsAction) {
    store.update((snapshot) => {
      const nextActions = [...snapshot.actions, action];
      writeStoredActions(tableId, nextActions);
      return {
        actions: nextActions,
        state: replayThings(nextActions, initialThingsState)
      };
    });
  }

  function reset(nextActions: ThingsAction[] = []) {
    writeStoredActions(tableId, nextActions);
    store.set({
      actions: nextActions,
      state: replayThings(nextActions, initialThingsState)
    });
  }

  return {
    subscribe: store.subscribe,
    dispatch,
    reset
  };
}
