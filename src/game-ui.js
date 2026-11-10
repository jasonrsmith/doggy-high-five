'use strict';
// ───────────────────────── Doggy High Five: screen, HUD, input, loop ─────────────────────────
const STAGE = document.getElementById('stage'), CV = document.getElementById('cv'), CTX = CV.getContext('2d');
const STEP = 1 / 120;
let SCALE = 1, BG = null, lastW = 0, SOLO = false, FROZEN = false;
try { SOLO = window.top === window.self; } catch (e) { SOLO = false; }

const TIPS = {
  pickle: 'Pickle is very short. Aim your paw LOW and meet him down there.',
  duchess: 'Duchess will not stoop. Paw HIGH, hold your balance, and wait for her to condescend.',
  nacho: 'Nacho can only reach you mid-hop. Hold your paw out and time the slap.',
  moose: 'Moose cannot see you. Put your paw where HIS paw is about to go.',
};
const fmt = (t) => Math.floor(t / 60) + ':' + (t % 60 < 10 ? '0' : '') + (t % 60).toFixed(1);

// o = 0 means plain ink lettering with no outline (for text sitting on paper)
function txt(g, s, x, y, size, col = '#fff', align = 'center', o = 0.2) { comic(g, s, x, y, size, col, align, o ? {} : { lw: 0 }); }
function pawIcon(g, x, y, r, col) {
  const dots = [[0, r * 0.35, r * 0.62, r * 0.5], [-r * 0.75, -r * 0.3, r * 0.3, r * 0.36], [0, -r * 0.72, r * 0.3, r * 0.36], [r * 0.75, -r * 0.3, r * 0.3, r * 0.36]];
  g.strokeStyle = OUT; g.lineWidth = 5.5; g.fillStyle = col;
  for (const [dx, dy, rx, ry] of dots) { g.beginPath(); g.ellipse(x + dx, y + dy, rx, ry, 0, 0, 7); g.stroke(); }
  for (const [dx, dy, rx, ry] of dots) { g.beginPath(); g.ellipse(x + dx, y + dy, rx, ry, 0, 0, 7); g.fill(); }
}
// narration box, like a comic caption: cream paper, ink border, hard shadow
function pill(g, s, x, y) {
  s = s.toUpperCase();
  const size = s.length > 66 ? 12 : 14;
  g.font = `bold ${size}px ${FONT}`;
  const w = g.measureText(s).width + 30, h = size * 2;
  g.save(); g.translate(x, y); g.rotate(-0.006);
  g.beginPath(); g.roundRect(-w / 2 + 3, -h / 2 + 3.5, w, h, 5); g.fillStyle = OUT; g.fill();
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 5); ink(g, '#fff7df', 2.8);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = OUT; g.fillText(s, 0, 1);
  g.restore();
}

function hint() {
  const you = G.you, pal = G.pal, s = G.brain.s;
  if (G.phase === 'enter') return 'A new friend approaches. They want a high five. So do you.';
  if (G.phase !== 'play') return '';
  if (G.world.squirrel) return 'SQUIRREL. Your paw is at 40% power. Your heart is on that fence.';
  if (you.state !== 'ok') return 'Wiggle with dignity. You will be up in a second.';
  if (you.tired > 0) return 'Legs are resting. Let the LEGS bar refill.';
  if (G.level > 0 && G.pt < 9) return TIPS[pal.key];
  if (G.level > 0) return '';
  if (you.th < 0.6) return s === 'wiggle' ? 'Butt wiggle = they are about to stand up. Get ready!' : 'Hold  A  to rear up on your hind legs. Let go before you tip over!';
  if (you.al < 0.8) return 'Tap  A / D  to stay balanced   ·   hold  W  to lift your paw';
  if (!pal.up) return 'Paw is up! Now wait for them... your legs will not last forever';
  return 'Line the paws up, then  SPACE  to slap!';
}

function drawHud(g) {
  const st = G.stats, you = G.you, b = G.pal.b;
  for (let i = 0; i < 5; i++) pawIcon(g, 36 + i * 30, 30, 10, i < G.done ? '#ffd23f' : '#fff');
  txt(g, G.done + ' / 5', 190, 31, 15, '#fff', 'left');
  drawMeters(g, you, 26, 136);
  txt(g, fmt(st.time), W - 22, 28, 26, '#fff', 'right');
  txt(g, b.name, W / 2, 28, 31);
  txt(g, b.kind, W / 2, 53, 12, '#ffd23f');
  txt(g, '“' + b.quip + '”', W / 2, 73, 13, '#fff');
  const h = hint(); if (h) pill(g, h, W / 2, 104);
  if (G.level === 0 && st.time < 6 && G.phase !== 'celebrate') {
    const y = you.head.y - 86 + Math.sin(G.time * 6) * 4;
    txt(g, 'YOU', you.head.x, y, 19, '#ffd23f');
    g.beginPath(); g.moveTo(you.head.x - 8, y + 14); g.lineTo(you.head.x + 8, y + 14); g.lineTo(you.head.x, y + 25); g.closePath(); ink(g, '#ffd23f', 2.6);
  }
  txt(g, `slaps ${st.slaps}  ·  boops ${st.boops}  ·  flops ${st.flops}`, W / 2, 506, 12, '#fff');
  txt(g, 'M mute  ·  P pause  ·  R restart', W / 2, 526, 10.5, '#fff');
}

