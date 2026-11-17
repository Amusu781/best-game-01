// Everything EMBER BLOOM draws: the night sky, the orbs, the rings, the
// particles, the HUD and the title, pause, round-clear and game-over
// screens. The canvas is a fixed logical field (1280x800) scaled to fit
// the window, so a screenshot is always the same frame.

import { FIELD, HUD, KIND_BOMB, KIND_FROST, KIND_GOLD, KIND_STONE, PALETTE } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_CLEAR = 3;
export const SCREEN_OVER = 4;

const STARS = [];
for (let index = 0; index < 130; index += 1) {
  // Fixed starfield: the same sky every run, so the title never flickers.
  const seed = (index + 1) * 2654435761;
  const random = ((seed >>> 0) / 4294967296 + (index % 7) * 0.13) % 1;
  STARS.push({
    x: (index * 197.3) % FIELD.width,
    y: (index * 89.7) % FIELD.height,
    radius: 0.6 + random * 1.4,
    phase: index * 0.7,
    speed: 0.4 + random * 1.2,
  });
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -5, -10, 0, -5);
  ctx.bezierCurveTo(5, -10, 9, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? '#ff5d8f' : 'rgba(255, 255, 255, 0.18)';
  ctx.fill();
  ctx.restore();
}

function drawSparkIcon(ctx, x, y, size, lit) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let point = 0; point < 8; point += 1) {
    const angle = (point * Math.PI) / 4;
    const radius = point % 2 === 0 ? size : size * 0.42;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (point === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = lit ? '#ffb347' : 'rgba(255, 255, 255, 0.16)';
  if (lit) {
    ctx.shadowColor = '#ff7b1c';
    ctx.shadowBlur = 10;
  }
  ctx.fill();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = FIELD.width * dpr;
    canvas.height = FIELD.height * dpr;
    const fit = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    scale = fit;
    canvas.style.width = `${Math.floor(FIELD.width * fit)}px`;
    canvas.style.height = `${Math.floor(FIELD.height * fit)}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawSky(time) {
    const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    gradient.addColorStop(0, PALETTE.skyTop);
    gradient.addColorStop(1, PALETTE.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    const nebulae = [
      { x: 260 + Math.sin(time * 0.05) * 30, y: 200, r: 320, color: PALETTE.nebulaA },
      { x: 1020 + Math.cos(time * 0.04) * 30, y: 560, r: 360, color: PALETTE.nebulaB },
      { x: 700, y: 120 + Math.sin(time * 0.06) * 20, r: 260, color: PALETTE.nebulaC },
    ];
    for (const nebula of nebulae) {
      const glow = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.r);
      glow.addColorStop(0, nebula.color);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(nebula.x - nebula.r, nebula.y - nebula.r, nebula.r * 2, nebula.r * 2);
    }

    for (const star of STARS) {
      const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * star.speed + star.phase));
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = '#e6e0ff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawOrb(orb, time) {
    const wobbleX = Math.sin(time * 1.2 + orb.phase) * orb.wobble;
    const wobbleY = Math.cos(time * 0.9 + orb.phase) * orb.wobble * 0.6;
    const x = orb.x + wobbleX;
    const y = orb.y + wobbleY;
    const pulse = 1 + 0.08 * Math.sin(time * 2.4 + orb.phase);
    const radius = orb.radius * pulse;
    const colors = {
      0: ['#ffb347', '#ff7b1c'],
      1: ['#ffe066', '#f5b301'],
      2: ['#a8e6ff', '#3fa9f5'],
      3: ['#ff5d5d', '#d90429'],
      4: ['#e6e6ee', '#6c6c7d'],
    }[orb.kind];
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 3.2);
    glow.addColorStop(0, colors[1] + '55');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius * 3.2, y - radius * 3.2, radius * 6.4, radius * 6.4);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = colors[0];
    ctx.shadowColor = colors[1];
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.35, radius * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fill();

    if (orb.kind === KIND_GOLD) {
      ctx.strokeStyle = '#fff7cc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - radius * 0.55);
      ctx.lineTo(x, y + radius * 0.55);
      ctx.moveTo(x - radius * 0.55, y);
      ctx.lineTo(x + radius * 0.55, y);
      ctx.stroke();
    } else if (orb.kind === KIND_FROST) {
      ctx.strokeStyle = '#eaf7ff';
      ctx.lineWidth = 1.6;
      for (let arm = 0; arm < 3; arm += 1) {
        const angle = (arm * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle) * radius * 0.5, y - Math.sin(angle) * radius * 0.5);
        ctx.lineTo(x + Math.cos(angle) * radius * 0.5, y + Math.sin(angle) * radius * 0.5);
        ctx.stroke();
      }
    } else if (orb.kind === KIND_BOMB) {
      const ringR = radius * (1.25 + 0.15 * Math.sin(time * 5 + orb.phase));
      ctx.beginPath();
      ctx.arc(x, y, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 93, 93, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (orb.kind === KIND_STONE && orb.cracked) {
      ctx.strokeStyle = 'rgba(40, 40, 55, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.5, y - radius * 0.4);
      ctx.lineTo(x, y);
      ctx.lineTo(x + radius * 0.4, y + radius * 0.5);
      ctx.moveTo(x + radius * 0.5, y - radius * 0.5);
      ctx.lineTo(x - radius * 0.1, y + radius * 0.1);
      ctx.stroke();
    }
  }

  function drawRings(rings) {
    for (const ring of rings) {
      const progress = ring.r / ring.maxR;
      const alpha = ring.fade > 0 ? Math.max(0, 1 - ring.fade / 0.25) : 1 - progress * 0.55;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = alpha * 0.35;
      ctx.lineWidth = 14 * (1 - progress) + 3;
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawParticles(particles) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.max);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawPopups(popups) {
    ctx.save();
    ctx.textAlign = 'center';
    for (const popup of popups) {
      ctx.globalAlpha = Math.max(0, popup.life / popup.max);
      ctx.font = `700 ${popup.size}px system-ui, sans-serif`;
      ctx.fillStyle = popup.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 6;
      ctx.fillText(popup.text, popup.x, popup.y);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawHud(state, best) {
    ctx.fillStyle = PALETTE.hudPanel;
    ctx.fillRect(0, 0, FIELD.width, HUD.height);
    ctx.fillStyle = PALETTE.hudLine;
    ctx.fillRect(0, HUD.height - 1, FIELD.width, 1);

    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', HUD.pad, 16);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.fillText(String(state.score), HUD.pad, 42);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText(`BEST ${Math.max(best, state.score)}`, 150, 16);
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`ROUND ${state.round}`, 150, 42);

    const barX = 300;
    const barWidth = 300;
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText(`BURST ${Math.min(state.burst, state.target)} / ${state.target}`, barX, 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    roundedRect(ctx, barX, 30, barWidth, 12, 6);
    ctx.fill();
    const fill = Math.min(1, state.burst / Math.max(1, state.target));
    ctx.fillStyle = fill >= 1 ? PALETTE.good : PALETTE.accent;
    if (fill > 0) {
      roundedRect(ctx, barX, 30, Math.max(12, barWidth * fill), 12, 6);
      ctx.fill();
    }

    const heartsX = FIELD.width - 250;
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HEARTS', heartsX, 16);
    for (let index = 0; index < 3; index += 1) {
      drawHeart(ctx, heartsX + 12 + index * 30, 42, 15, index < state.hearts);
    }
    ctx.fillText('SPARKS', heartsX + 110, 16);
    for (let index = 0; index < 6; index += 1) {
      drawSparkIcon(ctx, heartsX + 122 + index * 22, 42, 9, index < state.sparksLeft);
    }

    if (state.slow > 0) {
      ctx.fillStyle = 'rgba(63, 169, 245, 0.85)';
      roundedRect(ctx, FIELD.width / 2 - 110, HUD.height + 10, 220, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FROST — DRIFT SLOWED', FIELD.width / 2, HUD.height + 24);
    }

    if (state.chain >= 4) {
      const pop = 1 + 0.12 * Math.sin(state.time * 10);
      ctx.save();
      ctx.translate(FIELD.width / 2, 190);
      ctx.scale(pop, pop);
      ctx.textAlign = 'center';
      ctx.font = '800 54px system-ui, sans-serif';
      ctx.fillStyle = PALETTE.gold;
      ctx.shadowColor = 'rgba(245, 179, 1, 0.8)';
      ctx.shadowBlur = 24;
      ctx.fillText(`CHAIN x${state.chain}`, 0, 0);
      ctx.restore();
    }
  }

  function drawAim(aim) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(aim.x, aim.y, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(aim.x - 20, aim.y);
    ctx.lineTo(aim.x - 8, aim.y);
    ctx.moveTo(aim.x + 8, aim.y);
    ctx.lineTo(aim.x + 20, aim.y);
    ctx.moveTo(aim.x, aim.y - 20);
    ctx.lineTo(aim.x, aim.y - 8);
    ctx.moveTo(aim.x, aim.y + 8);
    ctx.lineTo(aim.x, aim.y + 20);
    ctx.stroke();
    ctx.restore();
  }

  function dimOverlay(alpha) {
    ctx.fillStyle = `rgba(6, 3, 18, ${alpha})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function drawTitle(state, best) {
    dimOverlay(0.55);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '800 84px system-ui, sans-serif';
    ctx.shadowColor = 'rgba(245, 179, 1, 0.55)';
    ctx.shadowBlur = 30;
    ctx.fillText('EMBER BLOOM', FIELD.width / 2, 250);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.text;
    ctx.font = '600 26px system-ui, sans-serif';
    ctx.fillText('Light the sky. Chain the embers.', FIELD.width / 2, 300);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '500 19px system-ui, sans-serif';
    ctx.fillText('Click to ignite a spark — every ember it touches bursts, and every', FIELD.width / 2, 372);
    ctx.fillText('burst throws out its own ring. Beat the round target before your sparks run out.', FIELD.width / 2, 400);
    ctx.fillStyle = '#a8e6ff';
    ctx.fillText('Gold embers score triple  ·  Frost slows the drift  ·  Bombs burst wide  ·  Stone needs two hits', FIELD.width / 2, 448);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText(`BEST  ${Math.max(best, state.score)}`, FIELD.width / 2, 516);
    const blink = 0.6 + 0.4 * Math.sin(state.time * 3);
    ctx.globalAlpha = blink;
    ctx.fillStyle = PALETTE.accent;
    ctx.font = '800 28px system-ui, sans-serif';
    ctx.fillText('CLICK OR PRESS SPACE TO START', FIELD.width / 2, 590);
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '500 16px system-ui, sans-serif';
    ctx.fillText('P pause   ·   M mute   ·   R restart', FIELD.width / 2, 640);
  }

  function drawPaused() {
    dimOverlay(0.6);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = '800 64px system-ui, sans-serif';
    ctx.fillText('PAUSED', FIELD.width / 2, 380);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '500 20px system-ui, sans-serif';
    ctx.fillText('Press P or click to keep playing', FIELD.width / 2, 430);
  }

  function drawClear(state) {
    dimOverlay(0.5);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.good;
    ctx.font = '800 64px system-ui, sans-serif';
    ctx.shadowColor = 'rgba(125, 255, 168, 0.5)';
    ctx.shadowBlur = 24;
    ctx.fillText(`ROUND ${state.round} CLEAR!`, FIELD.width / 2, 320);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.text;
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.fillText(`Sparks left  +${state.lastBonus.spark}     Hearts left  +${state.lastBonus.heart}`, FIELD.width / 2, 392);
    ctx.font = '800 34px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(`BONUS  +${state.lastBonus.total}      SCORE  ${state.score}`, FIELD.width / 2, 448);
    const blink = 0.6 + 0.4 * Math.sin(state.time * 3);
    ctx.globalAlpha = blink;
    ctx.fillStyle = PALETTE.accent;
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText('CLICK FOR THE NEXT ROUND', FIELD.width / 2, 520);
    ctx.globalAlpha = 1;
  }

  function drawOver(state, best) {
    dimOverlay(0.62);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.danger;
    ctx.font = '800 72px system-ui, sans-serif';
    ctx.shadowColor = 'rgba(255, 93, 93, 0.5)';
    ctx.shadowBlur = 26;
    ctx.fillText('GAME OVER', FIELD.width / 2, 300);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText(`You reached round ${state.round}  ·  Best chain x${state.bestChain}`, FIELD.width / 2, 352);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText('FINAL SCORE', FIELD.width / 2, 420);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '800 64px system-ui, sans-serif';
    ctx.fillText(String(state.score), FIELD.width / 2, 492);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText(`BEST  ${Math.max(best, state.score)}`, FIELD.width / 2, 540);
    const blink = 0.6 + 0.4 * Math.sin(state.time * 3);
    ctx.globalAlpha = blink;
    ctx.fillStyle = PALETTE.accent;
    ctx.font = '800 26px system-ui, sans-serif';
    ctx.fillText('CLICK OR PRESS ENTER TO PLAY AGAIN', FIELD.width / 2, 612);
    ctx.globalAlpha = 1;
  }

  function draw(state, screen, best, aim) {
    ctx.save();
    if (state.shake > 0.3) {
      ctx.translate((Math.random() * 2 - 1) * state.shake, (Math.random() * 2 - 1) * state.shake);
    }
    drawSky(state.time);
    for (const orb of state.orbs) {
      if (orb.alive) drawOrb(orb, state.time);
    }
    drawRings(state.rings);
    drawParticles(state.particles);
    drawPopups(state.popups);
    drawHud(state, best);
    if (screen === SCREEN_PLAY) drawAim(aim);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_CLEAR) drawClear(state);
    else if (screen === SCREEN_OVER) drawOver(state, best);
    ctx.restore();
  }

  return { resize, draw };
}
