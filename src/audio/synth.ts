import { getSettings } from '../store';
import { bus, EVENTS } from '../bus';
import type { Need } from '../types';

let audioCtx: AudioContext | null = null;
let loopTimer: ReturnType<typeof setInterval> | null = null;

const BLIP_FREQUENCIES: Record<Need, number> = {
  hunger: 392,
  happiness: 523,
  cleanliness: 659,
  energy: 330,
};

const LOOP_NOTES = [392, 440, 523, 440];

function ensureContext(): AudioContext | null {
  if (!getSettings().sound) return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playBlip(need: Need): void {
  const ctx = ensureContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = BLIP_FREQUENCIES[need];
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

export function playRunAway(): void {
  const ctx = ensureContext();
  if (!ctx) return;
  [523, 440, 349, 262].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    const startTime = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.15);
  });
}

function playLoopStep(index: number): void {
  const ctx = ensureContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = LOOP_NOTES[index % LOOP_NOTES.length];
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

export function initAudio(): void {
  bus.on(EVENTS.ACTION, (need: Need) => playBlip(need));
  bus.on(EVENTS.RUN_AWAY, () => playRunAway());
  let step = 0;
  loopTimer = setInterval(() => {
    playLoopStep(step);
    step += 1;
  }, 500);
}

export function stopAudio(): void {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
}
