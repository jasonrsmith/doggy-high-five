'use strict';
// ───────────────────────── Doggy High Five: dog brain ─────────────────────────
// The partner genuinely wants the high five. It drives the exact same wobbly
// body you do (lean / paw / slap), just with dog-grade judgement.

class Brain {
  constructor(dog, other, ai) {
    this.d = dog; this.o = other; this.ai = ai || dog.b.ai;
    this.s = 'idle'; this.t = 0; this.dur = rnd(0.5, 1.1);
    this.hist = []; this.ready = 0; this.react = rnd(this.ai.react[0], this.ai.react[1]);
    this.blindA = 1.8; this.nextSwing = 1.2; this.fails = 0; this.seed = rnd(100);
    this.barkT = 0; this.sawSq = false; this.sqGone = 0; this.sneezed = false; this.reBlind = false;
  }

  set(s, dur = 0) { this.s = s; this.t = 0; this.dur = dur; this.ready = 0; this.sneezed = false; }
  idle(extra = 0) { this.set('idle', rnd(this.ai.idle[0], this.ai.idle[1]) + extra); }
  boop() { this.set('booped'); }

  lookAt(p) {
    const d = this.d;
    return clamp(Math.atan2(d.head.y - p.y, d.dir * d.headDir * (p.x - d.head.x)), -0.7, 1.2);
  }

  update(dt, world) {
    const d = this.d, o = this.o, ai = this.ai, inp = d.inp;
    inp.lean = 0; inp.paw = -0.4; inp.slap = false; inp.hop = false;
    d.cock = 0; d.bowT = 0; d.spin = 1; d.headDir = 1;
    this.t += dt;
    this.hist.push(world.time, o.paw.x, o.paw.y);
    if (this.hist.length > 300) this.hist.splice(0, 3);
    d.faceT = this.lookAt(o.head);
    d.excite = lerp(d.excite, 0.35, dt);
    if (this.s === 'wait') return;
    if (d.state !== 'ok') { if (this.s !== 'fallen') this.set('fallen'); d.mood = 'derp'; return; }

    if (world.squirrel) {
      this.sqGone = 0;
      if (!this.sawSq) {
        this.sawSq = true;
        if (rnd() < ai.squirrel && this.s !== 'celebrate') { this.set('squirrel'); d.say('SQUIRREL!!', 1.5); d.ev.push('bark'); }
      }
    } else { this.sawSq = false; this.sqGone += dt; }

    switch (this.s) {
      case 'fallen': d.mood = 'happy'; this.fails++; this.over = false; this.idle(0.3); break;
      case 'idle':
        d.mood = 'happy';
        if (o.offering) this.t += dt * 1.5;                 // "oh!! you're doing it!!"
        if (this.t > this.dur) {
          if (rnd() < ai.quirk && !o.offering) this.quirk();
          else this.set('wiggle', rnd(0.45, 0.8));
        }
        break;
      case 'wiggle':                                         // the tell: butt up, tail going
        d.bowT = 1; d.mood = 'eager'; d.excite = lerp(d.excite, 1, dt * 5);
        if (this.t > this.dur) { this.set('up'); this.over = rnd() < (ai.flop || 0); d.ev.push('boof'); }
        break;
      case 'up':
        inp.lean = this.balance(world); d.mood = 'eager';
        if (d.th > 0.95) {
          this.set('offer', rnd(ai.offer[0], ai.offer[1]));
          this.blindA = rnd(1.25, 2.45); this.nextSwing = rnd(1.1, 1.6);
        } else if (this.t > 2) this.idle();
        break;
      case 'offer': this.offer(dt, world); break;
      case 'down':
        inp.lean = -0.7; inp.paw = -1;
        if (d.th < 0.08) this.idle();
        break;
      case 'squirrel': {
        const sq = world.squirrel;
        inp.lean = -1; inp.paw = -1; d.mood = 'alert'; d.excite = 1;
        if (sq) {
          d.headDir = d.dir * (sq.x - d.head.x) < 0 ? -1 : 1;
          d.faceT = this.lookAt(sq);
          this.barkT -= dt;
          if (this.barkT <= 0) { this.barkT = rnd(0.35, 0.6); d.ev.push('bark'); }
        } else if (this.sqGone > 0.4) this.idle(0.2);
        break;
      }
      case 'booped':
        d.mood = 'squint'; inp.lean = -1; inp.paw = -1;
        if (this.t > 0.3 && !this.sneezed) { this.sneezed = true; d.say('ACHOO!', 0.8); d.ev.push('sneeze'); }
        if (this.t > 1.1) this.idle();
        break;
      case 'celebrate':
        d.excite = 1; d.mood = 'joy'; inp.lean = -0.5; inp.paw = -1;
        if (d.th < 0.1) d.bowT = Math.sin(this.t * 9) > 0 ? 1 : 0;
        break;
      case 'spin':                                           // tail. TAIL. get the tail
        d.spin = Math.floor(this.t / 0.13) % 2 ? -1 : 1; d.mood = 'derp';
        if (this.t > this.dur) this.idle();
        break;
      case 'shake':                                          // wrong trick, buddy
        inp.paw = clamp(7 * (1.35 - d.al) - 0.9 * d.alv, -1, 1);
        if (this.t > this.dur) this.idle();
        break;
      case 'bork': if (this.t > this.dur) this.idle(0); break;
      case 'snub':
        d.headDir = -1; d.faceT = 0.4; d.mood = 'snooty';
        if (this.t > this.dur) this.idle();
        break;
      case 'zoom': {
        const k = clamp(this.t / this.dur, 0, 1);
        d.xo = -d.dir * 430 * Math.sin(Math.PI * k); d.walk = 1; d.spin = k < 0.5 ? -1 : 1; d.excite = 1; d.mood = 'joy';
        if (k >= 1) { d.xo = 0; d.walk = 0; this.idle(); }
        break;
      }
    }
  }

