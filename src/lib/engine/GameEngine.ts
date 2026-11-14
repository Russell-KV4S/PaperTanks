import { THEMES } from '../data/themes';
import { chooseAIShot } from './AIController';
import { ARENA_HEIGHT, ARENA_WIDTH, createProjectile, stepProjectile } from './Physics';
import { Renderer } from './Renderer';
import { SoundSynth } from './SoundSynth';
import type {
  AimState,
  ControlMode,
  DecalStyle,
  GameMode,
  LevelSpec,
  MatchStats,
  Obstacle,
  ObstacleKind,
  Particle,
  Projectile,
  Team,
  ThemeId,
  TurnPhase,
  Unit
} from './types';

export interface EngineSnapshot {
  phase: TurnPhase;
  activeTeam: Team;
  p1Remaining: number;
  p2Remaining: number;
  selectedUnitId: string | null;
  aiQuip: string | null;
  levelName: string;
  opponentName: string;
  shotsFired: number;
}

export interface EngineCallbacks {
  onStateChange: (snapshot: EngineSnapshot) => void;
  onMatchEnd: (stats: MatchStats) => void;
}

export class GameEngine {
  private renderer: Renderer;
  private sound: SoundSynth;
  private callbacks: EngineCallbacks;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private elapsedTime = 0;
  private paused = false;

  private mode: GameMode = 'campaign';
  private levelSpec!: LevelSpec;
  private themeId: ThemeId = 'classic';
  private decal: DecalStyle = 'standard';
  private controlMode: ControlMode = 'slingshot';

  private phase: TurnPhase = 'PLAYER_AIM';
  private activeTeam: Team = 'p1';
  private units: Unit[] = [];
  private obstacles: Obstacle[] = [];
  private activeProjectile: Projectile | null = null;
  private particles: Particle[] = [];
  private shakeAmount = 0;

  private p1Shots = 0;
  private p1Hits = 0;
  private p2Shots = 0;
  private p2Hits = 0;

  private aiTimer = 0;
  private aiDecision: ReturnType<typeof chooseAIShot> = null;
  private aiQuip: string | null = null;
  private lastTensionTickPower = 0;

  private aim: AimState = {
    unitId: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    pullAngle: -Math.PI / 2,
    power: 0,
    isDragging: false,
    lastDragTime: 0,
    flickVx: 0,
    flickVy: 0
  };

  constructor(canvas: HTMLCanvasElement, sound: SoundSynth, callbacks: EngineCallbacks) {
    this.renderer = new Renderer(canvas);
    this.sound = sound;
    this.callbacks = callbacks;
  }

  public setAppearance(themeId: ThemeId, decal: DecalStyle): void {
    this.themeId = themeId;
    this.decal = decal;
  }

  public setControlMode(mode: ControlMode): void {
    this.controlMode = mode;
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    this.lastTimestamp = performance.now();
  }

  public resize(w: number, h: number): void {
    this.renderer.resize(w, h);
  }

