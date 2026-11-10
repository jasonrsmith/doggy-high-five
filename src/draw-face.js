'use strict';
// ───────────────────────── Doggy High Five: faces ─────────────────────────
// Bug eyes that never quite agree, a mouth that is mostly teeth and tongue.

function drawEar(g, d, R, front) {
  const b = d.b, col = front ? b.earC : shade(b.earC, 0.8), a = d.earA;
  g.save();
  if (b.ear === 'flop' || b.ear === 'shag') {
    g.translate(-R * 0.5, -R * 0.7); g.rotate(a * 0.9 + 0.3);
    lump(g, [-R * 0.38, -R * 0.12, R * 0.42, -R * 0.16, R * 0.52, R * 0.7, R * 0.1, R * 1.55, -R * 0.48, R * 1.38, -R * 0.62, R * 0.55], col, d.seed + 20, 0.8);
  } else {
    const bat = b.ear === 'bat', hgt = bat ? R * 1.7 : R * 1.05, wid = bat ? R * 0.7 : R * 0.46;
    g.translate(-R * (front ? 0.5 : 0.05), -R * 0.75); g.rotate(a * 0.35 - (bat ? 0.55 : 0.25));
    g.beginPath(); g.moveTo(-wid, R * 0.25); g.quadraticCurveTo(-wid * 0.7, -hgt * 0.8, jit(d.seed, 21, 1), -hgt);
    g.quadraticCurveTo(wid * 0.9, -hgt * 0.45, wid, R * 0.25); g.closePath(); ink(g, col);
    if (bat && front) {
      g.beginPath(); g.moveTo(-wid * 0.45, R * 0.15); g.quadraticCurveTo(-wid * 0.3, -hgt * 0.6, 0, -hgt * 0.78);
      g.quadraticCurveTo(wid * 0.5, -hgt * 0.35, wid * 0.5, R * 0.15); g.closePath(); g.fillStyle = '#f3a9a0'; g.fill();
    }
  }
  g.restore();
}

function drawEyes(g, d, R, time) {
  const m = d.mood, sd = d.seed;
  const k = m === 'alert' ? 1.3 : m === 'eager' ? 1.15 : m === 'derp' ? 1.12 : m === 'sad' || m === 'snooty' ? 0.92 : 1;
  const eyes = [[R * 0.76, -R * 0.76, R * 0.3 * k, 1], [R * 0.2, -R * 0.72, R * 0.4 * k, 0]];   // far eye, then near eye
  for (const [x, y, rad, farEye] of eyes) {
    if (m === 'squint') {   // ✕ ✕
      g.beginPath(); g.moveTo(x - rad * 0.6, y - rad * 0.6); g.lineTo(x + rad * 0.6, y + rad * 0.6);
      g.moveTo(x + rad * 0.6, y - rad * 0.6); g.lineTo(x - rad * 0.6, y + rad * 0.6); ink(g, null, 3.4);
      continue;
    }
    if (m === 'joy' || (d.blink < 0 && m !== 'alert' && m !== 'derp')) {
      g.beginPath(); g.arc(x, y + rad * 0.3, rad * 0.75, Math.PI * 1.12, Math.PI * 1.88); ink(g, null, 3.4);
      continue;
    }
    blob(g, x + jit(sd, 40 + farEye, 0.5), y + jit(sd, 42 + farEye, 0.5), rad, rad * 0.96, '#fff', 0, 2.8);
    let px = rad * 0.38, py = rad * 0.05, pr = rad * 0.2;
    if (m === 'alert') { pr = rad * 0.1; px = rad * 0.3; }
    else if (m === 'eager') { pr = rad * 0.15; px = rad * 0.45; }
    else if (m === 'derp') { const a = time * 7 * (farEye ? -1 : 1) + farEye * 2; px = Math.cos(a) * rad * 0.5; py = Math.sin(a) * rad * 0.5; pr = rad * 0.16; }
    else if (m === 'sad') { px = rad * 0.2; py = rad * 0.45; }
    else if (m === 'snooty') { px = -rad * 0.35; py = rad * 0.1; }
    else { px += farEye ? rad * 0.12 : -rad * 0.12; py += farEye ? -rad * 0.22 : rad * 0.16; }   // permanently a bit wall-eyed
    g.fillStyle = OUT; g.beginPath(); g.arc(x + px, y + py, pr, 0, 7); g.fill();
    if (m === 'sad' || m === 'snooty') {   // heavy eyelid
      g.beginPath(); g.arc(x, y, rad, Math.PI * (m === 'sad' ? 1.12 : 0.98), Math.PI * (m === 'sad' ? 1.98 : 2.02)); g.closePath(); ink(g, d.b.fur, 2.6);
    }
    if (m === 'eager') { g.beginPath(); g.moveTo(x - rad * 0.7, y - rad * 1.25); g.lineTo(x + rad * 0.5, y - rad * 1.5); ink(g, null, 3.2); }
  }
  if (m === 'alert') {   // !!!
    g.beginPath();
    for (const a of [-2.0, -1.5, -1.0]) { g.moveTo(R * 0.3 + Math.cos(a) * R * 1.75, -R * 0.4 + Math.sin(a) * R * 1.75); g.lineTo(R * 0.3 + Math.cos(a) * R * 2.2, -R * 0.4 + Math.sin(a) * R * 2.2); }
    ink(g, null, 3);
  }
}

