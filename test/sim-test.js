// Headless sanity check: two dog brains try to high five each other for a while.
// Usage: node test/sim-test.js [seconds]
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = ['sim.js', 'brain.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
const ctx = { module: {}, console, Math };
vm.createContext(ctx);
vm.runInContext(src + '\nthis.X = { BREEDS, ORDER, Dog, Brain, contacts, partnerX, PX };', ctx);
const { BREEDS, ORDER, Dog, Brain, contacts, partnerX, PX } = ctx.X;

const SECS = +process.argv[2] || 120, DT = 1 / 120;
for (const key of ORDER) {
  const you = new Dog('you', 1, PX), pal = new Dog(key, -1, partnerX(BREEDS[key]));
  const autoAi = { ...BREEDS.biscuit.ai, quirk: 0, squirrel: 0 };
  const b1 = new Brain(you, pal, autoAi), b2 = new Brain(pal, you);
  const world = { time: 0, squirrel: null };
  const n = { high: 0, low: 0, boopYou: 0, boopPal: 0, flopYou: 0, flopPal: 0, swings: 0, tired: 0 };
  let cool = 0, first = null, maxPawY = 0;
  for (let i = 0; i < SECS / DT; i++) {
    world.time += DT; cool -= DT;
    b1.update(DT, world); b2.update(DT, world);
    you.step(DT); pal.step(DT);
    for (const d of [you, pal]) {
      for (const e of d.ev) {
        if (e === 'flop') n[d === you ? 'flopYou' : 'flopPal']++;
        if (e === 'swing') n.swings++;
        if (e === 'tired') n.tired++;
      }
      d.ev.length = 0;
      if (!Number.isFinite(d.th + d.al + d.ext + d.paw.x + d.paw.y)) throw new Error('NaN in ' + d.key);
    }
    if (cool > 0) continue;
    for (const c of contacts(you, pal)) {
      if (c.type === 'paw') {
        if (c.high) { n.high++; if (first === null) first = world.time; b1.idle(1); b2.idle(1); you.om -= 1; pal.om -= 1; }
        else n.low++;
        cool = 1.5;
      } else {
        n[c.on === you ? 'boopYou' : 'boopPal']++; cool = 1;
        (c.on === you ? b1 : b2).boop();
      }
      break;
    }
  }
  console.log(key.padEnd(8), 'first high five @', first === null ? '   never' : first.toFixed(1).padStart(6) + 's', JSON.stringify(n));
}
