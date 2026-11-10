'use strict';
// ───────────────────────── Doggy High Five: dog renderer ─────────────────────────
// Webcomic rules: potato bodies, noodle limbs, flat colour, one wobbly black ink line.
const OUT = '#1d1a18', LW = 3.3;
let BOIL = 0;   // ticks ~9x a second so the ink wobbles like hand re-drawn frames

function jit(seed, i, amp = 1) {
  const s = Math.sin(seed * 12.9898 + i * 78.233 + BOIL * 37.719) * 43758.5453;
  return ((s - Math.floor(s)) * 2 - 1) * amp;
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => clamp(Math.round(v * k), 0, 255);
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}
function ink(g, fill, lw = LW) {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (lw) { g.lineWidth = lw; g.strokeStyle = OUT; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
}
// Closed smooth curve that uses the points as control handles: instant lumpy potato.
function blobPath(g, p) {
  const n = p.length / 2;
  const mx = (i) => (p[(i % n) * 2] + p[((i + 1) % n) * 2]) / 2, my = (i) => (p[(i % n) * 2 + 1] + p[((i + 1) % n) * 2 + 1]) / 2;
  g.beginPath(); g.moveTo(mx(n - 1), my(n - 1));
  for (let i = 0; i < n; i++) g.quadraticCurveTo(p[i * 2], p[i * 2 + 1], mx(i), my(i));
  g.closePath();
}
function wobble(pts, seed, amp = 0.9) {
  const p = pts.slice();
  for (let i = 0; i < p.length; i++) p[i] += jit(seed, i, amp);
  return p;
}
function lump(g, pts, fill, seed = 0, amp = 0.9, lw = LW) { blobPath(g, amp ? wobble(pts, seed, amp) : pts); ink(g, fill, lw); }
function blob(g, x, y, rx, ry, col, rot = 0, lw = LW) {
  g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, 7); ink(g, col, lw);
}
// A limb with no bones in it: curves from a to b, passing through the "knee" k.
function noodle(g, ax, ay, kx, ky, bx, by, w, col) {
  const cx = 2 * kx - (ax + bx) / 2, cy = 2 * ky - (ay + by) / 2;
  g.lineCap = 'round';
  for (const [lw, c] of [[w + LW * 2, OUT], [w, col]]) {
    g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(cx, cy, bx, by); g.lineWidth = lw; g.strokeStyle = c; g.stroke();
  }
}
function ik2(ax, ay, bx, by, l1, l2, s) {
  const dx = bx - ax, dy = by - ay, dd = Math.hypot(dx, dy) || 1e-6;
  const m = Math.min(dd, l1 + l2 - 0.01);
  const a = (l1 * l1 - l2 * l2 + m * m) / (2 * m);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / dd, uy = dy / dd;
  return { x: ax + ux * a - uy * h * s, y: ay + uy * a + ux * h * s };
}
// Where a noodle limb bows out. Like ik2, but the bulge is capped (noodles curve, they don't fold),
// and `s` can be any value in [-1, 1] so the bend can sweep smoothly from one side to the other.
function knee(ax, ay, bx, by, half, s, k = 0.17) {
  const dx = bx - ax, dy = by - ay, dd = Math.hypot(dx, dy) || 1e-6;
  const m = Math.min(dd, 2 * half);
  const h = Math.min(Math.sqrt(Math.max(0, half * half - (m * m) / 4)), k * dd + 4) * s;
  return { x: ax + dx / 2 - (dy / dd) * h, y: ay + dy / 2 + (dx / dd) * h };
}
// Big dumb oval foot with two toe ticks. (x, y) is where it touches the ground.
function foot(g, x, y, dr, w, col, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  blob(g, dr * w * 0.3, -w * 0.34, w * 0.82, w * 0.5, col);
  g.lineWidth = 2; g.beginPath();
  g.moveTo(dr * w * 0.8, -w * 0.62); g.lineTo(dr * w * 0.72, -w * 0.28);
  g.moveTo(dr * w * 0.46, -w * 0.76); g.lineTo(dr * w * 0.42, -w * 0.44); g.stroke();
  g.restore();
}

