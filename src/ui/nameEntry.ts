import { MAX_NAME_LENGTH } from '../constants';

let onConfirm: ((name: string) => void) | null = null;

export function initNameEntry(): void {
  const form = document.getElementById('name-entry') as HTMLFormElement | null;
  const input = document.getElementById('name-input') as HTMLInputElement | null;

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = (input?.value ?? '').trim().slice(0, MAX_NAME_LENGTH);
    if (!name) return;
    hideNameEntry();
    const callback = onConfirm;
    onConfirm = null;
    callback?.(name);
  });
}

export function showNameEntry(callback: (name: string) => void): void {
  const form = document.getElementById('name-entry') as HTMLFormElement | null;
  const input = document.getElementById('name-input') as HTMLInputElement | null;
  onConfirm = callback;
  if (form) form.hidden = false;
  if (input) {
    input.value = '';
    input.focus();
  }
}

export function hideNameEntry(): void {
  const form = document.getElementById('name-entry') as HTMLFormElement | null;
  if (form) form.hidden = true;
}
