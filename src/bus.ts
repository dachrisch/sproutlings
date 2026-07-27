type Listener<T> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<T>(event: string, listener: Listener<T>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener as Listener<unknown>);
  }

  off<T>(event: string, listener: Listener<T>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<T>(event: string, payload?: T): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload as unknown));
  }
}

export const bus = new EventBus();

export const EVENTS = {
  MONSTER_UPDATED: 'monster-updated',
  ACTION: 'action',
  RUN_AWAY: 'run-away',
} as const;