function drawShadow(g, d) {
  const cx = (d.hip.x + d.sh.x) / 2, w = Math.abs(d.sh.x - d.hip.x) / 2 + d.b.thick * 0.75, k = 1 / (1 + d.jy / 60);
  g.fillStyle = 'rgba(70,105,40,.34)';
  g.beginPath(); g.ellipse(cx, GROUND + 3, w * k, 7 * k, 0, 0, 7); g.fill();
}

function drawTail(g, d, bx, by, ux, uy) {
  const b = d.b, dr = d.dir, T = b.thick;
  const wagA = Math.sin(d.wag) * (0.25 + 0.6 * d.excite);
  const th = Math.atan2(-uy, ux * dr);
  const base = lerp(Math.PI - 1.0 + 0.35 * th, th + Math.PI + 0.3, d.fk) + wagA;   // up-and-back, whatever the body is doing
  const dv = (a, l) => [dr * Math.cos(a) * l, -Math.sin(a) * l];
  let L = T * 0.3;
  if (b.tail === 'nub') { const [vx, vy] = dv(base, T * 0.2); blob(g, bx + vx, by + vy, T * 0.2, T * 0.17, b.fur); }
  else {
    L = b.tail === 'plume' ? T * 1.2 : b.tail === 'whip' ? T * 1.35 : T * 0.95;
    const [ax, ay] = dv(base, L * 0.55), [cx, cy] = dv(base + (b.tail === 'curl' ? 1.7 : 0.5) + wagA * 0.6, L * 0.5);
    const mx = bx + ax, my = by + ay, ex = mx + cx, ey = my + cy;
    if (b.tail === 'plume') {   // fluffy flag
      const px = -(ey - by), py = ex - bx, pl = Math.hypot(px, py) || 1, wx = (px / pl) * T * 0.3, wy = (py / pl) * T * 0.3;
      lump(g, [bx, by, mx + wx, my + wy, ex + wx * 0.4, ey + wy * 0.4, ex + cx * 0.3, ey + cy * 0.3, mx - wx, my - wy], b.belly, d.seed + 5, 1);
    } else noodle(g, bx, by, mx, my, ex, ey, b.tail === 'whip' ? T * 0.09 : T * 0.13, b.fur);
  }
  if (d.excite > 0.55 && d.fk < 0.3) {   // wag marks
    const wa = Math.atan2(-Math.sin(base), dr * Math.cos(base));
    g.lineWidth = 2.2; g.strokeStyle = OUT; g.lineCap = 'round';
    for (const s of [-1, 1]) { g.beginPath(); g.arc(bx, by, L * 0.95 + 8, wa + s * 0.5, wa + s * 0.85, s < 0); g.stroke(); }
  }
}

