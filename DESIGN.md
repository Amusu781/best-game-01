# EMBER BLOOM — design

## The game
A chain-reaction arcade game. A night sky fills with drifting ember orbs.
You hold a few sparks per round. Click (or press Space) to ignite a spark
where your cursor is: a ring of fire expands from it, and every orb it
touches bursts — and every burst throws out its own ring. One good spark can
clear half the sky. Burst at least the round's target number of orbs before
your sparks run out, or lose a heart. Three hearts, then the game is over.

## Why this game
- It reads at a glance: glowing orbs, expanding rings, a chain counter
  climbing. A single screenshot shows the whole loop.
- It is easy to start and hard to master: where you place a spark decides
  everything, and the special orbs (gold, frost, bomb, stone) make every
  round a small puzzle.
- It is original: no copied characters, art, music or levels. Every pixel
  is drawn in code, every sound is synthesised in code.

## Rules
- Each round: a field of drifting orbs and a burst target. Sparks are
  limited (3 at first, more on later rounds).
- A burst scores 10 points times the chain position (the 1st burst of a
  cascade scores 10, the 2nd 20, the 10th 100). Gold orbs score triple.
- Orb types: ember (plain), gold (3x points), frost (slows the drift for
  a few seconds), bomb (double-size ring), stone (armoured — needs two
  touches to burst).
- Clear the target and the round ends with a bonus: 50 points per unused
  spark, 25 per heart left. Miss the target with no sparks left and you
  lose a heart and replay the round. Lose all three hearts and the game
  ends. The best score is kept between visits.

## Controls
- Mouse: aim. Click or Space: ignite a spark. P or Esc: pause. M: mute.
  R: restart. Enter or click: start / play again.

## Feel
- WebAudio synthesis: a pop that rises in pitch as the chain grows, a
  low boom for bombs, a chime for frost, a little arpeggio when a round
  clears. A soft ambient pad underneath, off when muted.
- Juice: screen shake on big chains, particles on every burst, floating
  score popups, a big chain counter when a cascade gets going.

## Structure (one job per file)
- `src/config.js` — field size, tuning, palette, round table.
- `src/random.js` — seeded random numbers.
- `src/audio.js` — all sound, synthesised with WebAudio.
- `src/input.js` — mouse and keyboard, turned into actions.
- `src/world.js` — the rules: orbs, sparks, rings, chains, rounds, score.
- `src/render.js` — everything drawn: sky, orbs, rings, HUD, screens.
- `src/shots.js` — the screenshot scenes: an autopilot plays the real
  rules forward so each shot is a frame of a real game.
- `src/main.js` — boot, the loop, the screen state machine.
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the kit's library.

## Screenshots
- `1-title.jpg` — the title screen: name, goal, controls, best score.
- `2-play.jpg` — mid-game: a chain going off, HUD, sparks and hearts.
- `3-clear.jpg` — a round cleared, with the bonus.
- `4-over.jpg` — game over, with the final score and restart prompt.
