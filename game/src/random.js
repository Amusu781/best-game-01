// Seeded random numbers (mulberry32): the same seed always deals the same
// field, so a screenshot scene is reproducible and a real game is fair.

export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    /** A float in [min, max). */
    range(min, max) {
      return min + next() * (max - min);
    },
    /** An integer in [min, max] inclusive. */
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    /** Pick one entry from a weighted table of [value, weight] pairs. */
    weighted(table) {
      let total = 0;
      for (const entry of table) total += entry[1];
      let roll = next() * total;
      for (const entry of table) {
        roll -= entry[1];
        if (roll <= 0) return entry[0];
      }
      return table[table.length - 1][0];
    },
  };
}
