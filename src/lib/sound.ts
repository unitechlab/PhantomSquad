// Web Audio tones generated at runtime; no audio files. Muted by default (see store).
let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  ctx ??= new AudioContext();
  return ctx;
}

/** Browsers keep audio locked until the page gets a click or key press. Call this from such an event. */
export function unlockAudio(): void {
  const c = context();
  if (c && c.state !== 'running') void c.resume();
}

function tone(freq: number, start: number, duration: number, type: OscillatorType, gain: number): void {
  const c = context();
  if (!c) return;
  const play = (): void => {
    const osc = c.createOscillator();
    const amp = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = c.currentTime + start;
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(gain, t0 + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(amp).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  };
  // A suspended context has a frozen clock, so wait until it runs; otherwise the sound is lost.
  if (c.state === 'running') play();
  else void c.resume().then(play, () => undefined);
}
/** C5-E5-G5 arpeggio. */
export function playChime(): void {
  [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.12, 0.3, 'sine', 0.15));
}

export function playWhoosh(): void {
  tone(220, 0, 0.25, 'triangle', 0.08);
  tone(440, 0.05, 0.2, 'triangle', 0.05);
}

/** Short low pulse. Not looped: the guidelines require a stop on resolution, so one pulse per event. */
export function playAlert(): void {
  tone(80, 0, 0.45, 'sawtooth', 0.1);
}
/** Soft click for one game day passing. */
export function playTick(): void {
  tone(660, 0, 0.08, 'square', 0.05);
}

/** Rising two-note cue when training starts. */
export function playTrain(): void {
  tone(330, 0, 0.15, 'triangle', 0.09);
  tone(494, 0.1, 0.25, 'triangle', 0.09);
}

/** Short bright blip for buttons. */
export function playClick(): void {
  tone(880, 0, 0.07, 'sine', 0.06);
}

/** Goal reached: rising fanfare. */
export function playWin(): void {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.14, 0.4, 'sine', 0.16));
}

/** Bankrupt or out of time: falling notes. */
export function playLose(): void {
  [392, 311.13, 233.08].forEach((f, i) => tone(f, i * 0.2, 0.45, 'sawtooth', 0.08));
}


/** Combo chime: the same arpeggio shifted up one whole step per combo level. */
export function playCombo(step: number): void {
  const ratio = 2 ** ((Math.max(1, Math.min(step, 5)) * 2) / 12);
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f * ratio, i * 0.07, 0.22, 'triangle', 0.12));
}

/** Milestone: short bright fanfare. */
export function playMilestone(): void {
  [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => tone(f, i * 0.09, 0.3, 'sine', 0.14));
}

/** Full Moon: soft rising sweep. */
export function playMoon(): void {
  tone(220, 0, 0.5, 'sine', 0.1);
  tone(330, 0.15, 0.5, 'sine', 0.08);
  tone(440, 0.3, 0.5, 'sine', 0.06);
}

/** Ghost glitch: short buzz. */
export function playGlitch(): void {
  tone(140, 0, 0.12, 'sawtooth', 0.08);
  tone(110, 0.14, 0.18, 'square', 0.06);
}

/** Sponsor: coin sparkle. */
export function playCoins(): void {
  [1318.5, 1568, 2093].forEach((f, i) => tone(f, i * 0.06, 0.12, 'square', 0.04));
}

/** Quest start: a quick rising three-note call. */
export function playStart(): void {
  [440, 587.33, 880].forEach((f, i) => tone(f, i * 0.08, 0.2, 'triangle', 0.11));
}