  quirk() {
    const d = this.d, qs = this.ai.quirks, q = qs[Math.floor(rnd(qs.length))];
    if (q === 'spin') { this.set('spin', rnd(0.9, 1.4)); d.say('?!', 1); d.ev.push('whine'); }
    else if (q === 'shake') { this.set('shake', rnd(1.6, 2.2)); d.say('shake?', 1.6); }
    else if (q === 'bork') { this.set('bork', 0.7); d.say('BORK', 0.7); d.ev.push('bark'); }
    else if (q === 'snub') { this.set('snub', rnd(1.4, 2)); d.say('. . .', 1.4); }
    else if (q === 'zoom') { this.set('zoom', 1.5); d.say('ZOOMIES', 1.2); d.ev.push('bark'); }
  }

  balance(world) {
    const d = this.d;
    if (d.th < 0.95) return d.th < 0.6 ? 1 : 0.7;
    if (this.over) return 1;                                 // too much enthusiasm, not enough brakes
    const n = noise(world.time * 2.3 + this.seed) * this.ai.wob * 0.14;
    return clamp(5 * (TH0 + n - d.th) - 1.1 * d.om, -1, 1);
  }

  aim(world) {
    const d = this.d, o = this.o, ai = this.ai, b = d.b;
    if (ai.aim === 'blind') {
      return { x: d.sh.x + d.dir * b.armL * Math.sin(this.blindA), y: d.sh.y + b.armL * Math.cos(this.blindA) };
    }
    const pa = (ai.pose || 2.0) + (o.offering ? 0 : 0.25 * Math.sin(world.time * 6));   // "c'mon!" wave
    const def = { x: d.sh.x + d.dir * b.armL * 0.62 * Math.sin(pa), y: d.sh.y + b.armL * 0.62 * Math.cos(pa) };
    if (!o.offering) return def;
    // aim at where their paw was a moment ago, give or take
    const tt = world.time - ai.lag;
    let i = this.hist.length - 3;
    while (i > 0 && this.hist[i] > tt) i -= 3;
    const tp = {
      x: this.hist[i + 1] + noise(world.time * 1.3 + this.seed) * ai.err,
      y: this.hist[i + 2] + noise(world.time * 1.7 + this.seed * 2) * ai.err,
    };
    if (ai.aim === 'fixed') {                               // condescends, eventually, mostly
      const k = clamp((this.t - 1.5) / 3, 0, 0.85);
      tp.x = lerp(def.x, tp.x, k); tp.y = lerp(def.y, tp.y, k);
    }
    return tp;
  }

  offer(dt, world) {
    const d = this.d, o = this.o, ai = this.ai, inp = d.inp, b = d.b;
    inp.lean = this.balance(world);
    if (ai.aim === 'hop') inp.hop = d.th > 0.8;
    d.excite = lerp(d.excite, o.offering ? 1 : 0.6, dt * 3);
    d.mood = 'eager';
    const tp = this.aim(world);
    const vx = tp.x - d.sh.x, vy = tp.y - d.sh.y;
    const want = clamp(Math.atan2(d.dir * vx, vy), 0.35, 2.85);
    inp.paw = clamp(7 * (want - d.al) - 0.9 * d.alv, -1, 1);
    d.faceT = this.lookAt(o.offering ? o.paw : d.paw);

    let go = false;
    if (ai.aim === 'blind') {
      if (this.t > this.nextSwing - 0.5) d.cock = 1;
      if (this.t > this.nextSwing) { go = true; this.nextSwing = this.t + rnd(1.3, 1.8); this.reBlind = true; }
      else if (this.reBlind && d.slapT <= 0 && d.slapCd < 0.3) { this.reBlind = false; this.blindA = rnd(1.25, 2.45); }
    } else {
      // would a slap along my current paw line actually land on their paw?
      const rx = o.paw.x - d.sh.x, ry = o.paw.y - d.sh.y, ds = Math.hypot(rx, ry);
      const real = Math.atan2(d.dir * rx, ry);
      const ok = o.offering && Math.abs(real - d.al) < 0.2 && ds < b.armL + b.pawR + o.b.pawR - 3 && ds > b.armL * 0.45;
      this.ready = ok ? this.ready + dt : Math.max(0, this.ready - dt * 2);
      if (this.ready > 0.02) d.cock = 1;
      if (this.ready > this.react) { go = true; this.ready = 0; this.react = rnd(ai.react[0], ai.react[1]); }
      if (!o.offering && this.t > this.nextSwing) {          // impatient practice swing at nothing
        go = true; this.nextSwing = this.t + rnd(1.6, 2.6);
        if (rnd() < 0.5) d.say('?', 0.8);
      }
    }
    if (go && d.slapCd <= 0) inp.slap = true;
    if (this.t > this.dur || d.tired > 0 || d.th < 0.5) {
      this.fails++; d.mood = 'sad';
      if (rnd() < 0.35) d.ev.push('whine');
      this.set('down');
    }
  }
}