function drawFace(g, d, time) {
  const b = d.b, R = b.headR * 1.28, S = b.snout * 0.95, hd = d.dir * d.headDir, sd = d.seed, m = d.mood;
  const yap = clamp(1 - (time - (d.yapAt === undefined ? -9 : d.yapAt)) / 0.3, 0, 1);
  let open = m === 'joy' ? 0.95 : m === 'eager' ? 0.8 : m === 'derp' ? 0.7 : m === 'alert' ? 0.3 : m === 'happy' ? 0.42 + 0.2 * Math.sin(time * 15 + sd) : 0;
  open = Math.max(open, yap);
  const gx = -Math.sin(d.faceA), gyv = Math.cos(d.faceA);   // which way is "down" inside this tilted head
  g.save(); g.translate(d.head.x, d.head.y); g.scale(hd, 1); g.rotate(-d.faceA);
  const pointy = b.ear === 'point' || b.ear === 'bat';
  if (pointy) drawEar(g, d, R, false);

  // ── lower jaw, mouth cave, teeth, tongue, drool: all tucked under the muzzle ──
  const cx = 0, cy = R * 0.42, tx = R * 0.55 + S, ty = R * 0.36;
  const a0 = Math.atan2(ty - cy, tx - cx), len = Math.hypot(tx - cx, ty - cy), ja = a0 + open * 0.66;
  const jex = Math.cos(ja), jey = Math.sin(ja), jx = cx + jex * len * 0.9, jy = cy + jey * len * 0.9;
  if (open > 0.06) {
    g.save(); g.translate(cx, cy); g.rotate(ja);
    lump(g, [-R * 0.2, -R * 0.1, len * 0.5, -R * 0.12, len, -R * 0.02, len * 0.98, R * 0.3, len * 0.45, R * 0.42, -R * 0.25, R * 0.4], b.belly, sd + 11, 0.7);
    g.restore();
    g.beginPath(); g.moveTo(cx - R * 0.1, cy); g.lineTo(tx, ty); g.lineTo(jx, jy); g.closePath(); ink(g, '#7b1626');
    const ex = (tx - cx) / len, ey = (ty - cy) / len, tw = len * 0.12, tl = Math.min(R * 0.26, open * R * 0.55);
    g.fillStyle = '#fff'; g.lineWidth = 1.8; g.strokeStyle = OUT;
    for (let i = 0; i < 4; i++) {   // top teeth
      const t0 = 0.36 + i * 0.155, x0 = cx + ex * len * t0, y0 = cy + ey * len * t0;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + ex * tw, y0 + ey * tw); g.lineTo(x0 + ex * tw - ey * tl, y0 + ey * tw + ex * tl); g.lineTo(x0 - ey * tl, y0 + ex * tl); g.closePath(); g.fill(); g.stroke();
    }
    if (open > 0.25 && m !== 'alert') {   // tongue flops over the lip and hangs wherever gravity says
      const sx = cx + jex * len * 0.3, sy = cy + jey * len * 0.3, hx = jx + jex * R * 0.1, hy = jy + jey * R * 0.1;
      const tl2 = R * (0.38 + 0.1 * Math.sin(time * 15 + sd));
      noodle(g, sx, sy, hx - gx * R * 0.08, hy - gyv * R * 0.08, hx + gx * tl2 + R * (0.15 + d.dang * 0.5), hy + gyv * tl2, R * 0.23, '#f4849b');
    }
    if (m === 'happy' || m === 'eager' || m === 'derp') {   // drool
      const dl = R * (0.3 + 0.22 * Math.sin(time * 2.3 + sd)), dx0 = cx + jex * len * 0.55, dy0 = cy + jey * len * 0.55 + R * 0.3;
      g.beginPath(); g.moveTo(dx0, dy0); g.lineTo(dx0 + gx * dl, dy0 + gyv * dl); ink(g, null, 2);
      blob(g, dx0 + gx * (dl + R * 0.1), dy0 + gyv * (dl + R * 0.1), R * 0.1, R * 0.12, '#d6f1fa', 0, 2);
    }
  }

  // ── skull + muzzle, one lumpy shape ──
  const H = wobble([-R, -R * 0.1, -R * 0.6, -R * 1.05, R * 0.45, -R * 1.02, R * 0.8 + S * 0.2, -R * 0.42, R * 0.62 + S * 1.08, -R * 0.32,
    R * 0.62 + S * 1.12, R * 0.4, R * 0.3 + S * 0.3, R * 0.54, -R * 0.1, R, -R * 0.95, R * 0.72], sd + 3, 0.9);
  g.save(); blobPath(g, H); g.fillStyle = b.fur; g.fill(); g.clip();
  g.beginPath(); g.ellipse(R * 0.66 + S * 0.6, R * 0.22, S * 0.8 + R * 0.25, R * 0.54, 0, 0, 7); g.fillStyle = b.belly; g.fill();
  g.restore(); blobPath(g, H); ink(g, null);
  if (open <= 0.06) {   // closed mouth: a line with an opinion
    const sad = m === 'sad';
    g.beginPath(); g.moveTo(cx + R * 0.2, cy + (sad ? R * 0.14 : 0)); g.quadraticCurveTo((cx + tx) / 2, cy + (sad ? -R * 0.1 : R * 0.16), tx - R * 0.08, ty); ink(g, null, 2.8);
  }
  blob(g, R * 0.64 + S, -R * 0.2, R * 0.27, R * 0.21, OUT, 0.1, 0);
  blob(g, R * 0.6 + S, -R * 0.27, R * 0.08, R * 0.05, '#fff', 0, 0);
  g.fillStyle = OUT;
  for (const [wx, wy] of [[0.45, 0.1], [0.62, 0.2], [0.42, 0.29]]) { g.beginPath(); g.arc(R * 0.62 + S * wx, R * wy, 1.5, 0, 7); g.fill(); }

  if (b.shag) {   // a mop where the eyes should be
    lump(g, [-R * 0.55, -R * 1.2, R * 0.5, -R * 1.3, R * 1.1, -R * 0.65, R * 1.0, -R * 0.02, R * 0.45, -R * 0.2, -R * 0.05, -R * 0.32, -R * 0.65, -R * 0.6], '#fff', sd + 7, 1.2);
    g.beginPath();
    for (const hx of [0.1, 0.45, 0.78]) { g.moveTo(R * hx, -R * 0.95); g.quadraticCurveTo(R * (hx + 0.12), -R * 0.6, R * (hx + 0.02), -R * 0.32); }
    ink(g, null, 2);
  } else drawEyes(g, d, R, time);
  drawEar(g, d, R, true);
  g.restore();
}

