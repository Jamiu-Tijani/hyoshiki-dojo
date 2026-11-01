/* Synthesised sound effects with the Web Audio API: no audio files to download.
   Audio only starts after a user gesture (the Drive button), as browsers require. */

type Ctor = typeof AudioContext;
let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean): void {
  muted = m;
}

function audio(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    const C: Ctor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Two-tone car horn, roughly 0.4 s. */
export function horn(): void {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  for (const f of [415, 330]) {
    const o = c.createOscillator();
    o.type = "square";
    o.frequency.value = f;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.02);
    g.gain.setValueAtTime(0.06, t + 0.32);
    g.gain.linearRampToValueAtTime(0, t + 0.4);
    o.connect(lp).connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.42);
  }
}

export interface Hum {
  setSpeed(kmh: number): void;
  stop(): void;
}

/** Low engine hum whose pitch follows speed. */
export function engineHum(kmh: number): Hum {
  const c = audio();
  if (!c) return { setSpeed() {}, stop() {} };
  const o = c.createOscillator();
  o.type = "sawtooth";
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  const g = c.createGain();
  g.gain.value = 0;
  o.connect(lp).connect(g).connect(c.destination);
  const pitch = (v: number) => 38 + v * 1.3;
  o.frequency.value = pitch(kmh);
  o.start();
  g.gain.linearRampToValueAtTime(0.035, c.currentTime + 0.15);
  let stopped = false;
  return {
    setSpeed(v: number) {
      if (!stopped) o.frequency.setTargetAtTime(pitch(v), c.currentTime, 0.08);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      const t = c.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 0.25);
      o.stop(t + 0.3);
    },
  };
}
