# EMBER BLOOM

A chain-reaction arcade game for the make.fun best-game-01 bounty.

A night sky fills with drifting ember orbs. Click to ignite a spark: a ring
of fire expands from it, every ember it touches bursts, and every burst
throws out its own ring. One good spark can clear half the sky. Burst the
round's target before your sparks run out, or lose a heart. Three hearts,
then the game is over.

## Play it

```
node serve.ts
```

Open http://localhost:8080 in desktop Chrome. Mouse to aim, click or
Space to spark, P to pause, M to mute, R to restart.

## How it is built

- `game/index.html` — the page: a full-window canvas, nothing else.
- `game/src/config.js` — field size, tuning, palette, round table.
- `game/src/random.js` — seeded random numbers.
- `game/src/audio.js` — every sound, synthesised with WebAudio.
- `game/src/input.js` — mouse and keyboard, turned into actions.
- `game/src/world.js` — the rules: orbs, sparks, rings, chains, rounds.
- `game/src/render.js` — everything drawn: sky, orbs, rings, HUD, screens.
- `game/src/shots.js` — the screenshot scenes: an autopilot plays the real
  rules forward so each shot is a frame of a real game.
- `game/src/main.js` — boot, the loop, the screen state machine.
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the kit's library
  (`vendor/makefun-game.ts`, unchanged).

No library, no build step, no network request. `?seed=N` fixes the dealt
field; `?shot=start|play|clear|over&seed=N` stages a screenshot scene.

## License

MIT — see LICENSE.
