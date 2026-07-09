import { createLocalGame } from './local-game';
import { sampleActionLog } from './fixtures';

const sessions = new Map<string, ReturnType<typeof createLocalGame>>();

export function getLocalSession(tableId: string) {
  const id = tableId || 'demo';
  const existing = sessions.get(id);
  if (existing) return existing;
  const created = createLocalGame(id, id === 'demo' ? sampleActionLog : []);
  sessions.set(id, created);
  return created;
}
