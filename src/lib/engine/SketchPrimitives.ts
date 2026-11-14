import type { ThemePalette } from '../data/themes';
import type { DecalStyle, Obstacle, Unit } from './types';

export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawSketchLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2.1,
  seed = 1,
  jitter = 1.25,
  doublePass = true
): void {
  const rand = mulberry32(seed);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.5) return;

  const segments = Math.max(2, Math.min(18, Math.ceil(dist / 12)));
  const nx = -dy / dist;
  const ny = dx / dist;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const passes = doublePass ? 2 : 1;
  for (let pass = 0; pass < passes; pass++) {
    ctx.beginPath();
    ctx.lineWidth = pass === 0 ? width : Math.max(0.8, width * 0.62);
    ctx.globalAlpha = pass === 0 ? 0.95 : 0.45;
    const jScale = pass === 0 ? jitter : jitter * 1.35;

    ctx.moveTo(x1 + (rand() - 0.5) * jScale * 0.6, y1 + (rand() - 0.5) * jScale * 0.6);
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const offset = (rand() - 0.5) * 2 * jScale;
      ctx.lineTo(x1 + dx * t + nx * offset, y1 + dy * t + ny * offset);
    }
    ctx.lineTo(x2 + (rand() - 0.5) * jScale * 0.6, y2 + (rand() - 0.5) * jScale * 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSketchCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  width = 2.0,
  seed = 1,
  jitter = 1.1,
  fillColor?: string
): void {
  const rand = mulberry32(seed);
  const steps = Math.max(14, Math.round(radius * 0.9));

  ctx.save();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let pass = 0; pass < 2; pass++) {
    ctx.beginPath();
    ctx.lineWidth = pass === 0 ? width : Math.max(0.8, width * 0.65);
    ctx.globalAlpha = pass === 0 ? 0.95 : 0.48;
    const angleOffset = rand() * Math.PI * 2;
    for (let i = 0; i <= steps + 1; i++) {
      const a = angleOffset + (i / steps) * Math.PI * 2;
      const r = radius + (rand() - 0.5) * jitter * 2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSketchRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  width = 2.0,
  seed = 1,
  jitter = 1.1
): void {
  const hw = w / 2;
  const hh = h / 2;
  drawSketchLine(ctx, x - hw, y - hh, x + hw, y - hh, color, width, seed + 1, jitter);
  drawSketchLine(ctx, x + hw, y - hh, x + hw, y + hh, color, width, seed + 2, jitter);
  drawSketchLine(ctx, x + hw, y + hh, x - hw, y + hh, color, width, seed + 3, jitter);
  drawSketchLine(ctx, x - hw, y + hh, x - hw, y - hh, color, width, seed + 4, jitter);
}

export function drawUnit(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  theme: ThemePalette,
  decal: DecalStyle,
  isSelected: boolean,
  pulseTime: number
): void {
  if (unit.destroyed) return;

  const ink = unit.team === 'p1' ? theme.p1Ink : theme.p2Ink;
  const inkLight = unit.team === 'p1' ? theme.p1InkLight : theme.p2InkLight;
  const facing = unit.team === 'p1' ? -Math.PI / 2 : Math.PI / 2;
  const turretAngle = unit.aimAngle ?? facing;

  ctx.save();
  ctx.translate(unit.x, unit.y);

  // Subtle selection highlight circle
  if (isSelected) {
    const pulse = 1 + Math.sin(pulseTime * 6) * 0.06;
    drawSketchCircle(
      ctx,
      0,
      0,
      (unit.radius + 8) * pulse,
      ink,
      1.8,
      unit.seed + 99,
      1.2,
      inkLight
    );
  }

  // Hit flash tint
  if (unit.hitFlash > 0) {
    ctx.fillStyle = inkLight;
    ctx.beginPath();
    ctx.arc(0, 0, unit.radius + 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  // Rotate body slightly toward default facing for directional decals
  if (unit.team === 'p2' && (decal === 'starfighter' || decal === 'battleship')) {
    ctx.rotate(Math.PI);
  }

  if (unit.kind === 'bunker') {
    drawBunkerDecal(ctx, unit, decal, ink, inkLight);
  } else if (unit.kind === 'radar') {
    drawRadarDecal(ctx, unit, decal, ink, inkLight, pulseTime);
  } else {
    drawTankDecal(ctx, unit, decal, ink, inkLight, turretAngle);
  }
  ctx.restore();

  // HP pips for multi-HP bunkers
  if (unit.maxHp > 1) {
    for (let i = 0; i < unit.maxHp; i++) {
      const pipX = (i - (unit.maxHp - 1) / 2) * 10;
      const pipY = unit.team === 'p1' ? unit.radius + 9 : -(unit.radius + 9);
      const filled = i < unit.hp;
      drawSketchCircle(
        ctx,
        pipX,
        pipY,
        3.2,
        ink,
        1.5,
        unit.seed + 50 + i,
        0.4,
        filled ? ink : undefined
      );
    }
  }

  ctx.restore();
}

function drawTankDecal(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  decal: DecalStyle,
  ink: string,
  inkLight: string,
  turretAngle: number
): void {
  const s = unit.seed;

  if (decal === 'starfighter') {
    // Swept-wing X/dart fighter
    ctx.fillStyle = inkLight;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(17, 12);
    ctx.lineTo(5, 8);
    ctx.lineTo(-5, 8);
    ctx.lineTo(-17, 12);
    ctx.closePath();
    ctx.fill();

    drawSketchLine(ctx, 0, -18, 17, 12, ink, 2.1, s + 1, 0.9);
    drawSketchLine(ctx, 17, 12, 5, 8, ink, 2.0, s + 2, 0.8);
    drawSketchLine(ctx, 5, 8, -5, 8, ink, 2.0, s + 3, 0.8);
    drawSketchLine(ctx, -5, 8, -17, 12, ink, 2.0, s + 4, 0.8);
    drawSketchLine(ctx, -17, 12, 0, -18, ink, 2.1, s + 5, 0.9);
    drawSketchLine(ctx, -12, 0, -12, -11, ink, 1.8, s + 6, 0.6);
    drawSketchLine(ctx, 12, 0, 12, -11, ink, 1.8, s + 7, 0.6);
    drawSketchCircle(ctx, 0, -2, 4, ink, 1.6, s + 8, 0.5);
    return;
  }

  if (decal === 'ufo') {
    drawSketchCircle(ctx, 0, 0, 15, ink, 2.0, s + 1, 1.0, inkLight);
    drawSketchCircle(ctx, 0, 0, 7, ink, 1.8, s + 2, 0.7);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      drawSketchCircle(ctx, Math.cos(a) * 11, Math.sin(a) * 11, 1.6, ink, 1.4, s + 10 + i, 0.3, ink);
    }
    return;
  }

  if (decal === 'mech') {
    // Bipedal top-down shoulder + arms + visor
    ctx.fillStyle = inkLight;
    ctx.fillRect(-13, -9, 26, 18);
    drawSketchRect(ctx, 0, 0, 26, 18, ink, 2.1, s + 1, 0.9);
    drawSketchRect(ctx, -15, -2, 6, 12, ink, 1.8, s + 10, 0.7);
    drawSketchRect(ctx, 15, -2, 6, 12, ink, 1.8, s + 20, 0.7);
    drawSketchCircle(ctx, 0, 0, 6, ink, 1.8, s + 30, 0.6);
    const bx = Math.cos(turretAngle) * 16;
    const by = Math.sin(turretAngle) * 16;
    drawSketchLine(ctx, Math.cos(turretAngle) * 6, Math.sin(turretAngle) * 6, bx, by, ink, 2.4, s + 40, 0.5);
    return;
  }

  if (decal === 'battleship') {
    ctx.fillStyle = inkLight;
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(10, -4);
    ctx.lineTo(9, 16);
    ctx.lineTo(-9, 16);
    ctx.lineTo(-10, -4);
    ctx.closePath();
    ctx.fill();

    drawSketchLine(ctx, 0, -19, 10, -4, ink, 2.1, s + 1, 0.8);
    drawSketchLine(ctx, 10, -4, 9, 16, ink, 2.1, s + 2, 0.8);
    drawSketchLine(ctx, 9, 16, -9, 16, ink, 2.1, s + 3, 0.8);
    drawSketchLine(ctx, -9, 16, -10, -4, ink, 2.1, s + 4, 0.8);
    drawSketchLine(ctx, -10, -4, 0, -19, ink, 2.1, s + 5, 0.8);
    drawSketchCircle(ctx, 0, -3, 4.5, ink, 1.7, s + 6, 0.5);
    drawSketchLine(ctx, 0, -3, 0, -14, ink, 2.2, s + 7, 0.4);
    return;
  }

  // Standard classic hand-drawn notebook tank
  ctx.fillStyle = inkLight;
  ctx.fillRect(-12, -10, 24, 20);
  // Treads
  drawSketchRect(ctx, -13, 0, 6, 24, ink, 1.9, s + 10, 0.8);
  drawSketchRect(ctx, 13, 0, 6, 24, ink, 1.9, s + 20, 0.8);
  // Tread notches
  for (let ty = -8; ty <= 8; ty += 6) {
    drawSketchLine(ctx, -16, ty, -10, ty, ink, 1.2, s + 30 + ty, 0.4, false);
    drawSketchLine(ctx, 10, ty, 16, ty, ink, 1.2, s + 40 + ty, 0.4, false);
  }
  // Hull
  drawSketchRect(ctx, 0, 0, 20, 20, ink, 2.1, s + 50, 0.9);
  // Turret + Cannon barrel
  drawSketchCircle(ctx, 0, 0, 7, ink, 2.0, s + 60, 0.7, inkLight);
  const cos = Math.cos(turretAngle);
  const sin = Math.sin(turretAngle);
  drawSketchLine(ctx, cos * 6, sin * 6, cos * 19, sin * 19, ink, 2.8, s + 70, 0.5);
}

function drawBunkerDecal(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  decal: DecalStyle,
  ink: string,
  inkLight: string
): void {
  const s = unit.seed;

  if (decal === 'ufo') {
    drawSketchCircle(ctx, 0, 0, 19, ink, 2.2, s + 1, 1.0, inkLight);
    drawSketchCircle(ctx, 0, 0, 12, ink, 1.9, s + 2, 0.8);
    drawSketchCircle(ctx, 0, 0, 5, ink, 1.8, s + 3, 0.5, ink);
  } else {
    // Octagon / armored sandbag bunker
    const r = 18;
    ctx.fillStyle = inkLight;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const a1 = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const a2 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8;
      drawSketchLine(
        ctx,
        Math.cos(a1) * r,
        Math.sin(a1) * r,
        Math.cos(a2) * r,
        Math.sin(a2) * r,
        ink,
        2.2,
        s + i * 3,
        0.9
      );
    }
    drawSketchRect(ctx, 0, 0, 14, 14, ink, 1.9, s + 30, 0.7);
    drawSketchLine(ctx, -7, -7, 7, 7, ink, 1.4, s + 40, 0.5);
    drawSketchLine(ctx, 7, -7, -7, 7, ink, 1.4, s + 45, 0.5);
  }

  // Crack/dent sketch if damaged
  if (unit.hp < unit.maxHp) {
    drawSketchLine(ctx, -14, -8, -2, 2, ink, 2.2, s + 80, 1.4);
    drawSketchLine(ctx, -2, 2, 9, -4, ink, 2.0, s + 81, 1.2);
    drawSketchLine(ctx, -2, 2, 4, 14, ink, 1.8, s + 82, 1.2);
  }
}

function drawRadarDecal(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  _decal: DecalStyle,
  ink: string,
  inkLight: string,
  pulseTime: number
): void {
  const s = unit.seed;
  drawSketchCircle(ctx, 0, 0, 14, ink, 2.0, s + 1, 0.9, inkLight);
  drawSketchLine(ctx, -8, 6, 8, 6, ink, 2.0, s + 2, 0.7);
  drawSketchLine(ctx, -6, 6, 0, -4, ink, 1.9, s + 3, 0.7);
  drawSketchLine(ctx, 6, 6, 0, -4, ink, 1.9, s + 4, 0.7);

  // Rotating dish arc
  const sweep = Math.sin(pulseTime * 2.3 + unit.seed) * 0.45;
  ctx.save();
  ctx.rotate(sweep);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, -6, 9, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  drawSketchLine(ctx, 0, -6, 0, -13, ink, 1.6, s + 10, 0.4);
  ctx.restore();
}

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obs: Obstacle,
  theme: ThemePalette
): void {
  ctx.save();
  ctx.translate(obs.x, obs.y);
  if (obs.rotation) ctx.rotate(obs.rotation);

  const s = obs.seed;
  const ink = theme.doodleInk;

  switch (obs.kind) {
    case 'cool_s': {
      // Iconic 1980s "Cool S" (6 vertical bars + diagonal connects + roof/floor)
      const w = (obs.width ?? 42) * 0.42;
      const h = (obs.height ?? 68) * 0.44;
      const top = -h;
      const midTop = -h * 0.34;
      const midBot = h * 0.34;
      const bot = h;

      // Top & bottom peaks
      drawSketchLine(ctx, 0, top, -w, midTop, ink, 2.2, s + 1, 0.7);
      drawSketchLine(ctx, 0, top, w, midTop, ink, 2.2, s + 2, 0.7);
      drawSketchLine(ctx, 0, bot, -w, midBot, ink, 2.2, s + 3, 0.7);
      drawSketchLine(ctx, 0, bot, w, midBot, ink, 2.2, s + 4, 0.7);

      // Upper 3 verticals
      drawSketchLine(ctx, -w, midTop, -w, 0, ink, 2.2, s + 5, 0.7);
      drawSketchLine(ctx, 0, midTop, 0, 0, ink, 2.2, s + 6, 0.7);
      drawSketchLine(ctx, w, midTop, w, 0, ink, 2.2, s + 7, 0.7);

      // Lower 3 verticals
      drawSketchLine(ctx, -w, 0, -w, midBot, ink, 2.2, s + 8, 0.7);
      drawSketchLine(ctx, 0, 0, 0, midBot, ink, 2.2, s + 9, 0.7);
      drawSketchLine(ctx, w, 0, w, midBot, ink, 2.2, s + 10, 0.7);

      // Center diagonals
      drawSketchLine(ctx, -w, 0, 0, midBot, ink, 2.2, s + 11, 0.7);
      drawSketchLine(ctx, 0, midTop, w, 0, ink, 2.2, s + 12, 0.7);
      break;
    }

    case 'doodle_star': {
      const r = obs.radius ?? 22;
      const inner = r * 0.44;
      const pts: Array<[number, number]> = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rad = i % 2 === 0 ? r : inner;
        pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
      }
      for (let i = 0; i < pts.length; i++) {
        const next = pts[(i + 1) % pts.length];
        drawSketchLine(ctx, pts[i][0], pts[i][1], next[0], next[1], ink, 2.0, s + i, 0.8);
      }
      break;
    }

    case 'coffee_ring': {
      const r = obs.radius ?? 36;
      ctx.save();
      ctx.strokeStyle = theme.coffeeRingColor;
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0.15, Math.PI * 1.92);
      ctx.stroke();

      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(2, -1, r - 2.5, 0, Math.PI * 2);
      ctx.stroke();

      // Tiny splash droplet
      ctx.fillStyle = theme.coffeeRingColor;
      ctx.beginPath();
      ctx.arc(r + 6, -10, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'eraser_shavings': {
      const r = obs.radius ?? 22;
      const rand = mulberry32(s);
      ctx.save();
      ctx.strokeStyle = theme.eraserAccent;
      ctx.fillStyle = theme.eraserFill;
      for (let i = 0; i < 11; i++) {
        const a = rand() * Math.PI * 2;
        const d = rand() * (r * 0.78);
        const px = Math.cos(a) * d;
        const py = Math.sin(a) * d;
        const rot = rand() * Math.PI;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, 4.5, 2.0, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      break;
    }

    case 'paper_clip': {
      const w = obs.width ?? 52;
      const h = obs.height ?? 22;
      const hw = w / 2;
      const hh = h / 2;
      ctx.save();
      ctx.strokeStyle = '#7b8794';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-hw + 8, -hh + 3);
      ctx.lineTo(hw - 10, -hh + 3);
      ctx.arc(hw - 10, 0, hh - 3, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-hw + 10, hh - 3);
      ctx.arc(-hw + 10, 2, hh - 5, Math.PI / 2, (Math.PI * 3) / 2);
      ctx.lineTo(hw - 16, -hh + 7);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'eraser': {
      const w = obs.width ?? 80;
      const h = obs.height ?? 30;
      const hw = w / 2;
      const hh = h / 2;
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.beginPath();
      ctx.roundRect(-hw + 3, -hh + 4, w, h, 4);
      ctx.fill();

      // Eraser body (skewed parallelogram look)
      ctx.fillStyle = theme.eraserFill;
      ctx.strokeStyle = theme.eraserAccent;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-hw, -hh, w, h, 4);
      ctx.fill();
      ctx.stroke();

      // Bevel highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-hw + 5, -hh + 4);
      ctx.lineTo(hw - 6, -hh + 4);
      ctx.stroke();

      // Label
      ctx.fillStyle = theme.eraserAccent;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ERASER', 0, 1);
      break;
    }

    case 'ruler': {
      const w = obs.width ?? 100;
      const h = obs.height ?? 22;
      const hw = w / 2;
      const hh = h / 2;

      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(-hw + 2, -hh + 3, w, h);

      ctx.fillStyle = '#e5be7d';
      ctx.strokeStyle = '#8b5e2b';
      ctx.lineWidth = 2;
      ctx.fillRect(-hw, -hh, w, h);
      ctx.strokeRect(-hw, -hh, w, h);

      // Tick marks
      ctx.strokeStyle = '#5c3c16';
      ctx.lineWidth = 1.2;
      for (let tx = -hw + 6; tx <= hw - 6; tx += 6) {
        const tickLen = (Math.round(tx) % 18 === 0) ? 8 : 4.5;
        ctx.beginPath();
        ctx.moveTo(tx, -hh);
        ctx.lineTo(tx, -hh + tickLen);
        ctx.stroke();
      }
      break;
    }

    case 'spiral_wire': {
      const h = obs.height ?? 180;
      const loops = Math.floor(h / 18);
      const startY = -h / 2 + 9;
      ctx.save();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      for (let i = 0; i < loops; i++) {
        const ly = startY + i * 18;
        ctx.beginPath();
        ctx.ellipse(0, ly, 12, 6, -0.25, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
  }

  ctx.restore();
}

export function drawWoodenPencil(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  fireAngle: number,
  power: number,
  theme: ThemePalette
): void {
  // Pencil points along fireAngle (tip touches or hovers near unit, body trails behind)
  const pullOffset = 6 + power * 24;
  const barrelLength = 108;

  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(fireAngle);
  // Shift backward while aiming so tip pulls back from tank!
  ctx.translate(-pullOffset, 0);

  // Drop shadow on paper
  ctx.save();
  ctx.translate(4, 6 + power * 4);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-18, -5.5);
  ctx.lineTo(-barrelLength - 20, -5.5);
  ctx.lineTo(-barrelLength - 20, 5.5);
  ctx.lineTo(-18, 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Sharpened wood cone
  ctx.fillStyle = theme.pencilWood;
  ctx.strokeStyle = '#4a3822';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-18, -5.5);
  ctx.lineTo(-18, 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Graphite tip
  ctx.fillStyle = theme.graphiteColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-6.5, -2.1);
  ctx.lineTo(-6.5, 2.1);
  ctx.closePath();
  ctx.fill();

  // Hexagonal yellow barrel
  const bodyEnd = -18 - barrelLength;
  ctx.fillStyle = theme.pencilPaint;
  ctx.fillRect(bodyEnd, -5.5, barrelLength, 11);

  // Barrel facet lines
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-18, -2);
  ctx.lineTo(bodyEnd, -2);
  ctx.moveTo(-18, 2);
  ctx.lineTo(bodyEnd, 2);
  ctx.stroke();

  ctx.strokeStyle = '#4a3822';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(bodyEnd, -5.5, barrelLength, 11);

  // Silver metal ferrule
  const ferruleLen = 13;
  ctx.fillStyle = theme.pencilFerrule;
  ctx.fillRect(bodyEnd - ferruleLen, -5.6, ferruleLen, 11.2);
  ctx.strokeRect(bodyEnd - ferruleLen, -5.6, ferruleLen, 11.2);
  ctx.beginPath();
  ctx.moveTo(bodyEnd - 4, -5.5);
  ctx.lineTo(bodyEnd - 4, 5.5);
  ctx.moveTo(bodyEnd - 9, -5.5);
  ctx.lineTo(bodyEnd - 9, 5.5);
  ctx.stroke();

  // Pink rubber eraser
  const eraserStart = bodyEnd - ferruleLen;
  ctx.fillStyle = theme.pencilEraser;
  ctx.beginPath();
  ctx.roundRect(eraserStart - 11, -5.3, 11, 10.6, [3, 0, 0, 3]);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawScribbleOut(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  seed: number
): void {
  const rand = mulberry32(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.6;
  ctx.globalAlpha = 0.88;

  // Chaotic zig-zag scribble over the destroyed unit
  ctx.beginPath();
  const strokes = 9;
  for (let i = 0; i <= strokes; i++) {
    const px = (rand() - 0.5) * radius * 2.2;
    const py = (rand() - 0.5) * radius * 2.2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Big X mark
  drawSketchLine(ctx, -radius, -radius, radius, radius, color, 2.8, seed + 5, 1.4);
  drawSketchLine(ctx, radius, -radius, -radius, radius, color, 2.8, seed + 6, 1.4);
  ctx.restore();
}

export function drawRubberSmudge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  theme: ThemePalette
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = theme.eraserFill;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 5, Math.random() * Math.PI, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.graphiteColor;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(2, -1, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
