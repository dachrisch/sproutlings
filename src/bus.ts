/* oxlint-disable typescript/no-explicit-any */

type Listener = (...args: any[]) => void;

type Entry = { fn: Listener; ctx?: unknown };

const listeners = new Map<string, Entry[]>();

export const EVENTS = {
  MONSTER_UPDATED: 'MONSTER_UPDATED',
  ACTION: 'ACTION',
  RUN_AWAY: 'RUN_AWAY',
} as const;

export const bus = {
  on(event: string, fn: Listener, ctx?: unknown): void {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event)!.push({ fn, ctx });
  },
  off(event: string, fn: Listener, _ctx?: unknown): void {
    const entries = listeners.get(event);
    if (!entries) return;
    listeners.set(event, entries.filter((e) => e.fn !== fn));
  },
  emit(event: string, ...args: any[]): void {
    listeners.get(event)?.forEach(({ fn }) => fn(...args));
  },
};
