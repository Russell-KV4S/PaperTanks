import type { Obstacle, Projectile, Team, Unit } from './types';

export const ARENA_WIDTH = 400;
export const ARENA_HEIGHT = 720;
export const FOLD_Y = 360;

export const MIN_LAUNCH_SPEED = 380;
export const MAX_LAUNCH_SPEED = 1220;
export const STOP_SPEED_THRESHOLD = 28;

export interface StepEvent {
  type: 'crease' | 'obstacle_light' | 'obstacle_heavy' | 'unit_hit' | 'wall_stop';
  x: number;
  y: number;
  obstacle?: Obstacle;
  unit?: Unit;
}

export function createProjectile(
  ownerTeam: Team,
  originUnit: Unit,
  angle: number,
  power: number
): Projectile {
  const clampedPower = Math.max(0.08, Math.min(1, power));
  const speed = MIN_LAUNCH_SPEED + (MAX_LAUNCH_SPEED - MIN_LAUNCH_SPEED) * clampedPower;

  return {
    ownerTeam,
    originUnitId: originUnit.id,
    x: originUnit.x,
    y: originUnit.y,
    prevX: originUnit.x,
    prevY: originUnit.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    initialSpeed: speed,
    pressure: 0.45 + clampedPower * 0.55,
    distanceTraveled: 0,
    crossedFold: false,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleFreq: 14 + Math.random() * 8,
    active: true,
    hitObstacleCooldowns: {}
  };
}

export function stepProjectile(
  proj: Projectile,
  dt: number,
  units: Unit[],
  obstacles: Obstacle[],
  allowWobble = true
): StepEvent[] {
  const events: StepEvent[] = [];
  if (!proj.active) return events;

  // Sub-step to guarantee no tunneling at high velocity
  const speed = Math.hypot(proj.vx, proj.vy);
  const subSteps = Math.max(1, Math.min(8, Math.ceil((speed * dt) / 5)));
  const subDt = dt / subSteps;

  for (let s = 0; s < subSteps; s++) {
    if (!proj.active) break;

    // Update obstacle cooldowns
    for (const key of Object.keys(proj.hitObstacleCooldowns)) {
      proj.hitObstacleCooldowns[key] -= subDt;
      if (proj.hitObstacleCooldowns[key] <= 0) {
        delete proj.hitObstacleCooldowns[key];
      }
    }

    proj.prevX = proj.x;
    proj.prevY = proj.y;

    // Paper-grain lateral wobble (subtle organic pencil drift)
    if (allowWobble) {
      proj.wobblePhase += subDt * proj.wobbleFreq;
      const curSpeed = Math.hypot(proj.vx, proj.vy);
      if (curSpeed > 1) {
        const nx = -proj.vy / curSpeed;
        const ny = proj.vx / curSpeed;
        const wobbleForce = Math.sin(proj.wobblePhase) * 34 + Math.cos(proj.wobblePhase * 1.7) * 18;
        proj.vx += nx * wobbleForce * subDt;
        proj.vy += ny * wobbleForce * subDt;
      }
    }

    // Move
    proj.x += proj.vx * subDt;
    proj.y += proj.vy * subDt;
    proj.distanceTraveled += Math.hypot(proj.x - proj.prevX, proj.y - proj.prevY);

    // Friction & pressure decay
    const curSpeed = Math.hypot(proj.vx, proj.vy);
    const dragFactor = Math.exp(-1.05 * subDt);
    let nextSpeed = curSpeed * dragFactor - 145 * subDt;
    if (nextSpeed <= STOP_SPEED_THRESHOLD) {
      proj.vx = 0;
      proj.vy = 0;
      proj.active = false;
      break;
    }

    const scale = nextSpeed / Math.max(1, curSpeed);
    proj.vx *= scale;
    proj.vy *= scale;
    proj.pressure = Math.max(0.15, Math.min(1, nextSpeed / MAX_LAUNCH_SPEED + 0.15));

    // Check center paper fold crease crossing
    if (
      !proj.crossedFold &&
      ((proj.prevY <= FOLD_Y && proj.y >= FOLD_Y) || (proj.prevY >= FOLD_Y && proj.y <= FOLD_Y))
    ) {
      proj.crossedFold = true;
      const speedRatio = nextSpeed / MAX_LAUNCH_SPEED;
      if (allowWobble && speedRatio < 0.78) {
        // Slower shots get a tiny paper-crease deflection
        const nudge = (Math.random() - 0.5) * 0.1 * (1 - speedRatio);
        rotateVelocity(proj, nudge);
      }
      proj.vx *= 0.96;
      proj.vy *= 0.96;
      events.push({ type: 'crease', x: proj.x, y: FOLD_Y });
    }

    // Check page boundaries (left spiral margin x=28, right=392, top=16, bottom=704)
    if (proj.x < 28 || proj.x > ARENA_WIDTH - 8 || proj.y < 14 || proj.y > ARENA_HEIGHT - 14) {
      proj.x = Math.max(28, Math.min(ARENA_WIDTH - 8, proj.x));
      proj.y = Math.max(14, Math.min(ARENA_HEIGHT - 14, proj.y));
      proj.active = false;
      events.push({ type: 'wall_stop', x: proj.x, y: proj.y });
      break;
    }

    // Check enemy unit collisions
    for (const unit of units) {
      if (unit.destroyed || unit.team === proj.ownerTeam) continue;
      const dist = Math.hypot(proj.x - unit.x, proj.y - unit.y);
      if (dist <= unit.radius + 2.5) {
        proj.active = false;
        events.push({ type: 'unit_hit', x: proj.x, y: proj.y, unit });
        break;
      }
    }
    if (!proj.active) break;

    // Check obstacle collisions
    for (const obs of obstacles) {
      if (proj.hitObstacleCooldowns[obs.id]) continue;

      const hit = checkObstacleHit(proj.x, proj.y, obs);
      if (!hit.collided) continue;

      proj.hitObstacleCooldowns[obs.id] = 0.14;

      if (obs.weight === 'heavy') {
        if (obs.kind === 'ruler') {
          // Ruler acts as a hard wooden edge: reflect if hitting flat side, else stop
          const speedBefore = Math.hypot(proj.vx, proj.vy);
          const dot = proj.vx * hit.nx + proj.vy * hit.ny;
          if (dot < 0 && speedBefore > 260) {
            proj.vx = (proj.vx - 2 * dot * hit.nx) * 0.72;
            proj.vy = (proj.vy - 2 * dot * hit.ny) * 0.72;
            proj.x += hit.nx * 3;
            proj.y += hit.ny * 3;
            events.push({ type: 'obstacle_light', x: proj.x, y: proj.y, obstacle: obs });
          } else {
            proj.active = false;
            events.push({ type: 'obstacle_heavy', x: proj.x, y: proj.y, obstacle: obs });
          }
        } else {
          // Eraser / spiral stops graphite dead with smudge
          proj.active = false;
          events.push({ type: 'obstacle_heavy', x: proj.x, y: proj.y, obstacle: obs });
        }
        break;
      } else {
        // Light doodle obstacle: slow down + slight deflection
        const slowFactor = obs.kind === 'coffee_ring' ? 0.88 : obs.kind === 'paper_clip' ? 0.85 : 0.76;
        proj.vx *= slowFactor;
        proj.vy *= slowFactor;

        if (obs.kind === 'paper_clip') {
          const deflect = (allowWobble ? (Math.random() < 0.5 ? -1 : 1) : 1) * 0.28;
          rotateVelocity(proj, deflect);
        } else if (allowWobble) {
          const deflect = (Math.random() - 0.5) * 0.32;
          rotateVelocity(proj, deflect);
        }

        events.push({ type: 'obstacle_light', x: proj.x, y: proj.y, obstacle: obs });
      }
    }
  }

  return events;
}

