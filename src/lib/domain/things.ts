import { createAction, createReducer, type AnyAction } from '@reduxjs/toolkit';

export interface ThingsState {
  currentCategory: string;
  playerToAnswer: Record<string, string>;
  roundReady: boolean;
  showRound: boolean;
  roundOver: boolean;
  players: string[];
  alive: boolean[];
  currentPlayerIndex: number;
  scores: number[];
}

export const join_game = createAction<string>('join_game');
export const leave_game = createAction<string>('leave_game');
export const set_current_player = createAction<number>('set_current_player');
export const show_round = createAction<boolean>('show_round');
export const set_category = createAction<string>('set_category');
export const answer_category = createAction<{ answer: string; player: string }>('answer_category');
export const guesses = createAction<{ player: string; dead_player: string }>('eliminates');

export type ThingsAction =
  | ReturnType<typeof join_game>
  | ReturnType<typeof leave_game>
  | ReturnType<typeof set_current_player>
  | ReturnType<typeof show_round>
  | ReturnType<typeof set_category>
  | ReturnType<typeof answer_category>
  | ReturnType<typeof guesses>;

export const initialThingsState: ThingsState = {
  currentCategory: '',
  playerToAnswer: {},
  players: [],
  alive: [],
  roundReady: false,
  showRound: false,
  roundOver: false,
  currentPlayerIndex: 0,
  scores: []
};

function recomputeRoundReady(state: ThingsState) {
  state.roundReady = state.players.length > 0 && state.players.every((player) => !!state.playerToAnswer[player]);
}

export const thingsReducer = createReducer(initialThingsState, (r) => {
  r.addCase(join_game, (state, { payload }) => {
    if (!state.players.includes(payload)) {
      state.players.push(payload);
      state.scores.push(0);
      state.alive.push(true);
    }
  });
  r.addCase(leave_game, (state, { payload }) => {
    const playerIndex = state.players.indexOf(payload);
    if (playerIndex !== -1) {
      if (state.currentPlayerIndex >= playerIndex) {
        state.currentPlayerIndex--;
        if (state.currentPlayerIndex < 0) state.currentPlayerIndex = 0;
      }
      state.players.splice(playerIndex, 1);
      state.scores.splice(playerIndex, 1);
      state.alive.splice(playerIndex, 1);
      delete state.playerToAnswer[payload];
      recomputeRoundReady(state);
    }
  });
  r.addCase(set_current_player, (state, { payload }) => {
    state.currentPlayerIndex = state.players.length === 0 ? 0 : payload % state.players.length;
  });
  r.addCase(show_round, (state) => {
    state.showRound = true;
  });
  r.addCase(set_category, (state, { payload }) => {
    state.currentCategory = payload;
    state.alive = state.players.map(() => true);
    state.playerToAnswer = {};
    state.roundOver = false;
    state.roundReady = false;
    state.showRound = false;
  });
  r.addCase(answer_category, (state, { payload }) => {
    const playerIndex = state.players.indexOf(payload.player);
    state.playerToAnswer[payload.player] = payload.answer;
    if (playerIndex !== -1) state.alive[playerIndex] = true;
    recomputeRoundReady(state);
  });
  r.addCase(guesses, (state, { payload }) => {
    const deadPlayerIndex = state.players.indexOf(payload.dead_player);
    const playerIndex = state.players.indexOf(payload.player);
    if (deadPlayerIndex === -1 || playerIndex === -1) return;
    state.alive[deadPlayerIndex] = false;
    state.scores[playerIndex] += 1;
    const numAlive = state.alive.filter(Boolean).length;
    if (numAlive === 1) {
      state.scores[playerIndex] += 1;
      state.roundOver = true;
      state.currentPlayerIndex += 1;
      state.currentPlayerIndex %= state.players.length;
    }
  });
});

export function replayThings(actions: AnyAction[], initialState: ThingsState = initialThingsState) {
  return actions.reduce((state, action) => thingsReducer(state, action), initialState);
}

export function normalizeAction(action: AnyAction): ThingsAction | undefined {
  const { type, payload } = action;
  if (type === 'join_game') return join_game(String(payload));
  if (type === 'leave_game') return leave_game(String(payload));
  if (type === 'set_current_player') return set_current_player(Number(payload));
  if (type === 'show_round') return show_round(Boolean(payload ?? true));
  if (type === 'set_category') return set_category(String(payload ?? ''));
  if (type === 'answer_category' && payload?.player) {
    return answer_category({ player: String(payload.player), answer: String(payload.answer ?? '') });
  }
  if (type === 'eliminates' && payload?.player && payload?.dead_player) {
    return guesses({ player: String(payload.player), dead_player: String(payload.dead_player) });
  }
  return undefined;
}

export function displayName(player: string) {
  const name = player.includes('@') ? player.split('@')[0] : player;
  return name
    .split(/[._ -]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export function displayPlayerName(player: string, users: Record<string, { name?: string | null }>) {
  const fullName = users[player]?.name;
  if (fullName) return fullName.trim().split(/\s+/)[0] || displayName(player);
  return displayName(player);
}

export function currentPlayer(state: ThingsState) {
  return state.players[state.currentPlayerIndex] ?? '';
}

export function nextLivingPlayerIndex(state: ThingsState) {
  if (state.players.length === 0) return 0;
  let next = (state.currentPlayerIndex + 1) % state.players.length;
  for (let i = 0; i < state.players.length; i++) {
    if (state.alive[next]) return next;
    next = (next + 1) % state.players.length;
  }
  return state.currentPlayerIndex;
}
