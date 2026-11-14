import type { ThemePalette } from '../data/themes';
import { ARENA_HEIGHT, ARENA_WIDTH, FOLD_Y } from './Physics';
import {
  drawObstacle,
  drawRubberSmudge,
  drawScribbleOut,
  drawSketchLine,
  drawUnit,
  drawWoodenPencil
} from './SketchPrimitives';
import type { AimState, DecalStyle, Obstacle, Particle, Projectile, Team, Unit } from './types';

export interface ViewportTransform {
  viewWidth: number;
  viewHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export class Renderer {
  private mainCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scarsCanvas: HTMLCanvasElement;
  private scarsCtx: CanvasRenderingContext2D;
  private paperCacheCanvas: HTMLCanvasElement;
  private paperCacheCtx: CanvasRenderingContext2D;
  private cachedThemeId: string | null = null;
  private cachedViewW = 0;
  private cachedViewH = 0;
  private dpr = 1;
  private transform: ViewportTransform = {
    viewWidth: ARENA_WIDTH,
    viewHeight: ARENA_HEIGHT,
    scale: 1,
    offsetX: 0,
    offsetY: 0
  };

  constructor(canvas: HTMLCanvasElement) {
    this.mainCanvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not initialize 2D context');
    this.ctx = ctx;

    // Persistent high-res battle scars offscreen layer (2x logical resolution)
    this.scarsCanvas = document.createElement('canvas');
    this.scarsCanvas.width = ARENA_WIDTH * 2;
    this.scarsCanvas.height = ARENA_HEIGHT * 2;
    const sCtx = this.scarsCanvas.getContext('2d');
    if (!sCtx) throw new Error('Could not initialize scars 2D context');
    sCtx.scale(2, 2);
    this.scarsCtx = sCtx;

    // Offscreen cached paper texture so 60fps loop doesn't re-stroke 40 ruled lines every frame
    this.paperCacheCanvas = document.createElement('canvas');
    const pCtx = this.paperCacheCanvas.getContext('2d');
    if (!pCtx) throw new Error('Could not initialize paper cache 2D context');
    this.paperCacheCtx = pCtx;
  }

  public resize(viewWidth: number, viewHeight: number): ViewportTransform {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = Math.max(320, viewWidth);
    const h = Math.max(480, viewHeight);

    this.mainCanvas.width = Math.round(w * this.dpr);
    this.mainCanvas.height = Math.round(h * this.dpr);
    this.mainCanvas.style.width = `${w}px`;
    this.mainCanvas.style.height = `${h}px`;

    const scale = Math.min(w / ARENA_WIDTH, h / ARENA_HEIGHT);
    const offsetX = (w - ARENA_WIDTH * scale) / 2;
    const offsetY = (h - ARENA_HEIGHT * scale) / 2;

    this.transform = { viewWidth: w, viewHeight: h, scale, offsetX, offsetY };
    this.cachedThemeId = null; // Invalidate paper cache on resize
    return this.transform;
  }

  public getTransform(): ViewportTransform {
    return this.transform;
  }

  public screenToArena(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.mainCanvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return {
      x: (sx - this.transform.offsetX) / this.transform.scale,
      y: (sy - this.transform.offsetY) / this.transform.scale
    };
  }

  public clearScars(): void {
    this.scarsCtx.save();
    this.scarsCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.scarsCtx.clearRect(0, 0, this.scarsCanvas.width, this.scarsCanvas.height);
    this.scarsCtx.restore();
  }

  public stampGraphiteSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    pressure: number,
    color: string
  ): void {
    const ctx = this.scarsCtx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Core graphite stroke tapering with pressure
    ctx.lineWidth = 1.2 + pressure * 3.0;
    ctx.globalAlpha = 0.28 + pressure * 0.65;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Subtle secondary paper-tooth grain
    ctx.lineWidth = 0.9 + pressure * 1.4;
    ctx.globalAlpha = 0.16 + pressure * 0.25;
    ctx.beginPath();
    ctx.moveTo(x1 + (Math.random() - 0.5) * 1.6, y1 + (Math.random() - 0.5) * 1.6);
    ctx.lineTo(x2 + (Math.random() - 0.5) * 1.6, y2 + (Math.random() - 0.5) * 1.6);
    ctx.stroke();
    ctx.restore();
  }

