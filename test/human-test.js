// A clumsy scripted "human": coarse on/off keys, 0.22s reaction time. Can it still win?
// Usage: node test/human-test.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = ['sim.js', 'brain.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
const ctx = { module: {}, console, Math }; vm.createContext(ctx);
vm.runInContext(src + '\nthis.X = { BREEDS, ORDER, Dog, Brain, contacts, partnerX, PX };', ctx);
const { BREEDS, ORDER, Dog, Brain, contacts, partnerX, PX } = ctx.X, DT = 1 / 120, LAG = Math.round(0.22 / DT);

for (const key of ORDER) {
  const times = []; let flops = 0, boops = 0;
  for (let trial = 0; trial < 12; trial++) {
    const you = new Dog('you', 1, PX), pal = new Dog(key, -1, partnerX(BREEDS[key]));
    const brain = new Brain(pal, you), world = { time: 0, squirrel: null }, seen = [];
    let done = null, cool = 0;
    for (let i = 0; i < 90 / DT && done === null; i++) {
      world.time += DT; cool -= DT;
      // the human sees the world 0.22s late
      seen.push({ th: you.th, al: you.al, hype: ['wiggle', 'up', 'offer'].includes(brain.s), px: pal.paw.x, py: pal.paw.y, off: pal.offering, yx: you.paw.x, yy: you.paw.y, sx: you.sh.x, sy: you.sh.y });
      const s = seen[Math.max(0, seen.length - 1 - LAG)], inp = you.inp;
      inp.lean = 0; inp.paw = 0; inp.slap = false;
      if (s.hype && you.tired <= 0) {
        if (s.th < 1.15) inp.lean = 1; else if (s.th > 1.65) inp.lean = -1;
        const want = s.off ? Math.atan2(s.px - s.sx, s.py - s.sy) : 1.9;
        if (s.th > 0.6) inp.paw = s.al < want - 0.15 ? 1 : s.al > want + 0.3 ? -1 : 0;
        if (s.off && Math.hypot(s.px - s.yx, s.py - s.yy) < 70 && i % 30 === 0) inp.slap = true;   // mash-ish
      } else if (s.th > 0.1) inp.lean = -1;
      brain.update(DT, world); you.step(DT); pal.step(DT);
      if (you.ev.includes('flop')) flops++;
      you.ev.length = 0; pal.ev.length = 0;
      if (cool > 0) continue;
      for (const c of contacts(you, pal)) {
        if (c.type === 'paw' && c.high) done = world.time;
        else if (c.type === 'boop') { boops++; cool = 0.9; if (c.on === pal) brain.boop(); else you.stun = 0.7; }
        else cool = 1.5;
        break;
      }
    }
    times.push(done === null ? 'FAIL' : done.toFixed(0));
  }
  console.log(key.padEnd(8), 'secs to high five:', times.join(' '), '| flops', flops, 'boops', boops);
}
