'use strict';
// ───────────────────────── Doggy High Five: rules of the park ─────────────────────────
const G = {
  mode: 'title', time: 0, world: { time: 0, squirrel: null },
  you: null, pal: null, brain: null, auto: null,
  level: 0, done: 0, phase: 'play', pt: 0,
  keys: { back: false, fwd: false, up: false, down: false }, slapQ: false,
  shake: 0, hitstop: 0, cool: 0, sqT: 18, whiffT: 0, hit: false, popCool: 0,
  stats: null, best: null, newBest: false, paused: false, modeT: 0,
};
const pick = (a) => a[Math.floor(rnd(a.length))];
const FLOP_YOU = ['you leaned back like it was a chair', 'gravity: 1, dog: 0', 'belly rubs? no? ok', 'the tail was not a counterweight', 'nailed it (the ground)'];
const FLOP_PAL = ['they have also discovered gravity', 'no notes', 'they meant to do that', 'solidarity'];
const AUTO_AI = { ...BREEDS.biscuit.ai, quirk: 0.08, quirks: ['spin', 'bork'], squirrel: 0 };

function newStats() { return { time: 0, slaps: 0, boops: 0, bonks: 0, flops: 0, shakes: 0, whiffs: 0, squirrels: 0, stars: 0 }; }

function spawnPal(key, walkIn) {
  const b = BREEDS[key], y = G.you;
  const pal = new Dog(key, -1, partnerX(b));
  // nose-to-nose (not nose-through-nose) when both are on all fours
  const reach = (q) => q.bodyL + q.neck * 0.76 + q.headR * 0.75 + q.snout;
  pal.shift = Math.max(20, PX - y.shift + reach(y.b) + 26 + reach(b) - pal.x);
  G.pal = pal; G.brain = new Brain(pal, y);
  if (G.auto) G.auto.o = pal;
  if (walkIn) { pal.xo = W + 50 - (pal.x + pal.shift) + reach(b); pal.walk = 1; G.brain.set('wait'); G.phase = 'enter'; }
  else G.phase = 'play';
  G.pt = 0; G.cool = 0.5; pal.pose();
}

function startTitle() {
  G.mode = 'title'; G.modeT = 0; G.paused = false; FX.clear(); G.world.squirrel = null;
  G.you = new Dog('you', 1, PX); G.auto = null;
  spawnPal(pick(ORDER), false);
  G.auto = new Brain(G.you, G.pal, AUTO_AI);
}

function startGame(level = 0) {
  G.mode = 'play'; G.modeT = 0; G.paused = false; FX.clear(); G.world.squirrel = null;
  G.stats = newStats(); G.level = level; G.done = level; G.newBest = false; G.sqT = rnd(15, 21);
  G.you = new Dog('you', 1, PX); G.auto = null;
  spawnPal(ORDER[level], true);
}

function winGame() {
  G.mode = 'win'; G.modeT = 0; G.world.squirrel = null;
  const t = G.stats.time;
  try {
    const old = parseFloat(localStorage.getItem('dhf-best'));
    if (!(old > 0) || t < old) { localStorage.setItem('dhf-best', String(t)); G.newBest = true; G.best = t; } else G.best = old;
  } catch (e) { G.best = G.best && G.best < t ? G.best : t; }
  FX.confetti(90); SFX.win();
  G.auto = new Brain(G.you, G.pal, AUTO_AI);
  spawnPal(pick(ORDER), true);
}