function rotateVelocity(proj: Projectile, rad: number): void {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const vx = proj.vx * cos - proj.vy * sin;
  const vy = proj.vx * sin + proj.vy * cos;
  proj.vx = vx;
  proj.vy = vy;
}

function checkObstacleHit(
  px: number,
  py: number,
  obs: Obstacle
): { collided: boolean; nx: number; ny: number } {
  if (obs.shape === 'circle') {
    const r = obs.radius ?? 22;
    const dx = px - obs.x;
    const dy = py - obs.y;
    const dist = Math.hypot(dx, dy);

    if (obs.kind === 'coffee_ring') {
      // Only rim triggers coffee stain drag
      if (Math.abs(dist - r) <= 5.5) {
        const len = Math.max(1, dist);
        return { collided: true, nx: dx / len, ny: dy / len };
      }
      return { collided: false, nx: 0, ny: 0 };
    }

    if (dist <= r) {
      const len = Math.max(1, dist);
      return { collided: true, nx: dx / len, ny: dy / len };
    }
    return { collided: false, nx: 0, ny: 0 };
  }

  // Oriented bounding box check
  const w = (obs.width ?? 60) / 2;
  const h = (obs.height ?? 30) / 2;
  const rot = obs.rotation ?? 0;
  const cos = Math.cos(-rot);
  const sin = Math.sin(-rot);
  const dx = px - obs.x;
  const dy = py - obs.y;
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;

  if (Math.abs(lx) <= w && Math.abs(ly) <= h) {
    // Compute local normal toward nearest edge
    const penX = w - Math.abs(lx);
    const penY = h - Math.abs(ly);
    let lnx = 0;
    let lny = 0;
    if (penX < penY) {
      lnx = lx >= 0 ? 1 : -1;
    } else {
      lny = ly >= 0 ? 1 : -1;
    }
    const rCos = Math.cos(rot);
    const rSin = Math.sin(rot);
    return {
      collided: true,
      nx: lnx * rCos - lny * rSin,
      ny: lnx * rSin + lny * rCos
    };
  }

  return { collided: false, nx: 0, ny: 0 };
}

export function previewShotHitsTarget(
  originUnit: Unit,
  targetUnit: Unit,
  angle: number,
  power: number,
  units: Unit[],
  obstacles: Obstacle[]
): { hitTarget: boolean; hitHeavy: boolean; minDistToTarget: number } {
  const sim = createProjectile(originUnit.team, originUnit, angle, power);
  let minDist = Infinity;
  let hitTarget = false;
  let hitHeavy = false;

  for (let step = 0; step < 90; step++) {
    const events = stepProjectile(sim, 1 / 60, units, obstacles, false);
    const d = Math.hypot(sim.x - targetUnit.x, sim.y - targetUnit.y);
    if (d < minDist) minDist = d;

    for (const ev of events) {
      if (ev.type === 'unit_hit') {
        hitTarget = true;
      } else if (ev.type === 'obstacle_heavy') {
        hitHeavy = true;
      }
    }
    if (!sim.active) break;
  }

  return { hitTarget, hitHeavy, minDistToTarget: minDist };
}