function drawTitle(g) {
  const t = G.time;
  g.save(); g.translate(W / 2 - 20, 60); g.rotate(-0.04); txt(g, 'DOGGY', 0, 0, 62); g.restore();
  g.save(); g.translate(W / 2 - 20, 130); g.rotate(0.02); const s = 1 + 0.03 * Math.sin(t * 4); g.scale(s, s);
  txt(g, 'HIGH FIVE', 0, 0, 90, '#ffd23f'); g.restore();
  pawIcon(g, W / 2 + 262, 60 + Math.sin(t * 4) * 3, 22, '#ff9ecb');
  pill(g, 'You are a dog. Your friend is a dog. Nobody here has thumbs, balance, or a plan.', W / 2, 198);
  if (Math.sin(t * 5) > -0.4) txt(g, 'PRESS SPACE OR TAP TO START', W / 2, 484, 19, '#fff');
  txt(g, G.best ? 'best time  ' + fmt(G.best) : 'five dogs. five high fives. be the good boy.', W / 2, 512, 12, '#ffd23f');
}

function drawWin(g) {
  const st = G.stats, x = 215, y = 20, w = 530, h = 290;
  g.save(); g.translate(W / 2, y + h / 2); g.rotate(-0.008); g.translate(-W / 2, -(y + h / 2));
  g.beginPath(); g.roundRect(x + 6, y + 7, w, h, 10); g.fillStyle = OUT; g.fill();
  g.beginPath(); g.roundRect(x, y, w, h, 10); ink(g, '#fff7df', 3.6);
  txt(g, 'FIVE HIGH FIVES!', W / 2, y + 46, 44, '#ffd23f');
  const rank = st.time < 75 ? 'BEST IN SHOW' : st.time < 150 ? 'VERY GOOD DOG' : st.time < 300 ? 'GOOD DOG' : 'STILL A GOOD DOG';
  txt(g, fmt(st.time), W / 2 - 115, y + 102, 40, '#fff');
  txt(g, G.newBest ? 'NEW BEST!' : 'best ' + fmt(G.best || st.time), W / 2 - 115, y + 135, 13, '#d6402b', 'center', 0);
  txt(g, rank, W / 2 + 120, y + 102, 25, '#ff9ecb');
  const n = Math.round(st.stars / 3);
  for (let i = 0; i < 5; i++) pawIcon(g, W / 2 + 72 + i * 24, y + 135, 8, i < n ? '#ffd23f' : '#fff');
  const rows = [['slaps thrown', st.slaps], ['air fives (whiffs)', st.whiffs], ['snoots booped', st.boops], ['times bonked', st.bonks],
    ['flops', st.flops], ['handshakes (too formal)', st.shakes], ['squirrels witnessed', st.squirrels], ['regrets', 0]];
  rows.forEach(([k, v], i) => {
    const cx = x + 34 + (i % 2) * 240, cy = y + 172 + Math.floor(i / 2) * 25;
    txt(g, k, cx, cy, 12.5, OUT, 'left', 0); txt(g, String(v), cx + 214, cy, 15, '#d6402b', 'right', 0);
  });
  if (G.modeT > 1.2 && Math.sin(G.time * 5) > -0.4) txt(g, 'SPACE OR TAP TO PLAY AGAIN', W / 2, y + h - 22, 17, '#fff');
  g.restore();
}

function render() {
  const g = CTX;
  g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  g.save();
  if (G.shake > 0.4) g.translate(rnd(-1, 1) * G.shake, rnd(-1, 1) * G.shake);
  g.drawImage(BG, -12, -12, W + 24, H + 24);
  FX.drawBack(g);
  drawClouds(g, G.time);
  if (G.world.squirrel) drawSquirrel(g, G.world.squirrel, G.time);
  drawDog(g, G.pal, G.time); drawDog(g, G.you, G.time);
  drawArm(g, G.pal); drawArm(g, G.you);
  FX.draw(g);
  g.restore();
  if (G.mode === 'play') drawHud(g); else if (G.mode === 'title') drawTitle(g); else drawWin(g);
  if (G.paused) { g.fillStyle = 'rgba(20,14,10,.55)'; g.fillRect(0, 0, W, H); txt(g, 'PAUSED', W / 2, H / 2 - 10, 60); txt(g, 'P to resume', W / 2, H / 2 + 40, 18, '#ffe066'); }
}