function dogEvents(d, mine) {
  const p = 25 / d.b.headR, counting = G.mode === 'play' && G.phase === 'play';
  for (const e of d.ev) {
    if (e === 'bark' || e === 'boof' || e === 'whine' || e === 'sneeze') d.yapAt = G.time;   // mouth flies open
    if (e === 'thump') { FX.dust(d.sh.x, GROUND, 4); SFX.thump(); }
    else if (e === 'land') FX.dust(d.hip.x, GROUND, 2);
    else if (e === 'hop') SFX.hop();
    else if (e === 'getup') FX.dust(d.hip.x, GROUND, 4);
    else if (e === 'flop') {
      FX.dust(d.hip.x - d.dir * 40, GROUND, 8); SFX.flop(); G.shake = Math.max(G.shake, 7);
      FX.pop('FLOP!', d.hip.x - d.dir * 30, GROUND - 150, { size: 34, col: '#ff9ecb', sub: pick(mine ? FLOP_YOU : FLOP_PAL) });
      if (mine && counting) G.stats.flops++;
    } else if (e === 'tired') {
      if (mine && !G.auto) FX.pop('LEGS GAVE OUT', d.hip.x, GROUND - 200, { size: 22, col: '#8fd9ff', sub: 'dogs are not built for this' });
      else d.say('phew', 1);
    } else if (e === 'swing') {
      SFX.whoosh();
      if (mine) { if (counting) G.stats.slaps++; G.whiffT = 0.24; G.hit = false; }
    } else if (e === 'bark') SFX.bark(p);
    else if (e === 'boof') SFX.boof(p);
    else if (e === 'whine') SFX.whine(p);
    else if (e === 'sneeze') SFX.sneeze();
  }
  d.ev.length = 0;
}

function highFive(c) {
  const you = G.you, pal = G.pal;
  const stars = c.speed > 520 ? 3 : c.speed > 260 ? 2 : 1;
  G.cool = 3; G.phase = 'celebrate'; G.pt = 0; G.hit = true;
  G.hitstop = 0.16; G.shake = 6 + stars * 5;
  FX.flash(c.x, c.y); FX.ring(c.x, c.y, '#fff', 110 + stars * 30); FX.ring(c.x, c.y, '#ffe066', 70);
  FX.burst(c.x, c.y, 12 + stars * 10); FX.hearts(c.x, c.y - 20, 3 + stars);
  FX.pop('HIGH FIVE!', W / 2, 124, {
    size: 44, col: '#ffd23f', life: 2.1, rot: -0.05,
    sub: ['a gentle, tender pat. it counts.', 'solid. textbook. two good dogs.', 'THUNDERCLAP. the whole park felt that.'][stars - 1],
  });
  SFX.slap(0.5 + stars * 0.25); SFX.fanfare(); SFX.bark(25 / pal.b.headR, 0.15);
  you.om += 0.9 + stars * 0.5; pal.om += 0.9 + stars * 0.5;   // equal and opposite dogs
  you.excite = pal.excite = 1;
  G.brain.set('celebrate'); if (G.auto) G.auto.set('celebrate');
  if (G.mode === 'play') { G.done++; G.stats.stars += stars; G.lastStars = stars; }
}

function handleContacts() {
  const you = G.you, pal = G.pal, st = G.stats, playing = G.mode === 'play';
  if (G.cool > 0) return;
  for (const c of contacts(you, pal)) {
    G.hit = true;
    if (c.type === 'paw') {
      if (c.high) return highFive(c);
      G.cool = 1.6; if (playing) st.shakes++;
      FX.pop('HANDSHAKE', c.x, c.y - 44, { size: 26, col: '#cfe8ff', sub: 'very professional. does not count.' });
      SFX.nope(); pal.say('?', 0.9);
    } else if (c.by === you) {
      G.cool = 0.9; if (playing) st.boops++;
      G.brain.boop(); if (pal.th > 0.5) pal.om += 1.3;
      FX.ring(c.x, c.y, '#ff9ecb', 60); FX.pop('BOOP!', c.x, c.y - 46, { size: 34, col: '#ff9ecb', sub: 'that was their face' });
      SFX.boop(); G.shake = Math.max(G.shake, 5);
    } else {
      G.cool = 0.9; if (playing) st.bonks++;
      you.stun = 0.7; if (you.th > 0.5) you.om += 1.5;
      if (G.auto) G.auto.boop();
      FX.ring(c.x, c.y, '#ffe066', 60); FX.pop('BONK!', c.x, c.y - 46, { size: 34, col: '#ffe066', sub: 'right on your snoot' });
      SFX.boop(); G.shake = Math.max(G.shake, 8);
    }
    return;
  }
}

