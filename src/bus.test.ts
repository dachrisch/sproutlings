import { describe, expect, it, vi } from 'vitest';
import { bus, EVENTS } from './bus';

describe('bus', () => {
  it('calls a registered listener when the event is emitted', () => {
    const listener = vi.fn();
    bus.on(EVENTS.ACTION, listener);
    bus.emit(EVENTS.ACTION, 'hunger');
    expect(listener).toHaveBeenCalledWith('hunger');
    bus.off(EVENTS.ACTION, listener);
  });

  it('stops calling a listener after off()', () => {
    const listener = vi.fn();
    bus.on(EVENTS.RUN_AWAY, listener);
    bus.off(EVENTS.RUN_AWAY, listener);
    bus.emit(EVENTS.RUN_AWAY);
    expect(listener).not.toHaveBeenCalled();
  });

  it('invokes the listener with the context passed to on()', () => {
    const ctx = { seen: undefined as unknown };
    function listener(this: typeof ctx, value: unknown) {
      this.seen = value;
    }
    bus.on(EVENTS.ACTION, listener, ctx);
    bus.emit(EVENTS.ACTION, 'hunger');
    expect(ctx.seen).toBe('hunger');
    bus.off(EVENTS.ACTION, listener);
  });
});
