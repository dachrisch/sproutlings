let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.12,
  delay = 0,
) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    gain.gain.setValueAtTime(volume, c.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration);
  } catch {}
}

function playSlide(
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.12,
) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, c.currentTime);
    osc.frequency.linearRampToValueAtTime(endFreq, c.currentTime + duration);
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {}
}

function playNoise(duration: number, volume = 0.08) {
  try {
    const c = getCtx();
    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.connect(gain);
    gain.connect(c.destination);
    source.start(c.currentTime);
  } catch {}
}

export function playHit(): void {
  playNoise(0.04, 0.08);
  playTone(150, 0.1, 'square', 0.12, 0.02);
}

export function playCatchShake(): void {
  playTone(800, 0.06, 'sine', 0.1, 0);
  playTone(1000, 0.06, 'sine', 0.1, 0.08);
}

export function playCatchSuccess(): void {
  playTone(523, 0.15, 'sine', 0.12, 0);
  playTone(659, 0.15, 'sine', 0.12, 0.12);
  playTone(784, 0.2, 'sine', 0.12, 0.24);
}

export function playCatchFail(): void {
  playTone(400, 0.15, 'sawtooth', 0.1, 0);
  playTone(300, 0.2, 'sawtooth', 0.1, 0.12);
}

export function playFaint(): void {
  playSlide(400, 80, 0.45, 'sawtooth', 0.1);
}

export function playVictory(): void {
  const notes = [523, 587, 659, 698, 784];
  for (let i = 0; i < notes.length; i++) {
    playTone(notes[i], 0.12, 'square', 0.1, i * 0.1);
  }
}

export function playLevelUp(): void {
  playTone(1047, 0.2, 'triangle', 0.12, 0);
  playTone(1319, 0.25, 'triangle', 0.1, 0.15);
}
