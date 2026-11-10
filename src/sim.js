'use strict';
// ───────────────────────── Doggy High Five: simulation ─────────────────────────
// Pure logic, no DOM. Every dog (you included) is the same wobbly machine:
// an inverted pendulum on hind legs with one floppy paw.

const W = 960, H = 540, GROUND = 440, PX = 392;
const TH0 = 1.43; // the (unstable) angle where a dog balances upright
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const noise = (t) => (Math.sin(t * 1.7) + 0.6 * Math.sin(t * 2.9 + 1.3) + 0.35 * Math.sin(t * 5.3 + 4.1)) / 1.95;

const BREEDS = {
  you: {
    name: 'YOU', kind: 'Very Good Mutt',
    hipH: 70, bodyL: 95, armL: 100, thick: 54, headR: 29, snout: 27, neck: 30, pawR: 13,
    standTime: 7.5, assist: 1.0, wobble: 1,
    fur: '#cf8848', belly: '#f6e3c5', dark: '#7a4a22', earC: '#8f5a2c', ear: 'flop', tail: 'curl', collar: '#e2413d',
  },
  biscuit: {
    name: 'BISCUIT', kind: 'Golden Retriever', quip: 'Has done this before. Believes in you.',
    hipH: 74, bodyL: 100, armL: 102, thick: 58, headR: 30, snout: 30, neck: 30, pawR: 14,
    standTime: 8.5, assist: 1.2, wobble: 0.8,
    fur: '#ecb858', belly: '#f9e6b4', dark: '#9a6a22', earC: '#c98f3a', ear: 'flop', tail: 'plume', collar: '#3d7be2',
    ai: { idle: [0.7, 1.5], offer: [3.4, 4.6], react: [0.2, 0.36], lag: 0.12, err: 6, wob: 0.3, aim: 'track', quirk: 0.14, quirks: ['bork', 'shake'], squirrel: 0.55, flop: 0.05 },
  },
  pickle: {
    name: 'PICKLE', kind: 'Corgi', quip: 'Legally this is a low five. He is doing his best.',
    hipH: 30, bodyL: 92, armL: 54, thick: 52, headR: 28, snout: 25, neck: 20, pawR: 11,
    standTime: 5.5, assist: 0.95, wobble: 1.2,
    fur: '#e8923a', belly: '#fff5e3', dark: '#9a5a1c', earC: '#e8923a', ear: 'point', tail: 'nub', collar: '#2fae6b',
    ai: { idle: [0.6, 1.3], offer: [2.4, 3.3], react: [0.18, 0.32], lag: 0.18, err: 9, wob: 0.6, aim: 'track', quirk: 0.28, quirks: ['spin', 'shake', 'bork'], squirrel: 0.75, flop: 0.16 },
  },
  duchess: {
    name: 'DUCHESS', kind: 'Great Dane', quip: 'Will not be bending down for you.',
    hipH: 104, bodyL: 132, armL: 130, thick: 60, headR: 33, snout: 40, neck: 44, pawR: 17,
    standTime: 9.5, assist: 1.25, wobble: 0.6,
    fur: '#8b92a3', belly: '#c5cad4', dark: '#4b5160', earC: '#6d7485', ear: 'point', tail: 'whip', collar: '#b98be8',
    ai: { idle: [1.4, 2.4], offer: [4.5, 6], react: [0.45, 0.7], lag: 0.45, err: 5, wob: 0.2, aim: 'fixed', pose: 2.15, quirk: 0.22, quirks: ['snub'], squirrel: 0.15, flop: 0.03 },
  },
  nacho: {
    name: 'NACHO', kind: 'Chihuahua', quip: 'Six pounds of pure voltage.',
    hipH: 24, bodyL: 44, armL: 38, thick: 29, headR: 20, snout: 13, neck: 12, pawR: 8,
    standTime: 6, assist: 1.4, wobble: 1.6, hopV: 545, shiver: 1,
    fur: '#e9c791', belly: '#fbf0d8', dark: '#8a6a3a', earC: '#d9a86a', ear: 'bat', tail: 'whip', collar: '#ff5fa2',
    ai: { idle: [0.3, 0.8], offer: [1.8, 2.6], react: [0.06, 0.14], lag: 0.05, err: 16, wob: 1.0, aim: 'hop', quirk: 0.45, quirks: ['zoom', 'spin', 'bork'], squirrel: 0.9, flop: 0.1 },
  },
  moose: {
    name: 'MOOSE', kind: 'Old English Sheepdog', quip: 'Cannot see you. Believes anyway.',
    hipH: 78, bodyL: 104, armL: 106, thick: 72, headR: 35, snout: 22, neck: 26, pawR: 17,
    standTime: 7.5, assist: 1.05, wobble: 1.1, shag: 1,
    fur: '#f3f3f0', belly: '#ffffff', dark: '#7d8490', earC: '#9aa0ab', ear: 'shag', tail: 'nub', collar: '#f2a03d',
    ai: { idle: [0.8, 1.6], offer: [3.6, 4.6], react: [0.3, 0.5], lag: 0, err: 0, wob: 0.7, aim: 'blind', quirk: 0.18, quirks: ['spin', 'bork'], squirrel: 0.1, flop: 0.14 },
  },
};
const ORDER = ['biscuit', 'pickle', 'duchess', 'nacho', 'moose'];