// The paws are the whole game, so a raised high-five arm gets inked on top of everybody.
function drawArm(g, d) {
  if (d.planted) return;
  const b = d.b, dr = d.dir, sh = d.sh, half = b.armL / 2, armW = Math.max(5, b.thick * 0.16);
  g.save();
  if (d.spin < 0) { const cx = (d.hip.x + sh.x) / 2; g.translate(cx, 0); g.scale(-1, 1); g.translate(-cx, 0); }
  // elbow points forward while the paw hangs, and down once the paw is raised: never out of the back
  const side = dr * clamp((d.al - 0.55) / 0.45, -1, 1);
  const el = knee(sh.x + dr * 4, sh.y, d.paw.x, d.paw.y, half, side, 0.3);
  noodle(g, sh.x + dr * 4, sh.y, el.x, el.y, d.paw.x, d.paw.y, armW, b.fur);
  const pr = b.pawR * 1.25, dx = dr * Math.sin(d.al), dy = Math.cos(d.al), pa = Math.atan2(dy, dx);
  if (d.slapT > 0) {   // speed lines
    g.lineWidth = 2.6; g.strokeStyle = OUT; g.lineCap = 'round'; g.beginPath();
    for (let i = -1; i <= 1; i++) {
      const ox = -dy * i * pr * 0.8, oy = dx * i * pr * 0.8, l0 = pr + 6, l1 = pr + 22 + (i ? 0 : 12);
      g.moveTo(d.paw.x - dx * l0 + ox, d.paw.y - dy * l0 + oy); g.lineTo(d.paw.x - dx * l1 + ox, d.paw.y - dy * l1 + oy);
    }
    g.stroke();
  }
  blob(g, d.paw.x, d.paw.y, pr, pr * 0.94, b.belly, pa);
  blob(g, d.paw.x - dx * pr * 0.2 + dr, d.paw.y - dy * pr * 0.2, pr * 0.42, pr * 0.36, '#f06a86', 0, 0);
  for (let i = -1; i <= 1; i++) blob(g, d.paw.x + Math.cos(pa + i * 0.75) * pr * 0.58 + dr, d.paw.y + Math.sin(pa + i * 0.75) * pr * 0.58, pr * 0.19, pr * 0.19, '#f06a86', 0, 0);
  g.restore();
}

