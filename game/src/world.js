// EMBER BLOOM's rules and state, with no drawing and no browser in it:
// the field of drifting orbs, the sparks the player ignites, the rings
// they throw out, the chains they set off, the rounds, the score and the
// hearts. step() advances one fixed step and returns what happened as bit
// flags, so the caller can react (and play sounds) without the world
// knowing about screens or audio.

import {
  BASE_SCORE,
  BONUS,
  FIELD,
  FROST,
  HEARTS,
  HUD,
  KIND_BOMB,
  KIND_FROST,
  KIND_GOLD,
  KIND_STONE,
  KIND_STYLE,
  KIND_WEIGHTS,
  RING_FADE,
  RING_SPEED,
  SPARK,
  roundTable,
} from './config.js';
import { createRandom } from './random.js';

export const EVENT_BURST = 1;
export const EVENT_CRACK = 2;
export const EVENT_CLEAR = 4;
export const EVENT_FAIL = 8;
export const EVENT_OVER = 16;

const ORB_MIN_SEPARATION = 48;
const PARTICLES_PER_BURST = 16;
const MAX_PARTICLES = 700;
const DRIFT_MIN = 12;
const DRIFT_MAX = 30;

let ringId = 1;

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function createWorld(random) {
  const rng = random ?? createRandom((Math.random() * 4294967296) >>> 0);
  const state = {
    playing: false,
    round: 1,
    target: 0,
    burst: 0,
    sparksLeft: 0,
    hearts: HEARTS,
    score: 0,
    best: 0,
    chain: 0,
    bestChain: 0,
    slow: 0,
    shake: 0,
    time: 0,
    orbs: [],
    rings: [],
    particles: [],
    popups: [],
    cascadeActive: false,
    lastBurst: { chain: 0, kind: 0 },
    lastBonus: { spark: 0, heart: 0, total: 0 },
  };

  function dealOrbs(count) {
    state.orbs = [];
    for (let index = 0; index < count; index += 1) {
      let x = 0;
      let y = 0;
      let placed = false;
      for (let attempt = 0; attempt < 24 && !placed; attempt += 1) {
        x = rng.range(50, FIELD.width - 50);
        y = rng.range(HUD.height + 50, FIELD.height - 50);
        placed = true;
        for (const other of state.orbs) {
          if (distance(x, y, other.x, other.y) < ORB_MIN_SEPARATION) {
            placed = false;
            break;
          }
        }
      }
      const angle = rng.range(0, Math.PI * 2);
      const speed = rng.range(DRIFT_MIN, DRIFT_MAX);
      state.orbs.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: rng.range(13, 18),
        kind: rng.weighted(KIND_WEIGHTS),
        phase: rng.range(0, Math.PI * 2),
        wobble: rng.range(4, 10),
        alive: true,
        cracked: false,
        touchedBy: 0,
      });
    }
  }

  function dealRound(round) {
    const table = roundTable(round);
    state.round = round;
    state.target = table.target;
    state.burst = 0;
    state.sparksLeft = table.sparks;
    state.chain = 0;
    state.rings = [];
    state.popups = [];
    state.cascadeActive = false;
    dealOrbs(table.orbs);
  }

  function reset() {
    state.score = 0;
    state.hearts = HEARTS;
    state.bestChain = 0;
    state.slow = 0;
    state.shake = 0;
    state.cascadeActive = false;
    state.particles = [];
    state.popups = [];
    state.rings = [];
    dealRound(1);
  }

  function addParticles(x, y, color, count, power) {
    for (let index = 0; index < count; index += 1) {
      if (state.particles.length >= MAX_PARTICLES) return;
      const angle = rng.range(0, Math.PI * 2);
      const speed = rng.range(30, 90) * power;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rng.range(0.45, 0.9),
        max: 0.9,
        size: rng.range(2, 5),
        color,
      });
    }
  }

  function addPopup(x, y, text, color, size) {
    state.popups.push({ x, y, text, color, size: size ?? 20, life: 1.1, max: 1.1 });
    if (state.popups.length > 24) state.popups.shift();
  }

  /** Burst one orb: score it, throw its ring, light up the sky. */
  function burstOrb(orb) {
    orb.alive = false;
    state.burst += 1;
    state.chain += 1;
    state.bestChain = Math.max(state.bestChain, state.chain);
    const style = KIND_STYLE[orb.kind];
    const gained = BASE_SCORE * state.chain * style.score;
    state.score += gained;
    state.lastBurst = { chain: state.chain, kind: orb.kind };
    addParticles(orb.x, orb.y, style.core, PARTICLES_PER_BURST, orb.kind === KIND_BOMB ? 2 : 1);
    addParticles(orb.x, orb.y, '#ffffff', 4, 0.7);
    addPopup(orb.x, orb.y - 14, `+${gained}`, orb.kind === KIND_GOLD ? '#ffe066' : '#ffffff', orb.kind === KIND_GOLD ? 24 : 19);
    state.rings.push({
      id: ringId++,
      x: orb.x,
      y: orb.y,
      r: 6,
      maxR: style.radius,
      fade: 0,
      color: style.glow,
    });
    if (orb.kind === KIND_FROST) state.slow = FROST.seconds;
    if (orb.kind === KIND_BOMB) state.shake = Math.min(state.shake + 7, 14);
  }

  /** A ring touches an orb: crack stone, or burst it. Returns true on a burst. */
  function touchOrb(orb, ring) {
    if (!orb.alive || orb.touchedBy === ring.id) return false;
    if (distance(orb.x, orb.y, ring.x, ring.y) > ring.r + 8) return false;
    orb.touchedBy = ring.id;
    if (orb.kind === KIND_STONE && !orb.cracked) {
      orb.cracked = true;
      addParticles(orb.x, orb.y, '#c9c9d4', 6, 0.6);
      return 'crack';
    }
    burstOrb(orb);
    return 'burst';
  }

  /**
   * Ignite a spark where the player points. Returns false when no spark
   * is left (the caller then plays no sound and spends nothing).
   */
  function sparkAt(x, y) {
    if (!state.playing || state.sparksLeft <= 0) return false;
    state.sparksLeft -= 1;
    state.cascadeActive = true;
    state.rings.push({
      id: ringId++,
      x: Math.max(10, Math.min(FIELD.width - 10, x)),
      y: Math.max(HUD.height + 10, Math.min(FIELD.height - 10, y)),
      r: 6,
      maxR: SPARK.radius,
      fade: 0,
      color: '#ffb347',
    });
    addParticles(x, y, '#ffb347', 8, 0.8);
    return true;
  }

  function step(dt) {
    let events = 0;
    state.time += dt;
    if (state.slow > 0) state.slow = Math.max(0, state.slow - dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - 26 * dt);
    const drift = state.slow > 0 ? FROST.factor : 1;

    for (const orb of state.orbs) {
      if (!orb.alive) continue;
      orb.x += orb.vx * drift * dt;
      orb.y += orb.vy * drift * dt;
      if (orb.x < -30) orb.x += FIELD.width + 60;
      else if (orb.x > FIELD.width + 30) orb.x -= FIELD.width + 60;
      if (orb.y < HUD.height - 30) orb.y += FIELD.height - HUD.height + 60;
      else if (orb.y > FIELD.height + 30) orb.y -= FIELD.height - HUD.height + 60;
    }

    if (state.playing) {
      for (const ring of state.rings) {
        if (ring.r < ring.maxR) {
          ring.r = Math.min(ring.maxR, ring.r + RING_SPEED * dt);
          for (const orb of state.orbs) {
            const result = touchOrb(orb, ring);
            if (result === 'burst') events |= EVENT_BURST;
            else if (result === 'crack') events |= EVENT_CRACK;
          }
        } else {
          ring.fade += dt;
        }
      }
      state.rings = state.rings.filter((ring) => ring.fade < RING_FADE);

      if (state.cascadeActive && state.rings.length === 0) {
        state.cascadeActive = false;
        state.chain = 0;
        if (state.burst >= state.target) {
          const sparkBonus = state.sparksLeft * BONUS.spark;
          const heartBonus = state.hearts * BONUS.heart;
          state.lastBonus = { spark: sparkBonus, heart: heartBonus, total: sparkBonus + heartBonus };
          state.score += state.lastBonus.total;
          events |= EVENT_CLEAR;
        } else if (state.sparksLeft <= 0) {
          state.hearts -= 1;
          events |= state.hearts <= 0 ? EVENT_OVER : EVENT_FAIL;
        }
      }
    }

    for (const particle of state.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 1 - 1.6 * dt;
      particle.vy *= 1 - 1.6 * dt;
      particle.life -= dt;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);

    for (const popup of state.popups) {
      popup.y -= 34 * dt;
      popup.life -= dt;
    }
    state.popups = state.popups.filter((popup) => popup.life > 0);

    return events;
  }

  return { state, reset, dealRound, sparkAt, step };
}
