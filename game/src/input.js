// Mouse and keyboard, turned into actions the game loop reads.
// The pointer is tracked in logical field coordinates; a click or Space
// means "do the thing" (spark while playing, confirm on a menu screen).

export const ACTION_CONFIRM = 1;
export const ACTION_SPARK = 2;
export const ACTION_PAUSE = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

export function createInput(canvas) {
  let queued = 0;
  let aimX = 640;
  let aimY = 400;
  let pointerDown = false;

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    aimX = Math.max(0, Math.min(1280, (event.clientX - rect.left) * scaleX));
    aimY = Math.max(0, Math.min(800, (event.clientY - rect.top) * scaleY));
  }

  canvas.addEventListener('pointermove', (event) => {
    toField(event);
  });
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    toField(event);
    pointerDown = true;
    queued |= ACTION_SPARK | ACTION_CONFIRM;
  });
  canvas.addEventListener('pointerup', () => {
    pointerDown = false;
  });
  canvas.addEventListener('pointerleave', () => {
    pointerDown = false;
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    switch (event.code) {
      case 'Space':
      case 'Enter':
        event.preventDefault();
        queued |= ACTION_SPARK | ACTION_CONFIRM;
        break;
      case 'KeyP':
      case 'Escape':
        queued |= ACTION_PAUSE;
        break;
      case 'KeyM':
        queued |= ACTION_MUTE;
        break;
      case 'KeyR':
        queued |= ACTION_RESTART;
        break;
      default:
        break;
    }
  });

  return {
    aim() {
      return { x: aimX, y: aimY };
    },
    isPointerDown() {
      return pointerDown;
    },
    /** Take and clear the actions queued since the last call. */
    takeActions() {
      const actions = queued;
      queued = 0;
      return actions;
    },
  };
}