function drawEmote(g, d) {
  const e = d.emote; if (!e) return;
  const k = Math.min(1, (e.max - e.t) * 9, e.t * 6), R = d.b.headR * 1.28, s = e.text.toUpperCase();
  g.save();
  g.translate(d.head.x - d.dir * 6, d.head.y - R * 1.5 - 30); g.scale(k, k); g.rotate(-d.dir * 0.06);
  g.font = `bold 17px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(s).width / 2 + 17, h = 19, tx = d.dir * 6;
  g.beginPath(); g.moveTo(tx - 6, h * 0.8); g.lineTo(tx + d.dir * 9, h + 15); g.lineTo(tx + 7, h * 0.8); ink(g, '#fff');
  lump(g, [-w * 1.12, 0, -w * 0.85, -h * 1.25, 0, -h * 1.4, w * 0.85, -h * 1.25, w * 1.12, 0, w * 0.85, h * 1.25, 0, h * 1.4, -w * 0.85, h * 1.25], '#fff', d.seed + 30, 0.8);
  g.beginPath(); g.moveTo(tx - 3.5, h * 0.98); g.lineTo(tx + 4.5, h * 0.98); g.lineWidth = 5.5; g.strokeStyle = '#fff'; g.stroke();
  g.fillStyle = OUT; g.fillText(s, 0, 1);
  g.restore();
}