  public stampScribbleOut(unit: Unit, killerTeam: Team, theme: ThemePalette): void {
    const color = killerTeam === 'p1' ? theme.p1Ink : theme.p2Ink;
    drawScribbleOut(this.scarsCtx, unit.x, unit.y, unit.radius + 4, color, unit.seed + 300);
  }

  public stampArmorCrack(unit: Unit, theme: ThemePalette): void {
    const color = unit.team === 'p1' ? theme.p1Ink : theme.p2Ink;
    drawSketchLine(
      this.scarsCtx,
      unit.x - 10,
      unit.y - 8,
      unit.x + 8,
      unit.y + 7,
      color,
      1.8,
      unit.seed + 777,
      1.5
    );
  }

  public stampRubberSmudge(x: number, y: number, theme: ThemePalette): void {
    drawRubberSmudge(this.scarsCtx, x, y, theme);
  }

  public stampDoodleScuff(x: number, y: number, theme: ThemePalette): void {
    this.scarsCtx.save();
    this.scarsCtx.fillStyle = theme.graphiteColor;
    this.scarsCtx.globalAlpha = 0.3;
    this.scarsCtx.beginPath();
    this.scarsCtx.arc(x, y, 2.5, 0, Math.PI * 2);
    this.scarsCtx.fill();
    this.scarsCtx.restore();
  }

