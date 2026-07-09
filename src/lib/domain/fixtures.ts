import {
  answer_category,
  guesses,
  join_game,
  set_category,
  show_round,
  type ThingsAction
} from './things';

export const samplePlayers = ['ana@example.com', 'bev@example.com', 'cam@example.com'];

export const sampleActionLog: ThingsAction[] = [
  join_game(samplePlayers[0]),
  join_game(samplePlayers[1]),
  join_game(samplePlayers[2]),
  set_category('you should never say during a job interview'),
  answer_category({ player: samplePlayers[0], answer: 'I know where the snacks are hidden' }),
  answer_category({ player: samplePlayers[1], answer: 'My last boss still texts me' }),
  answer_category({ player: samplePlayers[2], answer: 'I brought my own chair' }),
  show_round(true),
  guesses({ player: samplePlayers[0], dead_player: samplePlayers[1] }),
  guesses({ player: samplePlayers[2], dead_player: samplePlayers[0] })
];
