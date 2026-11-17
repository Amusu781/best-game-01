// EMBER BLOOM boot and the one loop: input is read every frame, the world
// advances in fixed 1/60 s steps (several in a slow frame, none in a fast
// one), and the renderer paints what is there. The game moves between five
// screens: title, play, paused, round clear and game over.
//
// ?seed=N fixes the dealt field. ?shot=start|play|clear|over (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, ACTION_SPARK, createInput } from './input.js';
import { EVENT_BURST, EVENT_CLEAR, EVENT_CRACK, EVENT_FAIL, EVENT_OVER, createWorld } from './world.js';
import { KIND_BOMB, KIND_FROST } from './config.js';
import { SCREEN_CLEAR, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;
/** Seconds the round-clear screen shows before the next round deals itself. */
const CLEAR_HOLD_SECONDS = 2.8;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

/** A read-only handle for automated play-testing (used by shots and tests). */
window.__emberBloom = { get state() { return world.state; } };
renderer.resize();
window.addEventListener('resize', () => renderer.resize());

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world, seed);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, { x: 640, y: 400 });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let clearTimer = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    audio.click();
    world.reset();
    world.state.playing = true;
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Playing. Round 1. Burst ${world.state.target} embers with ${world.state.sparksLeft} sparks.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Game over. Score ${world.state.score}. Best ${best}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_BURST) {
      audio.pop(world.state.lastBurst.chain);
      if (world.state.lastBurst.kind === KIND_BOMB) audio.boom();
      else if (world.state.lastBurst.kind === KIND_FROST) audio.chime();
    }
    if (events & EVENT_CRACK) audio.crack();
    if (events & EVENT_CLEAR) {
      audio.clear();
      screen = SCREEN_CLEAR;
      clearTimer = 0;
      announce(`Round ${world.state.round} clear. Bonus ${world.state.lastBonus.total}.`);
    } else if (events & EVENT_OVER) {
      audio.over();
      endGame();
    } else if (events & EVENT_FAIL) {
      audio.hurt();
      world.dealRound(world.state.round);
      announce(world.state.hearts === 1 ? 'Round failed. 1 heart left.' : `Round failed. ${world.state.hearts} hearts left.`);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      audio.setMuted(!audio.isMuted());
      announce(audio.isMuted() ? 'Sound off.' : 'Sound on.');
    }
    if (screen === SCREEN_TITLE) {
      if (actions & ACTION_CONFIRM) startGame();
    } else if (screen === SCREEN_PLAY) {
      if (actions & ACTION_PAUSE) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (actions & ACTION_RESTART) {
        startGame();
      } else if (actions & ACTION_SPARK) {
        const aim = input.aim();
        if (world.sparkAt(aim.x, aim.y)) {
          audio.unlock();
          audio.spark();
        }
      }
    } else if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      } else if (actions & ACTION_RESTART) {
        startGame();
      }
    } else if (screen === SCREEN_CLEAR) {
      if (actions & ACTION_CONFIRM) {
        world.dealRound(world.state.round + 1);
        screen = SCREEN_PLAY;
        announce(`Round ${world.state.round}.`);
      }
    } else if (screen === SCREEN_OVER) {
      if (actions & ACTION_CONFIRM) startGame();
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP);
      return;
    }
    if (screen !== SCREEN_PLAY && screen !== SCREEN_CLEAR) return;
    handleEvents(world.step(STEP));
    if (screen === SCREEN_CLEAR) {
      clearTimer += STEP;
      if (clearTimer >= CLEAR_HOLD_SECONDS) {
        world.dealRound(world.state.round + 1);
        screen = SCREEN_PLAY;
        announce(`Round ${world.state.round}.`);
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY || screen === SCREEN_CLEAR)) {
      step();
      accumulator -= STEP;
    }
    if (screen !== SCREEN_TITLE && screen !== SCREEN_PLAY && screen !== SCREEN_CLEAR) accumulator = 0;
    renderer.draw(world.state, screen, best, input.aim());
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  world.reset();
  announce('Ember Bloom. Click or press Space to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
