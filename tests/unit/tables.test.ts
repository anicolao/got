import { describe, expect, it } from 'vitest';
import {
  create_table,
  isThingsGame,
  join_table,
  leave_table,
  normalizeTableAction,
  replayTables,
  start_table,
  THINGS_GAME_ID,
  thingsGameId
} from '../../src/lib/domain/tables';

describe('table lobby action set', () => {
  it('replays multiple active tables independently', () => {
    const state = replayTables([
      create_table({ tableid: 'table-a', gameid: THINGS_GAME_ID, owner: 'ana@example.com' }),
      create_table({ tableid: 'table-b', gameid: THINGS_GAME_ID, owner: 'bev@example.com' }),
      join_table({ tableid: 'table-a', player: 'cam@example.com' }),
      start_table({ tableid: 'table-a' })
    ]);

    expect(state.tableIds).toEqual(['table-a', 'table-b']);
    expect(state.tableIdToTable['table-a'].players).toEqual([
      'ana@example.com',
      'cam@example.com'
    ]);
    expect(state.tableIdToTable['table-a'].started).toBe(true);
    expect(state.tableIdToTable['table-b'].players).toEqual(['bev@example.com']);
    expect(state.tableIdToTable['table-b'].started).toBe(false);
  });

  it('preserves the create action timestamp as table creation time', () => {
    const action = normalizeTableAction({
      type: 'create_table',
      payload: { tableid: 'table-a', gameid: THINGS_GAME_ID, owner: 'ana@example.com' },
      timestamp: { seconds: 1000, nanoseconds: 500_000_000 }
    });
    const state = replayTables(action ? [action] : []);

    expect(state.tableIdToTable['table-a'].createdAtMs).toBe(1000500);
  });

  it('lets a player leave a waiting table', () => {
    const state = replayTables([
      create_table({ tableid: 'table-a', gameid: THINGS_GAME_ID, owner: 'ana@example.com' }),
      join_table({ tableid: 'table-a', player: 'cam@example.com' }),
      leave_table({ tableid: 'table-a', player: 'cam@example.com' })
    ]);

    expect(state.tableIdToTable['table-a'].players).toEqual(['ana@example.com']);
  });

  it('recognizes the local Things game id and the original gamedef path', () => {
    expect(
      isThingsGame(THINGS_GAME_ID, { gameIds: [], gameIdToGame: {} })
    ).toBe(true);
    expect(
      isThingsGame('legacy-id', {
        gameIds: ['legacy-id'],
        gameIdToGame: { 'legacy-id': { id: 'legacy-id', properties: { path: 'things' } } }
      })
    ).toBe(true);
  });

  it('selects the legacy Things gamedef document id for new tables', () => {
    expect(
      thingsGameId({
        gameIds: ['words-id', 'things-id'],
        gameIdToGame: {
          'words-id': { id: 'words-id', properties: { path: 'words' } },
          'things-id': { id: 'things-id', properties: { path: 'things' } }
        }
      })
    ).toBe('things-id');
  });
});
