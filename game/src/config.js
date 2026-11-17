// EMBER BLOOM tuning: the field, the palette, the rounds, the orbs.
// Every number the game balances on lives here, so tuning is one file.

/** The logical playfield in pixels. The canvas scales to fit the window. */
export const FIELD = { width: 1280, height: 800 };

/** Fixed simulation step, seconds. */
export const STEP = 1 / 60;

/** localStorage key for the best score. */
export const BEST_KEY = 'ember-bloom-best';

/** Orb kinds. */
export const KIND_EMBER = 0;
export const KIND_GOLD = 1;
export const KIND_FROST = 2;
export const KIND_BOMB = 3;
export const KIND_STONE = 4;

/** How often each kind appears when a round is dealt (weights, not percents). */
export const KIND_WEIGHTS = [
  [KIND_EMBER, 68],
  [KIND_GOLD, 8],
  [KIND_FROST, 8],
  [KIND_BOMB, 6],
  [KIND_STONE, 10],
];

/** Orb look and behaviour by kind. radius is the burst ring's reach. */
export const KIND_STYLE = {
  [KIND_EMBER]: { name: 'ember', core: '#ffb347', glow: '#ff7b1c', radius: 115, score: 1 },
  [KIND_GOLD]: { name: 'gold', core: '#ffe066', glow: '#f5b301', radius: 115, score: 3 },
  [KIND_FROST]: { name: 'frost', core: '#a8e6ff', glow: '#3fa9f5', radius: 115, score: 1 },
  [KIND_BOMB]: { name: 'bomb', core: '#ff5d5d', glow: '#d90429', radius: 220, score: 1 },
  [KIND_STONE]: { name: 'stone', core: '#c9c9d4', glow: '#6c6c7d', radius: 115, score: 1 },
};

/** Rounds: orbs on the field, burst target, sparks handed out. */
export function roundTable(round) {
  const r = Math.max(1, round);
  return {
    orbs: Math.min(26 + (r - 1) * 4, 64),
    target: 14 + (r - 1) * 3,
    sparks: Math.min(3 + Math.floor((r - 1) / 2), 6),
  };
}

/** A spark's own ring: how far it reaches and how fast it grows. */
export const SPARK = { radius: 125, speed: 300 };

/** Rings grow at this many pixels per second. */
export const RING_SPEED = 280;

/** How long a burst's ring lives, seconds, once it reaches full size. */
export const RING_FADE = 0.25;

/** Frost slows the drift this much, for this many seconds. */
export const FROST = { factor: 0.45, seconds: 4 };

/** Score: a burst pays 10 times its position in the chain. */
export const BASE_SCORE = 10;

/** Round-clear bonus: per unused spark, per heart left. */
export const BONUS = { spark: 50, heart: 25 };

/** Hearts per game. */
export const HEARTS = 3;

/** The palette. */
export const PALETTE = {
  skyTop: '#0b0620',
  skyBottom: '#241040',
  nebulaA: 'rgba(124, 58, 237, 0.20)',
  nebulaB: 'rgba(236, 72, 153, 0.14)',
  nebulaC: 'rgba(56, 189, 248, 0.12)',
  hudPanel: 'rgba(10, 6, 32, 0.62)',
  hudLine: 'rgba(255, 255, 255, 0.14)',
  text: '#f5f3ff',
  textDim: '#b8a8e8',
  accent: '#ffb347',
  accent2: '#ff5d8f',
  gold: '#ffe066',
  danger: '#ff5d5d',
  good: '#7dffa8',
};

export const HUD = { height: 64, pad: 18 };
