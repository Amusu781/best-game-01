// The screenshot scenes behind ?shot=start|play|clear|over. Each one plays
// the real rules forward from a fresh world, steered by a simple autopilot,
// so every frame is what a real game looks like — and the same seed always
// gives the same frame. The play pilot sparks at the densest cluster; the
// end pilot sparks at the emptiest spot, so it loses the way a hurried
// player does.

import { FIELD, STEP } from './config.js';
import { EVENT_CLEAR, EVENT_FAIL, EVENT_OVER } from './world.js';
import { SCREEN_CLEAR, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createRandom } from './random.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 40;
const CLEAR_LIMIT_SECONDS = 150;
const OVER_LIMIT_SECONDS = 300;
const SPARK_GAP_SECONDS = 0.9;
const CLUSTER_RADIUS = 150;

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/** The alive orb with the most neighbours inside the cluster radius. */
function bestCluster(world) {
  const orbs = world.state.orbs.filter((orb) => orb.alive);
  let best = null;
  let bestCount = -1;
  for (const orb of orbs) {
    let count = 0;
    for (const other of orbs) {
      if (distance(orb.x, orb.y, other.x, other.y) <= CLUSTER_RADIUS) count += 1;
    }
    if (count > bestCount) {
      bestCount = count;
      best = orb;
    }
  }
  return best ?? { x: FIELD.width / 2, y: FIELD.height / 2 };
}

/** Advance the world one step, dealing with a round ending the way the game does. */
function stepWorld(world, dt) {
  const events = world.step(dt);
  if (events & EVENT_CLEAR) world.dealRound(world.state.round + 1);
  else if (events & EVENT_FAIL) world.dealRound(world.state.round);
  else if (events & EVENT_OVER) {
    world.reset();
    world.state.playing = true;
  }
  return events;
}

/**
 * Set `world` to the named scene (start, play, clear or over) and return
 * the screen to draw over it and the best score to show.
 */
export function stageShot(name, world, seed) {
  const random = createRandom(seed ?? 7);
  world.reset();
  if (name !== 'play' && name !== 'clear' && name !== 'over') {
    world.state.playing = false;
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP);
    return { screen: SCREEN_TITLE, best: 0 };
  }

  world.state.playing = true;
  if (name === 'play') {
    let simTime = 0;
    let lastSpark = -SPARK_GAP_SECONDS;
    while (simTime < PLAY_SECONDS) {
      if (world.state.rings.length === 0 && world.state.sparksLeft > 0 && simTime - lastSpark >= SPARK_GAP_SECONDS) {
        const point = bestCluster(world);
        world.sparkAt(point.x, point.y);
        lastSpark = simTime;
        // Let the cascade run until it is at its busiest (chain 6 or more),
        // so the frame shows rings, particles and the chain counter.
        let cascadeTime = 0;
        while (cascadeTime < 0.9 && world.state.rings.length > 0 && world.state.chain < 6) {
          stepWorld(world, STEP);
          cascadeTime += STEP;
        }
        simTime += cascadeTime;
        if (simTime > 8) return { screen: SCREEN_PLAY, best: world.state.score };
        continue;
      }
      stepWorld(world, STEP);
      simTime += STEP;
    }
    return { screen: SCREEN_PLAY, best: world.state.score };
  }

  if (name === 'clear') {
    let simTime = 0;
    let lastSpark = -SPARK_GAP_SECONDS;
    while (simTime < CLEAR_LIMIT_SECONDS) {
      if (world.state.rings.length === 0 && world.state.sparksLeft > 0 && simTime - lastSpark >= SPARK_GAP_SECONDS) {
        const point = bestCluster(world);
        world.sparkAt(point.x, point.y);
        lastSpark = simTime;
      }
      const events = world.step(STEP);
      simTime += STEP;
      if (events & EVENT_CLEAR) return { screen: SCREEN_CLEAR, best: world.state.score };
      if (events & EVENT_FAIL) world.dealRound(world.state.round);
      else if (events & EVENT_OVER) {
        world.reset();
        world.state.playing = true;
      }
    }
    return { screen: SCREEN_PLAY, best: world.state.score };
  }

  let simTime = 0;
  let lastSpark = -SPARK_GAP_SECONDS;
  while (simTime < OVER_LIMIT_SECONDS) {
    if (world.state.rings.length === 0 && world.state.sparksLeft > 0 && simTime - lastSpark >= SPARK_GAP_SECONDS) {
      // A careless player sparks at random instead of aiming at a cluster:
      // some bursts happen, but never enough to clear a round.
      const point = { x: random.range(80, FIELD.width - 80), y: random.range(140, FIELD.height - 80) };
      world.sparkAt(point.x, point.y);
      lastSpark = simTime;
    }
    const events = world.step(STEP);
    simTime += STEP;
    if (events & EVENT_OVER) return { screen: SCREEN_OVER, best: world.state.score };
    if (events & EVENT_FAIL) world.dealRound(world.state.round);
  }
  return { screen: SCREEN_OVER, best: world.state.score };
}
