'use strict';
// ───────────────────────── Doggy High Five: tiny synth ─────────────────────────
const SFX = {
  ctx: null, out: null, muted: false,
  init() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC(); this.out = this.ctx.createGain(); this.out.gain.value = 0.45; this.out.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { this.ctx = null; }
  },
  tone(f0, f1, dur, type = 'square', vol = 0.2, delay = 0) {
    if (!this.ctx || this.muted || this.quiet) return;
    const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.03);
  },
  hiss(dur, freq, q = 1, vol = 0.3, delay = 0, f1 = 0) {
    if (!this.ctx || this.muted || this.quiet) return;
    const c = this.ctx, t = c.currentTime + delay, n = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.out); s.start(t);
  },
  bark(p = 1, vol = 0.22) { this.tone(560 * p, 250 * p, 0.1, 'sawtooth', vol); this.hiss(0.08, 1500 * p, 1, vol); },
  boof(p = 1) { this.tone(300 * p, 170 * p, 0.09, 'sawtooth', 0.14); },
  whine(p = 1) { this.tone(650 * p, 1050 * p, 0.16, 'sine', 0.13); this.tone(1050 * p, 560 * p, 0.24, 'sine', 0.13, 0.16); },
  sneeze() { this.hiss(0.2, 2600, 0.6, 0.35, 0, 900); this.tone(900, 400, 0.1, 'triangle', 0.12); },
  whoosh() { this.hiss(0.16, 500, 0.9, 0.22, 0, 2200); },
  slap(k = 1) { this.hiss(0.14, 2400, 0.6, 0.9 * k); this.tone(210, 55, 0.16, 'sine', 0.6 * k); },
  boop() { this.tone(900, 420, 0.13, 'sine', 0.35); this.tone(1350, 620, 0.1, 'triangle', 0.12, 0.02); },
  thump() { this.tone(130, 45, 0.14, 'sine', 0.4); },
  flop() { this.tone(420, 70, 0.4, 'triangle', 0.3); this.hiss(0.12, 300, 0.7, 0.4, 0.36); this.tone(90, 40, 0.18, 'sine', 0.5, 0.36); },
  hop() { this.tone(380, 760, 0.09, 'square', 0.06); },
  nope() { this.tone(300, 200, 0.14, 'square', 0.1); this.tone(220, 150, 0.2, 'square', 0.1, 0.14); },
  chitter() { for (let i = 0; i < 6; i++) this.tone(2300 + (i % 2) * 500, 1900, 0.04, 'square', 0.05, i * 0.055); },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => { this.tone(f, f, 0.16, 'square', 0.12, i * 0.09); this.tone(f * 2, f * 2, 0.16, 'triangle', 0.08, i * 0.09); }); },
  win() { this.quiet = false; [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, f, i === 7 ? 0.6 : 0.14, 'square', 0.12, i * 0.13)); },
};