  private ensurePaperCache(theme: ThemePalette): void {
    const { viewWidth, viewHeight, scale, offsetX, offsetY } = this.transform;
    if (
      this.cachedThemeId === theme.id &&
      this.cachedViewW === viewWidth &&
      this.cachedViewH === viewHeight
    ) {
      return;
    }

    this.cachedThemeId = theme.id;
    this.cachedViewW = viewWidth;
    this.cachedViewH = viewHeight;

    this.paperCacheCanvas.width = Math.round(viewWidth * this.dpr);
    this.paperCacheCanvas.height = Math.round(viewHeight * this.dpr);

    const pCtx = this.paperCacheCtx;
    pCtx.save();
    pCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // 1. Base paper fill
    pCtx.fillStyle = theme.paperBg;
    pCtx.fillRect(0, 0, viewWidth, viewHeight);

    // Subtle paper grain / edge vignette
    const vignette = pCtx.createRadialGradient(
      viewWidth / 2,
      viewHeight / 2,
      Math.min(viewWidth, viewHeight) * 0.3,
      viewWidth / 2,
      viewHeight / 2,
      Math.max(viewWidth, viewHeight) * 0.78
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, theme.paperEdgeShadow);
    pCtx.fillStyle = vignette;
    pCtx.fillRect(0, 0, viewWidth, viewHeight);

    pCtx.translate(offsetX, offsetY);
    pCtx.scale(scale, scale);

    // Extend background rules slightly beyond logical arena to cover full screen
    const leftEdge = -offsetX / scale - 10;
    const rightEdge = ARENA_WIDTH + offsetX / scale + 10;
    const topEdge = -offsetY / scale - 10;
    const botEdge = ARENA_HEIGHT + offsetY / scale + 10;

    // 2. Grid / Ruled lines
    if (theme.gridStyle === 'ruled') {
      pCtx.strokeStyle = theme.ruleLineColor;
      pCtx.lineWidth = 1.1;
      const step = 28;
      for (let y = 52; y <= botEdge; y += step) {
        pCtx.beginPath();
        pCtx.moveTo(leftEdge, y);
        pCtx.lineTo(rightEdge, y);
        pCtx.stroke();
      }
      for (let y = 52 - step; y >= topEdge; y -= step) {
        pCtx.beginPath();
        pCtx.moveTo(leftEdge, y);
        pCtx.lineTo(rightEdge, y);
        pCtx.stroke();
      }
    } else if (theme.gridStyle === 'graph' || theme.gridStyle === 'neon_grid') {
      const subStep = 14;
      const majorStep = 56;
      if (theme.ruleSubLineColor) {
        pCtx.strokeStyle = theme.ruleSubLineColor;
        pCtx.lineWidth = 0.8;
        pCtx.beginPath();
        for (let x = 0; x <= rightEdge; x += subStep) {
          pCtx.moveTo(x, topEdge);
          pCtx.lineTo(x, botEdge);
        }
        for (let x = -subStep; x >= leftEdge; x -= subStep) {
          pCtx.moveTo(x, topEdge);
          pCtx.lineTo(x, botEdge);
        }
        for (let y = 0; y <= botEdge; y += subStep) {
          pCtx.moveTo(leftEdge, y);
          pCtx.lineTo(rightEdge, y);
        }
        for (let y = -subStep; y >= topEdge; y -= subStep) {
          pCtx.moveTo(leftEdge, y);
          pCtx.lineTo(rightEdge, y);
        }
        pCtx.stroke();
      }
      pCtx.strokeStyle = theme.ruleLineColor;
      pCtx.lineWidth = 1.3;
      pCtx.beginPath();
      for (let x = 0; x <= rightEdge; x += majorStep) {
        pCtx.moveTo(x, topEdge);
        pCtx.lineTo(x, botEdge);
      }
      for (let y = 0; y <= botEdge; y += majorStep) {
        pCtx.moveTo(leftEdge, y);
        pCtx.lineTo(rightEdge, y);
      }
      pCtx.stroke();
    } else if (theme.gridStyle === 'crt') {
      // CRT scanlines & faint tactical grid
      pCtx.strokeStyle = theme.ruleSubLineColor ?? theme.ruleLineColor;
      pCtx.lineWidth = 1;
      for (let y = topEdge; y <= botEdge; y += 6) {
        pCtx.beginPath();
        pCtx.moveTo(leftEdge, y);
        pCtx.lineTo(rightEdge, y);
        pCtx.stroke();
      }
      pCtx.strokeStyle = theme.ruleLineColor;
      pCtx.lineWidth = 1.1;
      for (let x = 56; x <= rightEdge; x += 56) {
        pCtx.beginPath();
        pCtx.moveTo(x, topEdge);
        pCtx.lineTo(x, botEdge);
        pCtx.stroke();
      }
      for (let y = 56; y <= botEdge; y += 56) {
        pCtx.beginPath();
        pCtx.moveTo(leftEdge, y);
        pCtx.lineTo(rightEdge, y);
        pCtx.stroke();
      }
    }

    // 3. Vertical Red Margin Line
    pCtx.strokeStyle = theme.marginLineColor;
    pCtx.lineWidth = 1.8;
    pCtx.beginPath();
    pCtx.moveTo(46, topEdge);
    pCtx.lineTo(46, botEdge);
    pCtx.stroke();

    // 4. Three-Hole Punches along left edge
    const holeYs = [125, FOLD_Y, 595];
    for (const hy of holeYs) {
      pCtx.fillStyle = theme.holePunchColor;
      pCtx.beginPath();
      pCtx.arc(20, hy, 10.5, 0, Math.PI * 2);
      pCtx.fill();

      pCtx.strokeStyle = theme.holePunchRing;
      pCtx.lineWidth = 1.6;
      pCtx.beginPath();
      pCtx.arc(20, hy, 10.5, 0, Math.PI * 2);
      pCtx.stroke();
    }

    // 5. Realistic Horizontal Paper Fold Crease at FOLD_Y (y = 360)
    const foldGrad = pCtx.createLinearGradient(0, FOLD_Y - 12, 0, FOLD_Y + 12);
    foldGrad.addColorStop(0, 'rgba(0,0,0,0)');
    foldGrad.addColorStop(0.45, theme.foldHighlight);
    foldGrad.addColorStop(0.5, theme.foldShadow);
    foldGrad.addColorStop(0.58, theme.foldShadow);
    foldGrad.addColorStop(1, 'rgba(0,0,0,0)');
    pCtx.fillStyle = foldGrad;
    pCtx.fillRect(leftEdge, FOLD_Y - 12, rightEdge - leftEdge, 24);

    pCtx.strokeStyle = theme.foldShadow;
    pCtx.lineWidth = 1.1;
    pCtx.setLineDash([7, 4]);
    pCtx.beginPath();
    pCtx.moveTo(leftEdge, FOLD_Y);
    pCtx.lineTo(rightEdge, FOLD_Y);
    pCtx.stroke();
    pCtx.setLineDash([]);

    pCtx.restore();
  }