  public startMatch(level: LevelSpec, mode: GameMode): void {
    this.levelSpec = level;
    this.mode = mode;
    this.paused = false;
    this.renderer.clearScars();

    this.units = [];
    level.p1Units.forEach((u, idx) => {
      this.units.push({
        id: `p1-${idx}`,
        team: 'p1',
        kind: u.kind,
        x: u.x,
        y: u.y,
        radius: u.kind === 'bunker' ? 20 : u.kind === 'radar' ? 16 : 18,
        hp: u.kind === 'bunker' ? 2 : 1,
        maxHp: u.kind === 'bunker' ? 2 : 1,
        destroyed: false,
        aimAngle: -Math.PI / 2,
        seed: 100 + idx * 37,
        hitFlash: 0
      });
    });

    level.p2Units.forEach((u, idx) => {
      this.units.push({
        id: `p2-${idx}`,
        team: 'p2',
        kind: u.kind,
        x: u.x,
        y: u.y,
        radius: u.kind === 'bunker' ? 20 : u.kind === 'radar' ? 16 : 18,
        hp: u.kind === 'bunker' ? 2 : 1,
        maxHp: u.kind === 'bunker' ? 2 : 1,
        destroyed: false,
        aimAngle: Math.PI / 2,
        seed: 500 + idx * 41,
        hitFlash: 0
      });
    });

    this.obstacles = level.obstacles.map((o, idx) => {
      const heavyKinds: ObstacleKind[] = ['eraser', 'ruler', 'spiral_wire'];
      const circleKinds: ObstacleKind[] = ['doodle_star', 'coffee_ring', 'eraser_shavings'];
      return {
        id: `obs-${idx}`,
        kind: o.kind,
        weight: heavyKinds.includes(o.kind) ? 'heavy' : 'light',
        shape: circleKinds.includes(o.kind) ? 'circle' : 'rect',
        x: o.x,
        y: o.y,
        radius: o.radius,
        width: o.width,
        height: o.height,
        rotation: o.rotation ?? 0,
        seed: 900 + idx * 53
      };
    });

    this.activeProjectile = null;
    this.particles = [];
    this.shakeAmount = 0;
    this.p1Shots = 0;
    this.p1Hits = 0;
    this.p2Shots = 0;
    this.p2Hits = 0;
    this.aiDecision = null;
    this.aiQuip = null;

    this.phase = 'PLAYER_AIM';
    this.activeTeam = 'p1';
    this.aim = {
      unitId: this.units.find((u) => u.team === 'p1')?.id ?? null,
      pointerId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      pullAngle: -Math.PI / 2,
      power: 0,
      isDragging: false,
      lastDragTime: 0,
      flickVx: 0,
      flickVy: 0
    };

    this.emitState();
    this.startLoop();
  }

  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private startLoop(): void {
    this.stop();
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(0.05, Math.max(0.001, rawDt));

      if (!this.paused) {
        this.update(dt);
      }
      this.renderFrame();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private update(dt: number): void {
    this.elapsedTime += dt;
    this.shakeAmount = Math.max(0, this.shakeAmount - dt * 22);

    for (const u of this.units) {
      if (u.hitFlash > 0) u.hitFlash = Math.max(0, u.hitFlash - dt * 4);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-3.5 * dt);
      p.vy *= Math.exp(-3.5 * dt);
      p.rotation += p.vRot * dt;
    }

    const theme = THEMES[this.themeId];

    // Step projectile
    if (
      (this.phase === 'PROJECTILE_ANIMATING' || this.phase === 'AI_ANIMATING') &&
      this.activeProjectile
    ) {
      const prevX = this.activeProjectile.x;
      const prevY = this.activeProjectile.y;
      const events = stepProjectile(this.activeProjectile, dt, this.units, this.obstacles, true);

      // Stamp persistent graphite streak onto scarsCanvas
      this.renderer.stampGraphiteSegment(
        prevX,
        prevY,
        this.activeProjectile.x,
        this.activeProjectile.y,
        this.activeProjectile.pressure,
        theme.graphiteColor
      );

      // Emit subtle graphite dust along high-pressure trail
      if (Math.random() < 0.45 && this.activeProjectile.active) {
        this.particles.push({
          x: this.activeProjectile.x,
          y: this.activeProjectile.y,
          vx: (Math.random() - 0.5) * 24,
          vy: (Math.random() - 0.5) * 24,
          size: 1.3 + Math.random() * 1.4,
          rotation: 0,
          vRot: 0,
          life: 0.25,
          maxLife: 0.25,
          color: theme.graphiteColor,
          kind: 'graphite'
        });
      }

      for (const ev of events) {
        if (ev.type === 'obstacle_light') {
          this.sound.playDoodleDeflect();
          this.renderer.stampDoodleScuff(ev.x, ev.y, theme);
        } else if (ev.type === 'obstacle_heavy') {
          this.sound.playEraserThud();
          this.renderer.stampRubberSmudge(ev.x, ev.y, theme);
          this.spawnBurst(ev.x, ev.y, theme.eraserFill, 8, 'rubber');
        } else if (ev.type === 'unit_hit' && ev.unit) {
          this.handleUnitHit(ev.unit, this.activeProjectile.ownerTeam);
        }
      }

      if (!this.activeProjectile.active) {
        this.activeProjectile = null;
        this.advanceTurnAfterShot();
      }
    }

    // AI thinking countdown
    if (this.phase === 'AI_THINKING') {
      this.aiTimer -= dt * 1000;
      if (this.aiTimer <= 0 && this.aiDecision) {
        const shooter = this.units.find((u) => u.id === this.aiDecision?.unitId && !u.destroyed);
        if (shooter) {
          shooter.aimAngle = this.aiDecision.angle;
          this.activeProjectile = createProjectile(
            'p2',
            shooter,
            this.aiDecision.angle,
            this.aiDecision.power
          );
          this.p2Shots++;
          this.sound.playPencilFlick(this.aiDecision.power);
          this.phase = 'AI_ANIMATING';
          this.aiDecision = null;
          this.emitState();
        } else {
          this.advanceTurnAfterShot();
        }
      }
    }
  }