// Where a partner stands so that two upright dogs can *just* reach each other.
function partnerX(pb, yb = BREEDS.you) {
  return PX + 0.14 * (pb.bodyL + yb.bodyL) + 0.72 * (pb.armL + yb.armL);
}

class Dog {
  constructor(key, dir, x) {
    this.key = key; this.b = BREEDS[key]; this.dir = dir; this.x = x;
    this.shift = this.b.bodyL + 12;       // hips tuck this far forward when rearing up
    this.th = 0; this.om = 0;             // body pitch (0 = all fours, TH0 = upright) + velocity
    this.al = 0; this.alv = 0;            // paw angle (0 = hanging, PI = straight up) + velocity
    this.ext = 0.62; this.extv = 0;       // arm extension (slap = 1)
    this.slapT = 0; this.slapCd = 0; this.cock = 0;
    this.jy = 0; this.jv = 0;             // hop
    this.stam = 1; this.tired = 0; this.stun = 0; this.focus = 1;
    this.state = 'ok'; this.st = 0;       // ok | flop | getup
    this.bow = 0; this.bowT = 0;          // play bow
    this.xo = 0; this.walk = 0; this.wph = 0; this.spin = 1;
    this.wag = rnd(6); this.excite = 0.3;
    this.earA = 0; this.earV = 0; this.dang = 0; this.dangV = 0;
    this.faceA = 0.1; this.faceT = 0.1; this.headDir = 1;
    this.mood = 'happy'; this.blink = rnd(1, 4); this.emote = null;
    this.seed = rnd(100); this.t = 0; this.planted = true;
    this.inp = { lean: 0, paw: 0, slap: false, hop: false };
    this.ev = [];
    this.hip = { x: 0, y: 0 }; this.sh = { x: 0, y: 0 }; this.head = { x: 0, y: 0 };
    this.nose = { x: 0, y: 0 }; this.face = { x: 0, y: 0 }; this.paw = { x: 0, y: 0 }; this.pawV = { x: 0, y: 0 };
    this.pose();
  }

  say(text, t = 1.2) { this.emote = { text, t, max: t }; }

