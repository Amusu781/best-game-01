// Every sound in EMBER BLOOM, synthesised with WebAudio: no audio files,
// no network, nothing to load. A tiny pad hums underneath; short effects
// answer each burst, and the pop rises in pitch as a chain grows.

export function createAudio() {
  let context = null;
  let master = null;
  let padNodes = null;
  let muted = false;
  try {
    muted = window.localStorage.getItem('ember-bloom-muted') === '1';
  } catch {
    muted = false;
  }

  /** Build the audio graph on the first user gesture (browsers demand it). */
  function ensure() {
    if (context) {
      if (context.state === 'suspended') void context.resume();
      return context;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(context.destination);
    startPad();
    return context;
  }

  /** Two detuned triangle waves through a low-pass filter: a soft night hum. */
  function startPad() {
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const gain = context.createGain();
    gain.gain.value = 0.045;
    filter.connect(gain);
    gain.connect(master);
    const notes = [110, 164.81, 220];
    const oscillators = notes.map((frequency) => {
      const osc = context.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = frequency;
      osc.detune.value = Math.random() * 8 - 4;
      osc.connect(filter);
      osc.start();
      return osc;
    });
    padNodes = { oscillators, gain };
  }

  function tone({ frequency, end, type = 'sine', duration = 0.18, volume = 0.25, delay = 0 }) {
    if (!ensure() || muted) return;
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (end !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function noise({ duration = 0.3, volume = 0.3, frequency = 800, delay = 0 }) {
    if (!ensure() || muted) return;
    const start = context.currentTime + delay;
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
  }

  return {
    /** Call on any gesture so the context is allowed to play. */
    unlock() {
      ensure();
    },
    isMuted() {
      return muted;
    },
    setMuted(value) {
      muted = value;
      try {
        window.localStorage.setItem('ember-bloom-muted', value ? '1' : '0');
      } catch {
        // Storage can be off: muting then lasts this visit only.
      }
      if (master) master.gain.value = value ? 0 : 0.9;
    },
    /** A burst pop; pitch climbs with the chain position. */
    pop(chain) {
      const base = 320 + Math.min(chain, 24) * 28;
      tone({ frequency: base, end: base * 1.6, duration: 0.16, volume: 0.22 });
      tone({ frequency: base * 2, duration: 0.07, volume: 0.08 });
    },
    /** The spark itself: a soft whoosh as the ring leaves. */
    spark() {
      noise({ duration: 0.22, volume: 0.12, frequency: 2400 });
      tone({ frequency: 180, end: 520, type: 'triangle', duration: 0.2, volume: 0.1 });
    },
    /** A bomb orb: a low boom. */
    boom() {
      tone({ frequency: 130, end: 38, duration: 0.4, volume: 0.4 });
      noise({ duration: 0.35, volume: 0.25, frequency: 500 });
    },
    /** A frost orb: a bright two-note chime. */
    chime() {
      tone({ frequency: 880, duration: 0.22, volume: 0.14 });
      tone({ frequency: 1318, duration: 0.3, volume: 0.12, delay: 0.07 });
    },
    /** A stone orb cracking: a short dry tick. */
    crack() {
      noise({ duration: 0.08, volume: 0.2, frequency: 3000 });
      tone({ frequency: 220, end: 140, type: 'square', duration: 0.06, volume: 0.08 });
    },
    /** A round cleared: a rising four-note arpeggio. */
    clear() {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        tone({ frequency, duration: 0.28, volume: 0.16, delay: index * 0.09 });
      });
    },
    /** A heart lost: two low notes. */
    hurt() {
      tone({ frequency: 220, end: 180, type: 'triangle', duration: 0.3, volume: 0.2 });
      tone({ frequency: 174, end: 140, type: 'triangle', duration: 0.35, volume: 0.18, delay: 0.12 });
    },
    /** Game over: a slow descending line. */
    over() {
      [392, 329.63, 261.63, 196].forEach((frequency, index) => {
        tone({ frequency, type: 'triangle', duration: 0.4, volume: 0.16, delay: index * 0.16 });
      });
    },
    /** A menu click. */
    click() {
      tone({ frequency: 660, duration: 0.06, volume: 0.12 });
    },
  };
}