  public render(params: {
    theme: ThemePalette;
    decal: DecalStyle;
    units: Unit[];
    obstacles: Obstacle[];
    aim: AimState;
    aiAimPreview: { unit: Unit; angle: number; power: number } | null;
    activeProjectile: Projectile | null;
    particles: Particle[];
    shakeAmount: number;
    time: number;
    activeTeam: Team;
  }): void {
    const {
      theme,
      decal,
      units,
      obstacles,
      aim,
      aiAimPreview,
      activeProjectile,
      particles,
      shakeAmount,
      time,
      activeTeam
    } = params;

    this.ensurePaperCache(theme);

    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.paperCacheCanvas, 0, 0);

    // Apply DPR + arena transform + screen shake
    const shakeX = shakeAmount > 0.2 ? (Math.random() - 0.5) * shakeAmount * 2 : 0;
    const shakeY = shakeAmount > 0.2 ? (Math.random() - 0.5) * shakeAmount * 2 : 0;

    ctx.setTransform(
      this.dpr * this.transform.scale,
      0,
      0,
      this.dpr * this.transform.scale,
      this.dpr * (this.transform.offsetX + shakeX),
      this.dpr * (this.transform.offsetY + shakeY)
    );

    // 1. Persistent Battle Scars Layer
    ctx.drawImage(this.scarsCanvas, 0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // 2. Obstacles (Notebook Doodles & Erasers)
    for (const obs of obstacles) {
      drawObstacle(ctx, obs, theme);
    }

    // 3. Surviving Units
    for (const unit of units) {
      const isSelected =
        (aim.unitId === unit.id && unit.team === activeTeam) ||
        (aiAimPreview?.unit.id === unit.id);
      drawUnit(ctx, unit, theme, decal, isSelected, time);
    }

    // 4. Aiming Sightline & #2 Pencil
    if (aim.isDragging && aim.unitId && aim.power > 0.06) {
      const shooter = units.find((u) => u.id === aim.unitId && !u.destroyed);
      if (shooter) {
        this.drawSightline(ctx, shooter.x, shooter.y, aim.pullAngle, aim.power, theme, time);
        drawWoodenPencil(ctx, shooter.x, shooter.y, aim.pullAngle, aim.power, theme);
      }
    } else if (aiAimPreview) {
      this.drawSightline(
        ctx,
        aiAimPreview.unit.x,
        aiAimPreview.unit.y,
        aiAimPreview.angle,
        aiAimPreview.power,
        theme,
        time
      );
      drawWoodenPencil(
        ctx,
        aiAimPreview.unit.x,
        aiAimPreview.unit.y,
        aiAimPreview.angle,
        aiAimPreview.power,
        theme
      );
    }

    // 5. Active Projectile Head (graphite spark/tip)
    if (activeProjectile && activeProjectile.active) {
      ctx.save();
      ctx.fillStyle = theme.graphiteColor;
      ctx.beginPath();
      ctx.arc(activeProjectile.x, activeProjectile.y, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Paper Crumple & Graphite Dust Particles
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.kind === 'paper') {
        ctx.strokeStyle = theme.doodleInk;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-p.size, -p.size * 0.6);
        ctx.lineTo(p.size * 0.8, -p.size * 0.9);
        ctx.lineTo(p.size, p.size * 0.7);
        ctx.lineTo(-p.size * 0.5, p.size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  private drawSightline(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    power: number,
    theme: ThemePalette,
    time: number
  ): void {
    // Capped at a short distance so players still judge long power by feel!
    const maxSight = 30 + power * 95;
    const dots = 7;

    ctx.save();
    ctx.fillStyle = theme.graphiteColor;
    for (let i = 1; i <= dots; i++) {
      const t = i / dots;
      const dist = t * maxSight;
      const jitter = Math.sin(time * 22 + i * 1.9) * (0.9 + power * 1.4);
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      const dx = x + Math.cos(angle) * dist + nx * jitter;
      const dy = y + Math.sin(angle) * dist + ny * jitter;
      ctx.globalAlpha = (1 - t * 0.72) * 0.68;
      ctx.beginPath();
      ctx.arc(dx, dy, 2.3 - t * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
