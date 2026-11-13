// Effetti sonori delle animazioni, generati al volo con la Web Audio API (nessun file da scaricare).
// I browser permettono l'audio solo dopo un'interazione: il contesto si sblocca al primo click o tasto.

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let noise: AudioBuffer | null = null;
const MASTER_VOLUME = 0.32;

const getCtx = (): Ctx | null => {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};

export const unlockAudio = () => {
  const unlock = () => {
    getCtx();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
};

const noiseBuffer = (c: Ctx) => {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
};

interface ToneOpts { type?: OscillatorType; gain?: number; to?: number; attack?: number }
interface NoiseOpts { filter?: BiquadFilterType; freq?: number; to?: number; q?: number; gain?: number; attack?: number }

// Ogni suono ha il suo volume generale: fermarlo (salto dell'intro) lo sfuma in un attimo
const createSound = (c: Ctx) => {
  const out = c.createGain();
  out.gain.value = MASTER_VOLUME;
  out.connect(c.destination);
  const t0 = c.currentTime + 0.03;

  const envelope = (start: number, dur: number, peak: number, attack: number) => {
    const g = c.createGain();
    const s = t0 + start;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(peak, s + Math.max(0.005, attack));
    g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    g.connect(out);
    return g;
  };

  const tone = (freq: number, start: number, dur: number, { type = 'sine', gain = 0.3, to, attack = 0.01 }: ToneOpts = {}) => {
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0 + start);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + start + dur);
    osc.connect(envelope(start, dur, gain, attack));
    osc.start(t0 + start);
    osc.stop(t0 + start + dur + 0.05);
  };

  const hiss = (start: number, dur: number, { filter = 'bandpass', freq = 1000, to, q = 1, gain = 0.3, attack = 0.01 }: NoiseOpts = {}) => {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = filter;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t0 + start);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + start + dur);
    src.connect(f);
    f.connect(envelope(start, dur, gain, attack));
    src.start(t0 + start);
    src.stop(t0 + start + dur + 0.05);
  };

  const stop = () => {
    const now = c.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.linearRampToValueAtTime(0, now + 0.15);
    window.setTimeout(() => out.disconnect(), 400);
  };

  return { tone, hiss, stop };
};

const play = (compose: (s: ReturnType<typeof createSound>) => void) => {
  const c = getCtx();
  if (!c) return () => {};
  const sound = createSound(c);
  compose(sound);
  return sound.stop;
};

// Gemme dell'Infinito: sei scie che arrivano al centro, ognuna con la sua nota, poi l'esplosione di luce
export const playInfinitySound = () => play(({ tone, hiss }) => {
  hiss(0, 1.6, { freq: 300, to: 3000, q: 0.8, gain: 0.12, attack: 0.9 });
  [523.25, 659.25, 783.99, 880, 1046.5, 1318.5].forEach((f, i) => {
    tone(f, 0.95 + i * 0.12, 1.3, { type: 'triangle', gain: 0.1, attack: 0.02 });
  });
  tone(70, 1.55, 2.2, { type: 'sine', gain: 0.55, to: 38, attack: 0.02 });
  hiss(1.55, 1.4, { filter: 'lowpass', freq: 2500, to: 200, gain: 0.3, attack: 0.01 });
  [261.63, 392, 523.25, 659.25].forEach(f => tone(f, 1.6, 2.3, { type: 'sawtooth', gain: 0.035, attack: 0.25 }));
  tone(1567.98, 1.75, 1.6, { type: 'sine', gain: 0.07, attack: 0.05 });
});

// L'Osservatore: un bordone cupo, gli occhi che si accendono e il bagliore che riempie lo schermo
export const playWatcherSound = () => play(({ tone, hiss }) => {
  tone(55, 0, 3.4, { type: 'sawtooth', gain: 0.07, attack: 1.2 });
  tone(82.4, 0.1, 3.2, { type: 'sine', gain: 0.2, attack: 1 });
  tone(659.25, 1.0, 0.9, { type: 'sine', gain: 0.08, attack: 0.08 });
  tone(987.77, 1.05, 0.9, { type: 'sine', gain: 0.05, attack: 0.08 });
  hiss(1.6, 1.25, { freq: 400, to: 6000, q: 1.2, gain: 0.22, attack: 1.1 });
  tone(220, 1.7, 1.15, { type: 'triangle', gain: 0.1, to: 880, attack: 1 });
  tone(1318.5, 2.8, 0.8, { type: 'sine', gain: 0.14, attack: 0.01 });
  tone(1975.5, 2.8, 0.7, { type: 'sine', gain: 0.07, attack: 0.01 });
  hiss(2.8, 0.7, { filter: 'highpass', freq: 5000, gain: 0.08, attack: 0.01 });
});

// Daily Bugle: i giornali che sbattono sul tavolo, il timbro della testata, la ragnatela e lo strappo
export const playBugleSound = () => play(({ tone, hiss }) => {
  for (let i = 0; i < 14; i++) {
    const at = i * 0.07 + 0.2;
    hiss(at, 0.09, { freq: 900 + (i % 4) * 250, q: 0.7, gain: 0.22, attack: 0.003 });
    tone(140 - (i % 3) * 15, at, 0.08, { type: 'sine', gain: 0.18, to: 70, attack: 0.003 });
  }
  tone(90, 1.15, 0.35, { type: 'square', gain: 0.12, to: 45, attack: 0.003 });
  hiss(1.15, 0.25, { filter: 'lowpass', freq: 1800, to: 300, gain: 0.4, attack: 0.003 });
  hiss(1.75, 0.22, { freq: 5000, to: 1200, q: 3, gain: 0.3, attack: 0.005 });
  tone(1800, 1.75, 0.18, { type: 'sine', gain: 0.06, to: 500, attack: 0.005 });
  hiss(2.35, 0.55, { freq: 300, to: 4000, q: 0.8, gain: 0.25, attack: 0.25 });
});

// J.A.I.R.V.I.S.: accensione dei sistemi, un bip per ogni passaggio e il segnale di "online"
export const playJairvisSound = () => play(({ tone, hiss }) => {
  tone(110, 0, 2.7, { type: 'sine', gain: 0.12, to: 440, attack: 0.6 });
  hiss(0, 2.6, { freq: 600, to: 2400, q: 6, gain: 0.05, attack: 1 });
  [0.2, 1.0, 1.8].forEach((at, i) => {
    tone(880 * Math.pow(1.25, i), at, 0.09, { type: 'square', gain: 0.05, attack: 0.003 });
    tone(1320 * Math.pow(1.25, i), at + 0.1, 0.09, { type: 'square', gain: 0.04, attack: 0.003 });
  });
  [587.33, 880, 1174.66].forEach((f, i) => tone(f, 2.55 + i * 0.08, 0.7, { type: 'sine', gain: 0.1, attack: 0.01 }));
});
