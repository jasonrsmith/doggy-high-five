'use strict';
// ───────────────────────── Doggy High Five: lettering, particles, meters ─────────────────────────
const FONT = '"Comic Sans MS", "Chalkboard SE", "Comic Neue", "Marker Felt", "Segoe Print", cursive';

// Hand lettering: ALL CAPS, every letter slightly drunk, black outline, hard drop shadow.
function comic(g, s, x, y, size, col = '#fff', align = 'center', o = {}) {
  s = String(s).toUpperCase();
  g.font = `bold ${size}px ${FONT}`; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const lw = o.lw === undefined ? Math.max(3, size * 0.2) : o.lw;
  if (size < 17) {
    g.textAlign = align;
    if (lw) { g.lineWidth = lw; g.strokeStyle = OUT; g.strokeText(s, x, y); }
    g.fillStyle = col; g.fillText(s, x, y);
    return;
  }
  const ws = []; let tot = 0;
  for (const ch of s) { const w = g.measureText(ch).width; ws.push(w); tot += w; }
  const x0 = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x;
  const sh = o.shadow === undefined ? Math.max(2, size * 0.07) : o.shadow;
  g.textAlign = 'center';
  for (let pass = lw ? 0 : 1; pass < 2; pass++) {
    let px = x0, i = 0;
    for (const ch of s) {
      const w = ws[i];
      if (ch !== ' ') {
        const h1 = Math.sin(i * 12.9898 + s.length * 4.1) * 43758.5453, h2 = Math.sin(i * 7.77 + s.length) * 1234.5;
        g.save(); g.translate(px + w / 2, y + ((h1 - Math.floor(h1)) * 2 - 1) * size * 0.045); g.rotate(((h2 - Math.floor(h2)) * 2 - 1) * 0.055);
        if (pass === 0) { g.lineWidth = lw; g.strokeStyle = OUT; if (sh) g.strokeText(ch, sh, sh); g.strokeText(ch, 0, 0); }
        else { g.fillStyle = col; g.fillText(ch, 0, 0); }
        g.restore();
      }
      px += w; i++;
    }
  }
}