function drawDog(g, d, time) {
  BOIL = Math.floor(time * 9);
  const b = d.b, dr = d.dir, hip = d.hip, sh = d.sh, th = d.pth, fk = d.fk, r = d.r, T = b.thick, L = b.bodyL, sd = d.seed;
  const far = b._far || (b._far = shade(b.fur, 0.8));
  const ux = dr * Math.cos(th), uy = -Math.sin(th), nx = dr * Math.sin(th), ny = Math.cos(th);
  const gy = GROUND - d.jy;
  drawShadow(g, d);
  g.save();
  if (d.spin < 0) { const cx = (hip.x + sh.x) / 2; g.translate(cx, 0); g.scale(-1, 1); g.translate(-cx, 0); }

  const legL = Math.max(b.hipH * 0.62, T * 0.36), legW = Math.max(5, T * 0.17), armW = Math.max(5, T * 0.16);
  const half = b.armL / 2, fw = Math.max(9, T * 0.3);
  // hind feet: planted, trotting, or (when flopped) kicking at the sky
  const hind = (i) => {
    const ph = d.wph + i * Math.PI;
    const fx = hip.x + dr * (i ? 12 : -4) + d.walk * Math.sin(ph) * 13, fy = gy - d.walk * Math.max(0, Math.cos(ph)) * 9;
    const a = 1.25 + 0.45 * Math.sin(time * 11 + i * 2.1);
    const x = lerp(fx, hip.x + dr * Math.cos(a) * legL * 1.7, fk), y = lerp(fy, hip.y - Math.sin(a) * legL * 1.7, fk);
    const hx = hip.x + dr * (i ? 6 : 0), hy = hip.y + T * 0.2 * (1 - fk), k = knee(hx, hy, x, y, legL, -dr);
    return [hx, hy, k.x, k.y, x, y];
  };
  // near front leg: on the ground, or dangling like a begging T-rex
  const dangle = smooth(clamp(r * 4 + fk + (d.jy > 0 ? 1 : 0), 0, 1));
  const fa = lerp(0, 0.95, r) + d.dang * 0.7 * dangle + fk * (1.5 + 0.4 * Math.sin(time * 12 + 1));
  const fL = lerp(Math.max(8, gy - sh.y), b.armL * 0.66, dangle);
  const ffx = sh.x - dr * 9 * (1 - dangle) + dr * fL * Math.sin(fa) + d.walk * Math.sin(d.wph + 2) * 12 * (1 - dangle);
  const ffy = Math.min(sh.y + fL * Math.cos(fa), GROUND);
  const fe = knee(sh.x, sh.y + T * 0.12, ffx, ffy, half, dr);
  const hf = hind(1), hn = hind(0);

  noodle(g, hf[0], hf[1], hf[2], hf[3], hf[4], hf[5], legW, far);
  foot(g, hf[4], hf[5], dr, fw, far, -dr * fk * 1.3);

  // the high-five leg, while it is still just a leg (once lifted, drawArm inks it on top of everyone)
  if (d.planted) {
    const el = knee(sh.x + dr * 4, sh.y, d.paw.x, d.paw.y, half, dr);
    noodle(g, sh.x + dr * 4, sh.y, el.x, el.y, d.paw.x, d.paw.y, armW, far);
    foot(g, d.paw.x, d.paw.y + b.pawR * 0.45, dr, fw * 0.92, far);
  }

  drawTail(g, d, hip.x - ux * T * 0.42, hip.y - uy * T * 0.42, ux, uy);

  // the potato
  const P = (a, s) => [hip.x + ux * a * L + nx * s * T, hip.y + uy * a * L + ny * s * T];
  const sag = 0.8 + (b.fat || 0) + 0.05 * Math.sin(time * 9 + sd) * d.excite;
  const body = wobble([].concat(P(-0.26, -0.05), P(-0.12, -0.62), P(0.5, -0.54), P(1.05, -0.54), P(1.22, 0.05), P(1.02, 0.62), P(0.5 + d.dang * 0.14, sag), P(-0.1, 0.68)), sd, 0.9);
  const ba = Math.atan2(uy, ux), bc = P(0.52, 0.64);
  g.save(); blobPath(g, body); g.fillStyle = b.fur; g.fill(); g.clip();
  if (b.shag) { const rc = P(-0.05, 0); g.beginPath(); g.ellipse(rc[0], rc[1], L * 0.5, T, ba, 0, 7); g.fillStyle = '#a4a9b3'; g.fill(); }
  g.beginPath(); g.ellipse(bc[0], bc[1], L * 0.55, T * 0.42, ba, 0, 7); g.fillStyle = b.belly; g.fill();
  g.restore(); blobPath(g, body); ink(g, null);

  noodle(g, hn[0], hn[1], hn[2], hn[3], hn[4], hn[5], legW, b.fur);
  foot(g, hn[4], hn[5], dr, fw, b.belly, -dr * fk * 1.3);
  if (d.state === 'ok' && d.th > 0.55 && d.stam < 0.3) {   // knees are filing a complaint
    g.lineWidth = 2; g.strokeStyle = OUT; g.beginPath();
    for (const s of [-1, 1]) { const x0 = hn[2] + s * (legW + 9) + jit(sd, 60 + s, 1.5); g.moveTo(x0, hn[3] - 8); g.lineTo(x0 + 4, hn[3] - 3); g.lineTo(x0, hn[3] + 2); g.lineTo(x0 + 4, hn[3] + 7); }
    g.stroke();
  }

  // collar + tag
  const cx = lerp(sh.x, d.head.x, 0.42), cy = lerp(sh.y, d.head.y, 0.42);
  const nl = Math.hypot(d.head.x - sh.x, d.head.y - sh.y) || 1, px = (-(d.head.y - sh.y) / nl) * T * 0.4, py = ((d.head.x - sh.x) / nl) * T * 0.4;
  const cw = Math.max(5, b.headR * 0.28);
  g.lineCap = 'round';
  for (const [lw, c] of [[cw + LW * 2, OUT], [cw, b.collar]]) { g.beginPath(); g.moveTo(cx - px, cy - py); g.lineTo(cx + px, cy + py); g.lineWidth = lw; g.strokeStyle = c; g.stroke(); }
  const low = py > 0 ? 1 : -1;
  blob(g, cx + px * low, cy + py * low + cw * 0.7, Math.max(3, cw * 0.5), Math.max(3, cw * 0.5), '#ffd84a', 0, 2.2);

  drawFace(g, d, time);

  noodle(g, sh.x, sh.y + T * 0.12, fe.x, fe.y, ffx, ffy, armW, b.fur);
  foot(g, ffx, ffy, dr, fw * 0.9, b.belly, dr * dangle * 0.9);
  g.restore();
  drawEmote(g, d);
}
