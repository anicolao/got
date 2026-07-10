import { describe, expect, it } from 'vitest';
import {
  answer_category,
  guesses,
  initialThingsState,
  join_game,
  leave_game,
  replayThings,
  scrambledCastAnswers,
  set_category,
  show_round,
  thingsReducer
} from '../../src/lib/domain/things';
import { sampleActionLog } from '../../src/lib/domain/fixtures';

describe('things action set', () => {
  it('preserves the original action type strings', () => {
    expect(join_game('a').type).toBe('join_game');
    expect(leave_game('a').type).toBe('leave_game');
    expect(set_category('x').type).toBe('set_category');
    expect(show_round(true).type).toBe('show_round');
    expect(answer_category({ player: 'a', answer: 'b' }).type).toBe('answer_category');
    expect(guesses({ player: 'a', dead_player: 'b' }).type).toBe('eliminates');
  });

  it('replays old action logs into current state', () => {
    const state = replayThings(sampleActionLog);
    expect(state.players).toEqual(['ana@example.com', 'bev@example.com', 'cam@example.com']);
    expect(state.currentCategory).toBe('you should never say during a job interview');
    expect(state.showRound).toBe(true);
    expect(state.roundOver).toBe(true);
    expect(state.scores).toEqual([1, 0, 2]);
  });

  it('marks a round ready when every player has answered', () => {
    let state = thingsReducer(initialThingsState, join_game('a@example.com'));
    state = thingsReducer(state, join_game('b@example.com'));
    state = thingsReducer(state, set_category('you hide in a closet'));
    state = thingsReducer(state, answer_category({ player: 'a@example.com', answer: 'coats' }));
    expect(state.roundReady).toBe(false);
    state = thingsReducer(state, answer_category({ player: 'b@example.com', answer: 'boots' }));
    expect(state.roundReady).toBe(true);
  });

  it('scrambles cast answers independently from player order', () => {
    let state = thingsReducer(initialThingsState, join_game('ana@example.com'));
    state = thingsReducer(state, join_game('bev@example.com'));
    state = thingsReducer(state, join_game('cam@example.com'));
    state = thingsReducer(state, set_category('you should never say at dinner'));
    state = thingsReducer(state, answer_category({ player: 'ana@example.com', answer: 'I already ate' }));
    state = thingsReducer(state, answer_category({ player: 'bev@example.com', answer: 'This tastes expensive' }));
    state = thingsReducer(state, answer_category({ player: 'cam@example.com', answer: 'I brought spreadsheets' }));

    const answers = scrambledCastAnswers(state, 'e2e-play');

    expect(answers.map((item) => item.player)).toEqual(['bev@example.com', 'ana@example.com', 'cam@example.com']);
    expect(answers.map((item) => item.answer)).toEqual([
      'This tastes expensive',
      'I already ate',
      'I brought spreadsheets'
    ]);
  });
});