  step(dt) {
    const b = this.b, inp = this.inp;
    this.t += dt; this.slapCd -= dt; this.slapT -= dt; this.stun -= dt; this.tired -= dt;
    const ox = this.paw.x, oy = this.paw.y, oth = this.om;

    if (this.state === 'ok') {
      const standing = this.th > 0.55;
      this.stam = clamp(this.stam + (standing ? -dt / b.standTime : dt / 1.8), 0, 1);
      if (standing && this.stam <= 0 && this.tired <= 0) { this.tired = 1.3; this.ev.push('tired'); }
      let lean = clamp(inp.lean, -1, 1), paw = clamp(inp.paw, -1, 1), slap = inp.slap;
      if (this.tired > 0) { lean = -0.8; paw = -0.5; slap = false; }
      if (this.stun > 0) { lean = 0; paw = 0; slap = false; }

      // ── balance: gravity wants you on all fours (or on your back) ──
      const upT = lerp(17, 5, clamp(this.th / 1.2, 0, 1));
      let acc = -9 * Math.cos(this.th + (Math.PI / 2 - TH0));
      acc += lean > 0 ? lean * upT : lean * 7;
      const e = this.th - TH0;
      if (Math.abs(e) < 0.5 && this.tired <= 0) {   // ankles help a bit... while the legs last
        const a = b.assist * (0.3 + 0.7 * this.stam) * (1 - 0.5 * Math.abs(e) / 0.5);
        acc += a * (-15 * e - 5 * this.om);
      }
      if (this.th > 0.3) acc += (0.6 + 2.0 * this.excite + 2.4 * (1 - this.stam)) * b.wobble * noise(this.t * 3.1 + this.seed);
      if (this.th > 0.5) acc -= 1.3 * Math.sin(this.al) * this.ext;  // a raised paw drags you forward
      acc -= 1.8 * this.om;
      this.om += acc * dt; this.th += this.om * dt;
      if (this.th < 0) {
        if (this.om < -2.2) this.ev.push('thump');
        this.th = 0; this.om = this.om < -2.5 ? -this.om * 0.18 : 0;
      }
      if (this.th > 2.05) { this.state = 'flop'; this.st = 0; this.slapT = 0; this.ev.push('flop'); }

      // ── paw: you can lift it, but it would rather not stay up ──
      const sag = 3.0 * (1.35 - 0.6 * this.stam);
      let pa = paw * 16 * this.focus - sag * Math.sin(this.al) - 4.4 * this.alv;
      pa += 0.9 * noise(this.t * 4.3 + this.seed * 2) * (1 - this.stam + this.excite * 0.5 + (b.shiver || 0));
      this.alv += pa * dt; this.al += this.alv * dt;
      if (this.al < 0) { this.al = 0; this.alv = 0; }
      if (this.al > 2.9) { this.al = 2.9; this.alv = 0; }

      if (slap && this.slapCd <= 0) {
        this.slapT = 0.17; this.slapCd = 0.6;
        if (this.th > 0.5) this.om += 0.3;   // newton says: slap forward, tip backward
        this.ev.push('swing');
      }
      if (inp.hop && this.jy <= 0 && b.hopV) { this.jv = b.hopV; this.ev.push('hop'); }
    } else if (this.state === 'flop') {
      this.st += dt;
      this.om += (40 * (3.0 - this.th) - 9 * this.om) * dt; this.th += this.om * dt;
      this.al += (2.5 + 0.35 * Math.sin(this.t * 13) - this.al) * Math.min(1, dt * 8); this.alv = 0;
      if (this.st > 1.5) { this.state = 'getup'; this.st = 0; this.ev.push('getup'); }
    } else if (this.state === 'getup') {
      this.st += dt;
      const k = clamp(this.st / 0.45, 0, 1);
      this.th = 3.0 * (1 - smooth(k)); this.om = 0; this.al *= 0.9;
      if (k >= 1) { this.state = 'ok'; this.th = 0; this.al = 0; this.stam = Math.max(this.stam, 0.6); this.tired = 0; }
    }

    this.planted = this.state === 'ok' && this.th < 0.14 && this.al < 0.22 && this.jy <= 0;
    const et = this.slapT > 0 ? 1 : this.cock > 0 ? 0.48 : 0.62;
    const k = this.slapT > 0 ? 1100 : 260;
    this.extv += (k * (et - this.ext) - 1.5 * Math.sqrt(k) * this.extv) * dt; this.ext += this.extv * dt;

    if (this.jy > 0 || this.jv > 0) {
      this.jv -= 1500 * dt; this.jy += this.jv * dt;
      if (this.jy <= 0) { this.jy = 0; this.jv = 0; this.ev.push('land'); }
    }

    // secondary motion + face
    this.bow += (this.bowT - this.bow) * Math.min(1, dt * 10);
    this.wag += dt * (5 + 22 * this.excite);
    this.wph += dt * 13 * this.walk;
    const jolt = (this.om - oth) / dt;
    this.earV += (-70 * this.earA - 7 * this.earV - jolt * 0.35 - this.om * 9 + this.jv * 0.03) * dt; this.earA += this.earV * dt;
    this.dangV += (-45 * this.dang - 5 * this.dangV - jolt * 0.3 - this.om * 6) * dt; this.dang += this.dangV * dt;
    this.earA = clamp(this.earA, -1.2, 1.2); this.dang = clamp(this.dang, -1, 1);
    this.faceA += (this.faceT - this.faceA) * Math.min(1, dt * 9);
    this.blink -= dt; if (this.blink < -0.12) this.blink = rnd(1.5, 4.5);
    if (this.emote && (this.emote.t -= dt) <= 0) this.emote = null;

    this.pose();
    this.pawV.x = (this.paw.x - ox) / dt; this.pawV.y = (this.paw.y - oy) / dt;
  }

