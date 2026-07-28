import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('nameEntry', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="name-entry" hidden>
        <input id="name-input" />
        <button id="name-confirm" type="submit"></button>
      </form>
    `;
    vi.resetModules();
  });

  it('reveals the panel when shown', async () => {
    const { initNameEntry, showNameEntry } = await import('./nameEntry');
    initNameEntry();
    showNameEntry(() => {});
    expect((document.getElementById('name-entry') as HTMLFormElement).hidden).toBe(false);
  });

  it('trims the input, hides the panel, and invokes the callback on submit', async () => {
    const { initNameEntry, showNameEntry } = await import('./nameEntry');
    initNameEntry();
    const callback = vi.fn();
    showNameEntry(callback);

    const input = document.getElementById('name-input') as HTMLInputElement;
    input.value = '  Sprout  ';
    document.getElementById('name-entry')?.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(callback).toHaveBeenCalledWith('Sprout');
    expect((document.getElementById('name-entry') as HTMLFormElement).hidden).toBe(true);
  });

  it('caps the confirmed name at MAX_NAME_LENGTH characters', async () => {
    const { initNameEntry, showNameEntry } = await import('./nameEntry');
    const { MAX_NAME_LENGTH } = await import('../constants');
    initNameEntry();
    const callback = vi.fn();
    showNameEntry(callback);

    const input = document.getElementById('name-input') as HTMLInputElement;
    input.value = 'A'.repeat(MAX_NAME_LENGTH + 10);
    document.getElementById('name-entry')?.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(callback).toHaveBeenCalledWith('A'.repeat(MAX_NAME_LENGTH));
  });

  it('ignores submit when the trimmed name is empty', async () => {
    const { initNameEntry, showNameEntry } = await import('./nameEntry');
    initNameEntry();
    const callback = vi.fn();
    showNameEntry(callback);

    const input = document.getElementById('name-input') as HTMLInputElement;
    input.value = '   ';
    document.getElementById('name-entry')?.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(callback).not.toHaveBeenCalled();
  });
});