const FX = {
  parts: [], pops: [], fl: null,
  clear() { this.parts.length = 0; this.pops.length = 0; this.fl = null; },
  add(p) { p.max = p.life; p.rot = p.rot || 0; p.vr = p.vr || 0; p.g = p.g === undefined ? 500 : p.g; this.parts.push(p); },
  flash(x, y) { this.fl = { x, y, t: 0 }; },   // the dramatic sunburst behind a successful high five
  burst(x, y, n, cols = ['#ffe36e', '#fff', '#ff9ecb', '#8fd9ff']) {
    for (let i = 0; i < n; i++) {
      const a = rnd(Math.PI * 2), v = rnd(120, 460);
      this.add({ type: 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: rnd(0.5, 1.1), size: rnd(6, 13), col: cols[i % cols.length], vr: rnd(-9, 9) });
    }
  },
  ring(x, y, col = '#fff', size = 90) { this.add({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.4, size, col, g: 0, rot: rnd(1) }); },
  dust(x, y, n = 5) {
    for (let i = 0; i < n; i++) this.add({ type: 'dust', x: x + rnd(-14, 14), y, vx: rnd(-70, 70), vy: rnd(-50, -10), life: rnd(0.3, 0.6), size: rnd(5, 10), col: '#fff', g: -30 });
  },
  hearts(x, y, n = 4) {
    for (let i = 0; i < n; i++) this.add({ type: 'heart', x: x + rnd(-20, 20), y: y + rnd(-10, 10), vx: rnd(-30, 30), vy: rnd(-90, -50), life: rnd(0.8, 1.4), size: rnd(7, 12), col: '#ff6b93', g: -20 });
  },
  sweat(x, y, dir) { this.add({ type: 'drop', x, y, vx: dir * rnd(40, 110), vy: rnd(-150, -70), life: 0.5, size: 5, col: '#bfe9f8' }); },
  confetti(n = 70) {
    const cols = ['#ff6b93', '#ffe36e', '#7bcf6b', '#7cc7ee', '#b98be8', '#fff'];
    for (let i = 0; i < n; i++) this.add({ type: i % 5 ? 'conf' : 'bone', x: rnd(W), y: rnd(-200, -10), vx: rnd(-40, 40), vy: rnd(60, 180), life: rnd(2.2, 3.6), size: rnd(7, 12), col: cols[i % cols.length], vr: rnd(-8, 8), g: 90 });
  },
  pop(text, x, y, o = {}) {
    this.pops.push({ text, x: clamp(x, 120, W - 120), y, t: 0, max: o.life || 1.2, size: o.size || 30, col: o.col || '#fff', rot: o.rot === undefined ? rnd(-0.12, 0.12) : o.rot, sub: o.sub, seed: rnd(50) });
  },
  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt; if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.type === 'conf' || p.type === 'bone') p.vx += Math.sin(p.life * 6 + p.size) * 60 * dt;
    }
    for (let i = this.pops.length - 1; i >= 0; i--) { const p = this.pops[i]; p.t += dt; if (p.t > p.max) this.pops.splice(i, 1); }
    if (this.fl && (this.fl.t += dt) > 1.1) this.fl = null;
  },
  drawBack(g) {
    const f = this.fl; if (!f) return;
    g.save(); g.globalAlpha = Math.min(1, (1 - f.t / 1.1) * 1.8); g.translate(f.x, f.y); g.rotate(f.t * 0.45);
    for (let i = 0; i < 18; i++) {
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1300, (i * Math.PI) / 9, ((i + 1) * Math.PI) / 9); g.closePath();
      g.fillStyle = i % 2 ? '#ffe36e' : '#ffc233'; g.fill();
    }
    g.restore();
  },
  draw(g) {
    for (const p of this.parts) {
      const k = p.life / p.max, s = p.size;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, k * 2.5);
      if (p.type === 'star') {   // four-point sparkle
        g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.34 : s, a = (i * Math.PI) / 4; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        g.closePath(); ink(g, p.col, 2);
      } else if (p.type === 'ring') {   // impact lines, comic style
        const r0 = p.size * (1 - k) * 0.75 + 12, r1 = r0 + 8 + 16 * k;
        g.globalAlpha = Math.min(1, k * 3); g.beginPath();
        for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); }
        ink(g, null, 3);
      } else if (p.type === 'dust') { g.globalAlpha = Math.min(1, k * 2); g.beginPath(); g.arc(0, 0, s * (1.5 - k * 0.6), 0, 7); ink(g, p.col, 2); }
      else if (p.type === 'heart') {
        g.beginPath(); g.moveTo(0, s * 0.9); g.bezierCurveTo(-s * 1.5, -s * 0.2, -s * 0.5, -s * 1.2, 0, -s * 0.35);
        g.bezierCurveTo(s * 0.5, -s * 1.2, s * 1.5, -s * 0.2, 0, s * 0.9); ink(g, p.col, 2.2);
      } else if (p.type === 'drop') {
        g.rotate(Math.atan2(p.vy, p.vx) - Math.PI / 2 - p.rot);
        g.beginPath(); g.moveTo(0, -s * 1.5); g.quadraticCurveTo(s, 0, 0, s * 0.8); g.quadraticCurveTo(-s, 0, 0, -s * 1.5); ink(g, p.col, 2);
      } else if (p.type === 'bone') {
        g.beginPath(); g.roundRect(-s, -s * 0.28, s * 2, s * 0.56, 2);
        for (const [x, y] of [[-s, -s * 0.3], [-s, s * 0.3], [s, -s * 0.3], [s, s * 0.3]]) { g.moveTo(x + s * 0.4, y); g.arc(x, y, s * 0.4, 0, 7); }
        ink(g, '#fff', 1.8);
      } else { g.beginPath(); g.rect(-s / 2, -s / 3, s, s * 0.66); ink(g, p.col, 1.6); }
      g.restore();
    }
    for (const p of this.pops) {
      const a = p.t / p.max, sc = a < 0.12 ? 0.4 + (a / 0.12) * 0.75 : a < 0.2 ? 1.15 - ((a - 0.12) / 0.08) * 0.15 : 1;
      g.save(); g.translate(p.x, p.y - a * 18); g.rotate(p.rot); g.scale(sc, sc); g.globalAlpha = a > 0.82 ? (1 - a) * 5.5 : 1;
      if (p.size >= 30) {   // spiky shout balloon
        g.font = `bold ${p.size}px ${FONT}`;
        const rx = g.measureText(p.text.toUpperCase()).width / 2 + p.size * 0.75, ry = p.size * 1.05, n = 18;
        g.beginPath();
        for (let i = 0; i < n * 2; i++) {
          const an = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? 0.8 : 1.06 + jit(p.seed, i, 0.07);
          g.lineTo(Math.cos(an) * rx * r, Math.sin(an) * ry * r);
        }
        g.closePath(); ink(g, '#fff', 3.4);
      }
      comic(g, p.text, 0, 0, p.size, p.col);
      if (p.sub) comic(g, p.sub, 0, p.size * (p.size >= 30 ? 1.5 : 0.9), Math.max(13, Math.round(p.size * 0.36)), '#fff');
      g.restore();
    }
  },
};

// Your two problems, as meters: staying upright, and how long your legs will put up with it.
function drawMeters(g, d, x, y) {
  const w = 190, hgt = 13, X = (th) => x + clamp(th / 2.05, 0, 1) * w;
  const bar = (yy) => { g.beginPath(); g.roundRect(x, yy, w, hgt, 6); };
  comic(g, 'balance', x, y - 19, 12, '#fff', 'left');
  comic(g, 'all fours', x, y + 26, 10.5, '#fff', 'left'); comic(g, 'flop', x + w, y + 26, 10.5, '#fff', 'right');
  bar(y); g.fillStyle = '#f6ecd2'; g.fill();
  g.save(); bar(y); g.clip();
  g.fillStyle = '#ffd23f'; g.fillRect(X(1.08), y, X(1.78) - X(1.08), hgt);
  g.fillStyle = '#7bcf6b'; g.fillRect(X(TH0 - 0.2), y, X(TH0 + 0.2) - X(TH0 - 0.2), hgt);
  g.fillStyle = '#ee5a45'; g.fillRect(X(1.78), y, x + w - X(1.78), hgt);
  g.restore(); bar(y); ink(g, null, 3);
  const nx = X(d.state === 'ok' ? d.th : 2.05);
  g.beginPath(); g.moveTo(nx, y + 10); g.lineTo(nx - 8, y - 8); g.lineTo(nx + 8, y - 8); g.closePath(); ink(g, '#fff', 2.6);
  const y2 = y + 60, low = d.stam < 0.3 || d.tired > 0;
  comic(g, d.tired > 0 ? 'legs (gave out!)' : 'legs', x, y2 - 12, 12, '#fff', 'left');
  bar(y2); g.fillStyle = '#f6ecd2'; g.fill();
  g.save(); bar(y2); g.clip(); g.fillStyle = low ? '#ee5a45' : '#7cc7ee'; g.fillRect(x, y2, w * d.stam, hgt); g.restore();
  bar(y2); ink(g, null, 3);
}
