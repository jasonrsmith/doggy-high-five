// Bundles src/* into one self-contained file: index.html (what GitHub Pages serves)
// Usage: node build.js
const fs = require('fs'), path = require('path');
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const order = ['sim.js', 'brain.js', 'draw-dog.js', 'draw-face.js', 'draw-bg.js', 'draw-fx.js', 'audio.js', 'game-core.js', 'game-ui.js'];
const js = order.map((f) => `// ═══ ${f} ═══\n` + src(f).replace(/^'use strict';\n/, '')).join('\n');
const html = src('shell.html').replace('/*BUNDLE*/', () => "'use strict';\n(() => {\n" + js + '\n})();');
const out = path.join(__dirname, 'index.html');
fs.writeFileSync(out, html);
console.log('wrote', out, (html.length / 1024).toFixed(1) + ' KB');
