let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, c.currentTime + duration * 0.3);
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
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
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

function playNotes(notes: { freq: number; time: number; dur: number }[], type: OscillatorType = 'sine', volume = 0.12) {
  try {
    const c = getCtx();
    for (const n of notes) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(n.freq, c.currentTime + n.time);
      gain.gain.setValueAtTime(volume, c.currentTime + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + n.time + n.dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime + n.time);
      osc.stop(c.currentTime + n.time + n.dur);
    }
  } catch {}
}

export function playPlant() {
  playNoise(0.1, 0.06);
  playTone(150, 0.12, 'triangle', 0.1);
}

export function playWater() {
  playTone(600, 0.08, 'sine', 0.08);
  playTone(800, 0.1, 'sine', 0.06);
  playNoise(0.15, 0.04);
}

export function playHatch() {
  playNotes([
    { freq: 523, time: 0, dur: 0.15 },
    { freq: 659, time: 0.1, dur: 0.15 },
    { freq: 784, time: 0.2, dur: 0.25 },
  ], 'sine', 0.12);
}

export function playCoin() {
  playTone(1200, 0.08, 'sine', 0.06);
  playTone(1800, 0.12, 'sine', 0.04);
}

export function playDiscovery() {
  playNotes([
    { freq: 523, time: 0, dur: 0.15 },
    { freq: 659, time: 0.12, dur: 0.15 },
    { freq: 784, time: 0.24, dur: 0.15 },
    { freq: 1047, time: 0.36, dur: 0.3 },
  ], 'sine', 0.12);
}

export function playComplete() {
  playNotes([
    { freq: 523, time: 0, dur: 0.2 },
    { freq: 659, time: 0.15, dur: 0.2 },
    { freq: 784, time: 0.3, dur: 0.2 },
    { freq: 1047, time: 0.45, dur: 0.3 },
    { freq: 1319, time: 0.6, dur: 0.4 },
  ], 'sine', 0.15);
  playNotes([
    { freq: 1047, time: 0.7, dur: 0.2 },
    { freq: 1319, time: 0.85, dur: 0.2 },
    { freq: 1568, time: 1.0, dur: 0.5 },
  ], 'triangle', 0.1);
}

export function playPurchase() {
  playTone(440, 0.06, 'triangle', 0.08);
  playTone(660, 0.08, 'triangle', 0.06);
}

export function playWelcome() {
  playNotes([
    { freq: 440, time: 0, dur: 0.12 },
    { freq: 554, time: 0.1, dur: 0.12 },
    { freq: 659, time: 0.2, dur: 0.2 },
  ], 'sine', 0.08);
}
