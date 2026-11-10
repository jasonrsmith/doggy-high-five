'use strict';
// ───────────────────────── Doggy High Five: the park ─────────────────────────
// Flat colour, black ink, and not one straight line.
const FENCE_Y = 286;

function makeBackground(scale = 1) {
  const c = document.createElement('canvas'); c.width = Math.round(W * scale); c.height = Math.round(H * scale);
  const g = c.getContext('2d'); g.scale(c.width / W, c.height / H);
  let s = 11;
  const rr = () => ((s = (s * 16807) % 2147483647) / 2147483647), wb = (a = 1.5) => (rr() * 2 - 1) * a;
  const inkS = (fill, lw = 3) => { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = OUT; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } };
  const potato = (cx, cy, rx, ry, n, wob, fill, lw) => {
    const p = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = (1 + wb(wob)) * 1.1; p.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); }
    blobPath(g, p); inkS(fill, lw);
  };
  g.fillStyle = '#c8ebf4'; g.fillRect(0, 0, W, H);

  // the sun, who is thrilled to be here
  const SX = 838, SY = 84;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.1, l = 76 + wb(6);
    g.beginPath(); g.moveTo(SX + Math.cos(a - 0.11) * 50, SY + Math.sin(a - 0.11) * 50); g.lineTo(SX + Math.cos(a) * l, SY + Math.sin(a) * l);
    g.lineTo(SX + Math.cos(a + 0.11) * 50, SY + Math.sin(a + 0.11) * 50); g.closePath(); inkS('#ffd23f', 2.6);
  }
  potato(SX, SY, 39, 39, 11, 0.03, '#ffe36e', 3);
  for (const [ex, er, px] of [[-13, 9, 2], [9, 7, -1.5]]) {
    g.beginPath(); g.arc(SX + ex, SY - 8, er, 0, 7); inkS('#fff', 2.2);
    g.fillStyle = OUT; g.beginPath(); g.arc(SX + ex + px, SY - 7, 2, 0, 7); g.fill();
  }
  g.beginPath(); g.moveTo(SX - 16, SY + 9); g.quadraticCurveTo(SX - 2, SY + 30, SX + 17, SY + 8); g.closePath(); inkS('#7b1626', 2.4);

  // hills
  g.beginPath(); g.moveTo(-10, 300);
  for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, 262 + Math.sin(x * 0.008) * 26 + Math.sin(x * 0.021) * 10);
  g.lineTo(W + 10, 440); g.lineTo(-10, 440); g.closePath(); inkS('#a9d67f', 3);

  // trees: a stick and a cloud of leaves
  for (const [x, y, k, col] of [[92, 252, 1.1, '#6dbb57'], [252, 264, 0.8, '#5fae4d'], [640, 260, 0.9, '#6dbb57'], [742, 250, 1.15, '#5fae4d'], [908, 264, 0.85, '#6dbb57']]) {
    g.beginPath(); g.moveTo(x - 9 * k, y + 80 * k); g.lineTo(x - 7 * k + wb(1), y); g.lineTo(x + 7 * k + wb(1), y); g.lineTo(x + 9 * k, y + 80 * k); g.closePath(); inkS('#a8754a', 2.8);
    potato(x, y - 34 * k, 60 * k, 48 * k, 9, 0.1, col, 3);
    g.beginPath();
    for (let i = 0; i < 5; i++) { const ox = wb(34 * k), oy = wb(24 * k) - 34 * k; g.moveTo(x + ox - 7, y + oy); g.quadraticCurveTo(x + ox, y + oy - 9, x + ox + 7, y + oy); }
    inkS(null, 2);
  }

  // fence
  for (const ry of [FENCE_Y + 26, FENCE_Y + 84]) { g.beginPath(); g.rect(-6, ry, W + 12, 11); inkS('#c99f62', 2.6); }
  for (let x = -8; x < W; x += 40) {
    const h = FENCE_Y + wb(4), t = wb(1.5);
    g.beginPath(); g.moveTo(x + t, 412); g.lineTo(x + wb(1), h + 13); g.lineTo(x + 17 + wb(2), h); g.lineTo(x + 34 + wb(1), h + 13); g.lineTo(x + 34 + t, 412); g.closePath();
    inkS(rr() > 0.5 ? '#eccb8e' : '#e3bd7b', 2.8);
    g.fillStyle = OUT; g.beginPath(); g.arc(x + 17, h + 32, 1.8, 0, 7); g.arc(x + 17, h + 90, 1.8, 0, 7); g.fill();
    if (rr() > 0.45) { const gx = x + 8 + rr() * 18, y0 = h + 44 + rr() * 30; g.beginPath(); g.moveTo(gx, y0); g.quadraticCurveTo(gx + 3, y0 + 9, gx, y0 + 18); inkS(null, 1.6); }
  }

  // official signage
  g.save(); g.translate(168, 340); g.rotate(-0.045);
  g.beginPath(); g.roundRect(-74, -35, 148, 70, 6); inkS('#fff7df', 3);
  g.fillStyle = OUT; g.beginPath(); g.arc(-66, -27, 2, 0, 7); g.arc(66, -27, 2, 0, 7); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold 23px ${FONT}`; g.fillText('DOG PARK', 0, -9);
  g.font = `bold 10.5px ${FONT}`; g.fillText('NO THUMBS ALLOWED', 0, 15);
  g.restore();

  // lawn
  g.beginPath(); g.moveTo(-10, 406);
  for (let x = 0; x <= W + 40; x += 40) g.lineTo(x, 405 + wb(2));
  g.lineTo(W + 10, H + 10); g.lineTo(-10, H + 10); g.closePath(); inkS('#aad36a', 3);
  g.beginPath();
  for (let i = 0; i < 44; i++) {
    const x = rr() * W, y = 420 + rr() * 110;
    g.moveTo(x - 6, y - 6); g.lineTo(x - 2, y); g.lineTo(x, y - 10); g.lineTo(x + 2, y); g.lineTo(x + 6, y - 6);
  }
  g.lineWidth = 2.2; g.strokeStyle = '#5f9440'; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke();
  for (let i = 0; i < 11; i++) {
    const x = rr() * W, y = 416 + rr() * 20 + (rr() > 0.5 ? 80 : 0), col = ['#fff', '#ffe36e', '#ff9ecb'][i % 3];
    for (let p = 0; p < 5; p++) { g.beginPath(); g.arc(x + Math.cos(p * 1.257) * 4, y + Math.sin(p * 1.257) * 4, 3, 0, 7); inkS(col, 1.5); }
    g.beginPath(); g.arc(x, y, 2.4, 0, 7); inkS('#f2a03d', 1.5);
  }

  // one tennis ball (unfetched), one bone (chewed), one hydrant (respected)
  g.beginPath(); g.arc(872, 494, 10, 0, 7); inkS('#d9f03c', 2.6);
  g.beginPath(); g.arc(864, 494, 9, -0.9, 0.9); inkS(null, 1.8);
  g.save(); g.translate(742, 508); g.rotate(-0.3);
  g.beginPath(); g.roundRect(-15, -4, 30, 8, 3);
  for (const [bx, by] of [[-16, -5], [-16, 5], [16, -5], [16, 5]]) { g.moveTo(bx + 6, by); g.arc(bx, by, 6, 0, 7); }
  inkS('#fff', 2.4); g.restore();
  g.beginPath(); g.roundRect(46, 386, 28, 44, 5); inkS('#e8553e', 2.8);
  g.beginPath(); g.roundRect(34, 402, 52, 11, 4); inkS('#e8553e', 2.8);
  g.beginPath(); g.roundRect(41, 378, 38, 11, 5); inkS('#e8553e', 2.8);
  g.beginPath(); g.arc(60, 377, 9, Math.PI, 0); g.closePath(); inkS('#e8553e', 2.8);
  return c;
}

const CLOUD = [-44, 10, -40, -18, -10, -16, -2, -38, 36, -38, 46, -14, 74, -14, 80, 12, 52, 26, 8, 26];
function drawClouds(g, time) {
  let i = 0;
  for (const [x0, y, k, v] of [[100, 70, 1, 7], [470, 46, 0.7, 11], [700, 150, 0.8, 5]]) {
    const x = ((x0 + time * v) % (W + 260)) - 130;
    lump(g, CLOUD.map((p, j) => (j % 2 ? y + p * k : x + p * k)), '#fff', 90 + i++, 0.6, 3);
  }
}

function drawSquirrel(g, sq, time) {
  const hop = Math.abs(Math.sin(time * 15)) * 7;
  g.save(); g.translate(sq.x, FENCE_Y - 11 - hop); g.scale(sq.v > 0 ? 1.15 : -1.15, 1.15);
  lump(g, [-8, 6, -34, 12, -48, -18, -34, -44, -10, -38, -22, -18, -6, -6], '#b96a2e', 3, 0.8, 2.8);
  lump(g, [-17, 2, -13, -13, 6, -15, 17, -4, 15, 11, -10, 13], '#cf8440', 5, 0.6, 2.8);
  blob(g, 15, -10, 9.5, 8.5, '#cf8440', 0, 2.8);
  blob(g, 10, -19, 3, 4.8, '#cf8440', 0.3, 2.4);
  blob(g, 18, -13.5, 5, 5, '#fff', 0, 2);
  g.fillStyle = OUT; g.beginPath(); g.arc(19.8, -13.5, 1.4, 0, 7); g.arc(24.6, -9.5, 1.5, 0, 7); g.fill();
  g.beginPath(); g.rect(21.5, -6, 2.8, 4.2); ink(g, '#fff', 1.5);
  g.restore();
}