  pose() {
    const b = this.b, d = this.dir;
    const r = smooth(clamp(this.th / 1.3, 0, 1));            // how reared-up
    const fk = smooth(clamp((this.th - 1.8) / 1.0, 0, 1));   // how flopped-over
    const bob = this.walk * Math.abs(Math.sin(this.wph)) * 4;
    const X = this.x + this.xo;
    const hx = X - d * this.shift * (1 - r) - d * fk * 26;
    const hh = lerp(b.hipH * (1 - 0.1 * r), b.thick * 0.5, fk);
    const hy = GROUND - hh - this.jy - bob;
    const th = this.th - this.bow * 0.42 * (1 - r);
    this.r = r; this.fk = fk; this.pth = th;
    this.hip.x = hx; this.hip.y = hy;
    const sx = hx + d * b.bodyL * Math.cos(th), sy = hy - b.bodyL * Math.sin(th);
    this.sh.x = sx; this.sh.y = sy;
    const ha = th + lerp(0.7, -0.3, r) + this.bow * 0.55;
    this.head.x = sx + d * b.neck * Math.cos(ha); this.head.y = sy - b.neck * Math.sin(ha);
    const hd = d * this.headDir, fa = this.faceA, nl = b.headR * 0.55 + b.snout;
    this.nose.x = this.head.x + hd * nl * Math.cos(fa); this.nose.y = this.head.y - nl * Math.sin(fa);
    this.face.x = (this.head.x + this.nose.x) / 2; this.face.y = (this.head.y + this.nose.y) / 2;
    if (this.planted) {
      this.paw.x = sx + d * 3; this.paw.y = GROUND - b.pawR * 0.45 - (this.jy > 0 ? this.jy : 0);
    } else {
      const len = b.armL * this.ext;
      this.paw.x = sx + d * len * Math.sin(this.al);
      this.paw.y = Math.min(sy + len * Math.cos(this.al), GROUND - b.pawR * 0.45);
    }
  }

  get up() { return this.state === 'ok' && (this.th > 0.75 || this.jy > 12); }
  get offering() { return this.state === 'ok' && this.th > 0.7 && this.al > 0.8 && !this.planted; }
}

// What is touching what, right now?
function contacts(a, b) {
  const out = [];
  if (!a.planted && !b.planted && dist(a.paw, b.paw) < a.b.pawR + b.b.pawR + 2) {
    out.push({
      type: 'paw', x: (a.paw.x + b.paw.x) / 2, y: (a.paw.y + b.paw.y) / 2,
      speed: Math.hypot(a.pawV.x - b.pawV.x, a.pawV.y - b.pawV.y), high: a.up && b.up,
    });
  }
  for (const [p, q] of [[a, b], [b, a]]) {
    if (p.planted || p.state !== 'ok' || q.state !== 'ok') continue;
    const sp = Math.hypot(p.pawV.x, p.pawV.y);
    if (p.slapT > 0 && dist(p.paw, q.face) < p.b.pawR + q.b.headR * 0.8) {   // only a real swing boops
      out.push({ type: 'boop', by: p, on: q, x: q.nose.x, y: q.nose.y, speed: sp });
    }
  }
  return out;
}

const SIM = { W, H, GROUND, PX, TH0, BREEDS, ORDER, Dog, contacts, partnerX, clamp, lerp, smooth, rnd, dist, noise };
if (typeof module !== 'undefined') module.exports = SIM;
