# Doggy High Five

You are a dog. Your friend is a dog. Get a high five from five different dogs.

**Play it:** https://jasonrsmith.github.io/doggy-high-five/

Or open `index.html` in a browser. It is one self-contained file.

## Controls

| Key | What it does |
| --- | --- |
| `A` / `←` | Lean back. Hold it to rear up on your hind legs; let go before you tip over. |
| `D` / `→` | Lean forward. |
| `W` / `↑` | Lift your paw (it sags if you stop). |
| `S` / `↓` | Lower your paw. |
| `Space` | Slap. |
| `M` `P` `R` | Mute, pause, restart. |

The on-screen buttons do the same thing for mouse and touch.

## Editing

The source is in `src/`. After a change, run `node build.js` to rebuild `index.html`, then commit both.

- `node test/sim-test.js` plays two dog brains against each other and reports high fives, boops and flops.
- `node test/human-test.js` checks that a clumsy scripted player with slow reactions can still win every dog.