function simStep(dt) {
  const you = G.you, pal = G.pal, w = G.world, playing = G.mode === 'play';
  w.time += dt; G.cool -= dt; G.pt += dt; G.popCool -= dt;
  SFX.quiet = !playing;

  // ── your brain (it is a dog brain; the keys are more of a suggestion) ──
  if (G.auto) G.auto.update(dt, w);
  else {
    const k = G.keys, inp = you.inp, live = G.phase !== 'celebrate', sq = w.squirrel;
    inp.lean = live ? (k.back ? 1 : 0) - (k.fwd ? 1 : 0) : -0.5;
    inp.paw = live ? (k.up ? 1 : 0) - (k.down ? 1 : 0) : -1;
    inp.slap = live && G.slapQ;
    const hype = G.brain.s === 'wiggle' || G.brain.s === 'up' || G.brain.s === 'offer';
    you.excite = lerp(you.excite, live ? (hype ? 0.85 : 0.3) : 1, dt * 2.5);
    you.focus = sq ? 0.4 : 1;
    const tgt = sq || (pal.offering ? pal.paw : pal.head);
    you.faceT = clamp(Math.atan2(you.head.y - tgt.y, tgt.x - you.head.x), -0.7, 1.2);
    you.mood = you.state !== 'ok' ? 'derp' : you.stun > 0 ? 'squint' : !live ? 'joy' : sq ? 'alert' : you.tired > 0 ? 'sad' : you.th > 0.6 ? 'eager' : 'happy';
    you.bowT = !live && you.th < 0.1 && Math.sin(G.pt * 9) > 0 ? 1 : 0;
  }
  G.slapQ = false;
  G.brain.update(dt, w);

  if (G.phase === 'enter') {
    pal.xo = Math.max(0, pal.xo - dt * 340);
    if (pal.xo <= 0) { pal.walk = 0; G.phase = 'play'; G.pt = 0; G.brain.idle(0.2); pal.ev.push('bark'); pal.say(pick(['hi!!', 'HI', 'oh! hello', 'friend??']), 1.1); }
  } else if (G.phase === 'exit') {
    pal.spin = -1; pal.walk = 1; pal.xo += dt * 400;
    if (pal.x + pal.xo + pal.shift - pal.b.bodyL - 90 > W) {
      G.level++;
      if (G.level >= ORDER.length) winGame(); else { spawnPal(ORDER[G.level], true); G.sqT = rnd(9, 15); }
      return;
    }
  }

  you.step(dt); pal.step(dt);
  dogEvents(you, true); dogEvents(pal, false);
  for (const d of [you, pal]) {
    if (d.state === 'ok' && d.th > 0.55 && d.stam < 0.3 && rnd() < dt * 9) FX.sweat(d.head.x, d.head.y - d.b.headR, rnd() < 0.5 ? -1 : 1);
  }

  if (G.phase === 'celebrate') {
    if (G.pt > 2.7 && you.state === 'ok' && pal.state === 'ok') {
      if (playing) { G.phase = 'exit'; G.brain.set('wait'); if (G.auto) G.auto.idle(); pal.say(pick(['bye!!', 'ok bye', 'BEST DAY', 'tell everyone']), 1.2); }
      else { G.phase = 'play'; G.brain.idle(); if (G.auto) G.auto.idle(); }
    }
  } else if (G.phase === 'play') {
    if (playing) G.stats.time += dt;
    handleContacts();
    if (G.whiffT > 0 && (G.whiffT -= dt) <= 0 && !G.hit && pal.up && G.popCool <= 0 && !G.auto) {
      G.popCool = 1.5; G.stats.whiffs++;
      FX.pop(pick(['WHIFF', 'swish', 'air five']), you.paw.x + 30, you.paw.y - 34, { size: 22, col: '#e8fbff' });
    }
    if (playing && G.level >= 1 && !w.squirrel && (G.sqT -= dt) <= 0) {
      const v = rnd() < 0.5 ? 1 : -1;
      w.squirrel = { x: v > 0 ? -30 : W + 30, y: FENCE_Y - 14, v: v * 240 };
      G.stats.squirrels++; SFX.chitter();
      FX.pop('SQUIRREL!!', W / 2, 215, { size: 34, col: '#ffb35c', life: 1.6, sub: 'your brain has left the chat' });
    }
  }
  if (w.squirrel) {
    w.squirrel.x += w.squirrel.v * dt;
    if (w.squirrel.x < -40 || w.squirrel.x > W + 40) { w.squirrel = null; G.sqT = rnd(15, 26); }
  }
}