function resize() {
  if (SOLO) STAGE.style.maxWidth = Math.max(320, Math.min(1500, (window.innerHeight - 16) * 16 / 9)) + 'px';
  const w = STAGE.clientWidth || 728;
  if (w === lastW) return; lastW = w;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  CV.width = Math.round(w * dpr); CV.height = Math.round((w * 9 / 16) * dpr); SCALE = CV.width / W;
  STAGE.style.fontSize = Math.max(8.5, w / 64).toFixed(2) + 'px';
  BG = makeBackground(SCALE);
}

// ── input ──
const KEYMAP = { KeyA: 'back', ArrowLeft: 'back', KeyD: 'fwd', ArrowRight: 'fwd', KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down' };
const BTN = {};
document.querySelectorAll('[data-k]').forEach((el) => { BTN[el.dataset.k] = el; });
function setKey(k, v) { G.keys[k] = v; if (BTN[k]) BTN[k].classList.toggle('on', v); }
function action() {
  SFX.init();
  if (G.mode === 'title' || (G.mode === 'win' && G.modeT > 1.2)) startGame();
  else if (G.mode === 'play' && !G.paused) { G.slapQ = true; if (BTN.slap) { BTN.slap.classList.add('on'); setTimeout(() => BTN.slap.classList.remove('on'), 110); } }
}
addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = KEYMAP[e.code];
  if (k) { SFX.init(); setKey(k, true); e.preventDefault(); return; }
  if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyF') { e.preventDefault(); if (!e.repeat) action(); }
  else if (e.code === 'KeyM') SFX.muted = !SFX.muted;
  else if ((e.code === 'KeyP' || e.code === 'Escape') && G.mode === 'play') G.paused = !G.paused;
  else if (e.code === 'KeyR' && G.mode === 'play') startGame();
});
addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) setKey(k, false); });
addEventListener('blur', () => { for (const k in G.keys) setKey(k, false); });
for (const k in BTN) {
  const el = BTN[k];
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); SFX.init();
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    if (k === 'slap') action(); else if (G.mode !== 'play') action(); else setKey(k, true);
  });
  const up = () => { if (k !== 'slap') setKey(k, false); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
CV.addEventListener('pointerdown', () => { if (G.mode !== 'play') action(); });

// ── main loop ──
let lastT = 0, acc = 0;
function advance(dt) {
  G.time += dt; G.modeT += dt; G.shake *= Math.pow(0.003, dt);
  if (G.hitstop > 0) G.hitstop -= dt;
  else { acc += dt; while (acc >= STEP) { simStep(STEP); acc -= STEP; } }
  FX.update(dt);
}
function frame(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
  resize();
  if (!G.paused && !FROZEN) advance(dt);
  render();
  requestAnimationFrame(frame);
}

try { const b = parseFloat(localStorage.getItem('dhf-best')); if (b > 0) G.best = b; } catch (e) { /* no storage, no problem */ }
if (SOLO) document.documentElement.classList.add('solo');
startTitle();
// dev hook for screenshots: ?shot=title|play|win&lvl=0..4&t=seconds
try {
  const q = new URLSearchParams(location.search), m = q.get('shot');
  if (m) {
    if (m === 'play' || m === 'win') { startGame(m === 'win' ? 4 : +q.get('lvl') || 0); G.auto = new Brain(G.you, G.pal, AUTO_AI); }
    resize();
    for (let i = 0, n = (+q.get('t') || 0) * 60; i < n && !(m === 'win' && G.mode === 'win' && G.modeT > 2); i++) {
      advance(1 / 60);
      if (q.has('paint') && i % 2 === 0) render();   // exercise every drawing path on the way
    }
    if (q.has('five')) {   // force the money shot
      highFive({ x: (G.you.paw.x + G.pal.paw.x) / 2, y: (G.you.paw.y + G.pal.paw.y) / 2, speed: 600, high: true });
      for (let i = 0; i < 26; i++) advance(1 / 60);
    }
    if (q.has('sq')) { G.world.squirrel = { x: 330, y: FENCE_Y - 14, v: 240 }; G.pal.mood = 'alert'; G.pal.say('SQUIRREL!!', 9); G.you.mood = 'derp'; }
    FROZEN = true;
  }
} catch (e) { /* ignore */ }
resize();
requestAnimationFrame(frame);
