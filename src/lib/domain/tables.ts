import { createAction, createReducer, type AnyAction } from '@reduxjs/toolkit';

export interface Table {
  tableid: string;
  gameid: string;
  owner: string;
  createdAtMs?: number;
  players: string[];
  started: boolean;
  completed: boolean;
}

export interface TablesState {
  tableIds: string[];
  tableIdToTable: Record<string, Table>;
}

export interface GameDefinition {
  id: string;
  properties: Record<string, string>;
}

export interface GameDefsState {
  gameIds: string[];
  gameIdToGame: Record<string, GameDefinition>;
}

export const THINGS_GAME_ID = 'things';

export const create_table = createAction<{ tableid: string; gameid: string; owner: string; createdAtMs?: number }>(
  'create_table'
);
export const join_table = createAction<{ tableid: string; player: string }>('join_table');
export const leave_table = createAction<{ tableid: string; player: string }>('leave_table');
export const start_table = createAction<{ tableid: string }>('start_table');
export const complete_table = createAction<{ tableid: string }>('complete_table');
export const destroy_table = createAction<{ tableid: string }>('destroy_table');
export const define_game = createAction<GameDefinition>('define_game');

export type TableAction =
  | ReturnType<typeof create_table>
  | ReturnType<typeof join_table>
  | ReturnType<typeof leave_table>
  | ReturnType<typeof start_table>
  | ReturnType<typeof complete_table>
  | ReturnType<typeof destroy_table>;

export const initialTablesState: TablesState = {
  tableIds: [],
  tableIdToTable: {}
};

export const initialGameDefsState: GameDefsState = {
  gameIds: [THINGS_GAME_ID],
  gameIdToGame: {
    [THINGS_GAME_ID]: {
      id: THINGS_GAME_ID,
      properties: { name: 'Game of Things', path: 'table' }
    }
  }
};

export const tablesReducer = createReducer(initialTablesState, (r) => {
  r.addCase(create_table, (state, { payload }) => {
    if (!state.tableIdToTable[payload.tableid]) {
      state.tableIds.push(payload.tableid);
    }
    state.tableIdToTable[payload.tableid] = {
      ...payload,
      createdAtMs: payload.createdAtMs,
      players: [payload.owner],
      started: false,
      completed: false
    };
  });
  r.addCase(join_table, (state, { payload }) => {
    const table = state.tableIdToTable[payload.tableid];
    if (!table || table.players.includes(payload.player)) return;
    table.players.push(payload.player);
  });
  r.addCase(leave_table, (state, { payload }) => {
    const table = state.tableIdToTable[payload.tableid];
    if (!table) return;
    table.players = table.players.filter((player) => player !== payload.player);
  });
  r.addCase(start_table, (state, { payload }) => {
    const table = state.tableIdToTable[payload.tableid];
    if (table) table.started = true;
  });
  r.addCase(complete_table, (state, { payload }) => {
    const table = state.tableIdToTable[payload.tableid];
    if (table) table.completed = true;
  });
  r.addCase(destroy_table, (state, { payload }) => {
    state.tableIds = state.tableIds.filter((tableId) => tableId !== payload.tableid);
    delete state.tableIdToTable[payload.tableid];
  });
});

export const gamedefsReducer = createReducer(initialGameDefsState, (r) => {
  r.addCase(define_game, (state, { payload }) => {
    if (!state.gameIdToGame[payload.id]) state.gameIds.push(payload.id);
    state.gameIdToGame[payload.id] = payload;
  });
});

export function normalizeTableAction(action: AnyAction): TableAction | undefined {
  const { type, payload } = action;
  if (type === 'create_table' && payload?.tableid && payload?.gameid && payload?.owner) {
    return create_table({
      tableid: String(payload.tableid),
      gameid: String(payload.gameid),
      owner: String(payload.owner),
      createdAtMs: timestampToMillis(action.timestamp)
    });
  }
  if (type === 'join_table' && payload?.tableid && payload?.player) {
    return join_table({ tableid: String(payload.tableid), player: String(payload.player) });
  }
  if (type === 'leave_table' && payload?.tableid && payload?.player) {
    return leave_table({ tableid: String(payload.tableid), player: String(payload.player) });
  }
  if (type === 'start_table' && payload?.tableid) return start_table({ tableid: String(payload.tableid) });
  if (type === 'complete_table' && payload?.tableid) {
    return complete_table({ tableid: String(payload.tableid) });
  }
  if (type === 'destroy_table' && payload?.tableid) {
    return destroy_table({ tableid: String(payload.tableid) });
  }
  return undefined;
}

function timestampToMillis(timestamp: unknown): number | undefined {
  if (typeof timestamp === 'number' && Number.isFinite(timestamp)) return timestamp;
  if (timestamp instanceof Date) return timestamp.getTime();
  if (timestamp && typeof timestamp === 'object') {
    const value = timestamp as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1_000_000);
  }
  return undefined;
}

export function replayTables(actions: TableAction[], initialState: TablesState = initialTablesState) {
  return actions.reduce((state, action) => tablesReducer(state, action), initialState);
}

export function isThingsGame(gameId: string, gamedefs: GameDefsState) {
  if (gameId === THINGS_GAME_ID) return true;
  return gamedefs.gameIdToGame[gameId]?.properties?.path === 'things';
}

export function thingsGameId(gamedefs: GameDefsState) {
  return gamedefs.gameIds.find((gameId) => gamedefs.gameIdToGame[gameId]?.properties?.path === 'things');
}