  private handleUnitHit(unit: Unit, attacker: Team): void {
    const theme = THEMES[this.themeId];
    unit.hp -= 1;
    unit.hitFlash = 1;

    if (attacker === 'p1') this.p1Hits++;
    else this.p2Hits++;

    if (unit.hp <= 0) {
      unit.destroyed = true;
      this.shakeAmount = 5.5;
      this.sound.playPaperExplosion();
      this.renderer.stampScribbleOut(unit, attacker, theme);
      this.spawnBurst(unit.x, unit.y, theme.paperBg, 14, 'paper');
      this.spawnBurst(
        unit.x,
        unit.y,
        unit.team === 'p1' ? theme.p1Ink : theme.p2Ink,
        10,
        'ink'
      );
    } else {
      this.shakeAmount = 2.6;
      this.sound.playArmorHit();
      this.renderer.stampArmorCrack(unit, theme);
      this.spawnBurst(unit.x, unit.y, theme.paperBg, 6, 'paper');
    }
  }

  private spawnBurst(
    x: number,
    y: number,
    color: string,
    count: number,
    kind: Particle['kind']
  ): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 145;
      const life = 0.35 + Math.random() * 0.4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: kind === 'paper' ? 4 + Math.random() * 4 : 2 + Math.random() * 2.5,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 14,
        life,
        maxLife: life,
        color,
        kind
      });
    }
  }

  private advanceTurnAfterShot(): void {
    const p1Alive = this.units.filter((u) => u.team === 'p1' && !u.destroyed);
    const p2Alive = this.units.filter((u) => u.team === 'p2' && !u.destroyed);

    if (p1Alive.length === 0 || p2Alive.length === 0) {
      this.phase = 'GAME_OVER';
      const winner: Team = p2Alive.length === 0 ? 'p1' : 'p2';
      if (winner === 'p1') this.sound.playVictoryStamp();
      else this.sound.playDefeatStamp();

      this.emitState();
      this.callbacks.onMatchEnd(this.buildMatchStats(winner, p1Alive.length, p2Alive.length));
      return;
    }

    if (this.mode === 'pass_and_play') {
      this.activeTeam = this.activeTeam === 'p1' ? 'p2' : 'p1';
      this.phase = 'PLAYER_AIM';
      const teamUnits = this.activeTeam === 'p1' ? p1Alive : p2Alive;
      this.aim.unitId = teamUnits[0].id;
      this.emitState();
      return;
    }

    // 1P vs AI
    if (this.activeTeam === 'p1') {
      this.activeTeam = 'p2';
      this.phase = 'AI_THINKING';
      this.aiDecision = chooseAIShot(this.units, this.obstacles, this.levelSpec.opponent);
      this.aiTimer = this.levelSpec.opponent.thinkDelayMs;
      this.aiQuip = this.aiDecision?.quip ?? null;
      this.emitState();
    } else {
      this.activeTeam = 'p1';
      this.phase = 'PLAYER_AIM';
      this.aiQuip = null;
      if (!this.aim.unitId || this.units.find((u) => u.id === this.aim.unitId)?.destroyed) {
        this.aim.unitId = p1Alive[0].id;
      }
      this.emitState();
    }
  }

  private buildMatchStats(winner: Team, p1Remaining: number, p2Remaining: number): MatchStats {
    const p1Total = this.units.filter((u) => u.team === 'p1').length;
    const accuracy = this.p1Shots > 0 ? this.p1Hits / this.p1Shots : 0;

    let grade: MatchStats['grade'] = 'F';
    let teacherNote = 'See me after class! Watch out for those erasers.';

    if (winner === 'p1') {
      if (p1Remaining === p1Total && accuracy >= 0.55) {
        grade = 'A+';
        teacherNote = 'GOLD STAR! Textbook pencil-flick mastery.';
      } else if (p1Remaining >= Math.ceil(p1Total * 0.65)) {
        grade = 'A';
        teacherNote = 'Excellent trajectory control & ink discipline!';
      } else if (accuracy >= 0.35) {
        grade = 'B+';
        teacherNote = 'Solid tactical flicks. Clean margins!';
      } else if (p1Remaining >= 2) {
        grade = 'B';
        teacherNote = 'Good effort! Keep practicing bank angles.';
      } else {
        grade = 'C';
        teacherNote = 'Passing grade — barely survived the final bell!';
      }
    }

    return {
      winner,
      mode: this.mode,
      levelId: this.levelSpec.id,
      levelName: this.levelSpec.name,
      p1Shots: this.p1Shots,
      p1Hits: this.p1Hits,
      p2Shots: this.p2Shots,
      p2Hits: this.p2Hits,
      p1Remaining,
      p1Total,
      p2Remaining,
      grade,
      teacherNote
    };
  }

  // Pointer / Touch Controls
  public handlePointerDown(clientX: number, clientY: number, pointerId: number): void {
    this.sound.unlock();
    if (this.paused || this.phase !== 'PLAYER_AIM') return;

    const pt = this.renderer.screenToArena(clientX, clientY);
    const activeUnits = this.units.filter((u) => u.team === this.activeTeam && !u.destroyed);
    if (activeUnits.length === 0) return;

    // 1. Did player tap directly on one of their units?
    let tappedUnit: Unit | null = null;
    let bestDist = Infinity;
    for (const u of activeUnits) {
      const d = Math.hypot(pt.x - u.x, pt.y - u.y);
      if (d <= u.radius + 26 && d < bestDist) {
        bestDist = d;
        tappedUnit = u;
      }
    }

    if (tappedUnit) {
      if (this.aim.unitId !== tappedUnit.id) {
        this.sound.playPencilSelect();
      }
      this.aim.unitId = tappedUnit.id;
      this.aim.pointerId = pointerId;
      this.aim.startX = tappedUnit.x;
      this.aim.startY = tappedUnit.y;
      this.aim.currentX = pt.x;
      this.aim.currentY = pt.y;
      this.aim.isDragging = true;
      this.aim.power = 0;
      this.aim.lastDragTime = performance.now();
      this.aim.flickVx = 0;
      this.aim.flickVy = 0;
      this.lastTensionTickPower = 0;
      this.emitState();
      return;
    }

    // 2. If a unit is already selected and player starts dragging near it or anywhere in their half, allow aiming from selected unit!
    const selected = activeUnits.find((u) => u.id === this.aim.unitId) ?? activeUnits[0];
    const inActiveHalf =
      this.activeTeam === 'p1' ? pt.y > ARENA_HEIGHT * 0.45 : pt.y < ARENA_HEIGHT * 0.55;
    if (selected && inActiveHalf) {
      this.aim.unitId = selected.id;
      this.aim.pointerId = pointerId;
      this.aim.startX = pt.x;
      this.aim.startY = pt.y;
      this.aim.currentX = pt.x;
      this.aim.currentY = pt.y;
      this.aim.isDragging = true;
      this.aim.power = 0;
      this.aim.lastDragTime = performance.now();
      this.aim.flickVx = 0;
      this.aim.flickVy = 0;
      this.lastTensionTickPower = 0;
      this.emitState();
    }
  }

  public handlePointerMove(clientX: number, clientY: number, pointerId: number): void {
    if (!this.aim.isDragging || this.aim.pointerId !== pointerId || this.phase !== 'PLAYER_AIM') {
      return;
    }

    const pt = this.renderer.screenToArena(clientX, clientY);
    const now = performance.now();
    const dtMs = Math.max(4, now - this.aim.lastDragTime);

    const instVx = ((pt.x - this.aim.currentX) / dtMs) * 1000;
    const instVy = ((pt.y - this.aim.currentY) / dtMs) * 1000;
    this.aim.flickVx = this.aim.flickVx * 0.55 + instVx * 0.45;
    this.aim.flickVy = this.aim.flickVy * 0.55 + instVy * 0.45;
    this.aim.lastDragTime = now;
    this.aim.currentX = pt.x;
    this.aim.currentY = pt.y;

    const dx = pt.x - this.aim.startX;
    const dy = pt.y - this.aim.startY;
    const dragDist = Math.hypot(dx, dy);

    if (this.controlMode === 'slingshot') {
      // Pull back -> shoot forward
      const maxPull = 125;
      this.aim.power = Math.min(1, dragDist / maxPull);
      if (dragDist > 8) {
        this.aim.pullAngle = Math.atan2(-dy, -dx);
        const unit = this.units.find((u) => u.id === this.aim.unitId);
        if (unit) unit.aimAngle = this.aim.pullAngle;
      }
    } else {
      // Direct flick mode: drag forward toward target
      const maxDrag = 110;
      this.aim.power = Math.min(1, dragDist / maxDrag);
      if (dragDist > 8) {
        this.aim.pullAngle = Math.atan2(dy, dx);
        const unit = this.units.find((u) => u.id === this.aim.unitId);
        if (unit) unit.aimAngle = this.aim.pullAngle;
      }
    }

    if (Math.abs(this.aim.power - this.lastTensionTickPower) >= 0.22) {
      this.lastTensionTickPower = this.aim.power;
      this.sound.playPencilTensionTick(this.aim.power);
    }
  }

  public handlePointerUp(pointerId: number): void {
    if (!this.aim.isDragging || this.aim.pointerId !== pointerId) return;

    this.aim.isDragging = false;
    this.aim.pointerId = null;

    if (this.phase !== 'PLAYER_AIM') {
      this.aim.power = 0;
      return;
    }

    const shooter = this.units.find(
      (u) => u.id === this.aim.unitId && u.team === this.activeTeam && !u.destroyed
    );
    if (!shooter) {
      this.aim.power = 0;
      return;
    }

    let launchPower = this.aim.power;
    let launchAngle = this.aim.pullAngle;

    if (this.controlMode === 'flick') {
      const flickSpeed = Math.hypot(this.aim.flickVx, this.aim.flickVy);
      if (flickSpeed > 180) {
        launchAngle = Math.atan2(this.aim.flickVy, this.aim.flickVx);
        launchPower = Math.max(this.aim.power, Math.min(1, flickSpeed / 1450));
      }
    }

    // Cancel shot if released below minimum threshold
    if (launchPower < 0.09) {
      this.aim.power = 0;
      return;
    }

    shooter.aimAngle = launchAngle;
    this.activeProjectile = createProjectile(this.activeTeam, shooter, launchAngle, launchPower);
    if (this.activeTeam === 'p1') this.p1Shots++;
    else this.p2Shots++;

    this.sound.playPencilFlick(launchPower);
    this.aim.power = 0;
    this.phase = 'PROJECTILE_ANIMATING';
    this.emitState();
  }

  private renderFrame(): void {
    const theme = THEMES[this.themeId];
    let aiAimPreview: { unit: Unit; angle: number; power: number } | null = null;

    if (this.phase === 'AI_THINKING' && this.aiDecision) {
      const u = this.units.find((unit) => unit.id === this.aiDecision?.unitId && !unit.destroyed);
      if (u) {
        const progress = Math.max(
          0,
          Math.min(1, 1 - this.aiTimer / Math.max(1, this.levelSpec.opponent.thinkDelayMs))
        );
        u.aimAngle = this.aiDecision.angle;
        aiAimPreview = {
          unit: u,
          angle: this.aiDecision.angle,
          power: this.aiDecision.power * Math.min(1, progress * 1.25)
        };
      }
    }

    this.renderer.render({
      theme,
      decal: this.decal,
      units: this.units,
      obstacles: this.obstacles,
      aim: this.aim,
      aiAimPreview,
      activeProjectile: this.activeProjectile,
      particles: this.particles,
      shakeAmount: this.shakeAmount,
      time: this.elapsedTime,
      activeTeam: this.activeTeam
    });
  }

  private emitState(): void {
    const p1Remaining = this.units.filter((u) => u.team === 'p1' && !u.destroyed).length;
    const p2Remaining = this.units.filter((u) => u.team === 'p2' && !u.destroyed).length;
    this.callbacks.onStateChange({
      phase: this.phase,
      activeTeam: this.activeTeam,
      p1Remaining,
      p2Remaining,
      selectedUnitId: this.aim.unitId,
      aiQuip: this.aiQuip,
      levelName: this.levelSpec?.name ?? '',
      opponentName: this.mode === 'pass_and_play' ? 'Player 2 (Red)' : this.levelSpec?.opponent.name ?? '',
      shotsFired: this.p1Shots + this.p2Shots
    });
  }
}

export { ARENA_HEIGHT, ARENA_WIDTH };
