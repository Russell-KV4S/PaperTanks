import { previewShotHitsTarget } from './Physics';
import type { AIPersonality, Obstacle, Unit } from './types';

export interface AIShotDecision {
  unitId: string;
  angle: number;
  power: number;
  quip: string;
}

export function chooseAIShot(
  units: Unit[],
  obstacles: Obstacle[],
  personality: AIPersonality
): AIShotDecision | null {
  const aiUnits = units.filter((u) => u.team === 'p2' && !u.destroyed);
  const p1Units = units.filter((u) => u.team === 'p1' && !u.destroyed);
  if (aiUnits.length === 0 || p1Units.length === 0) return null;

  let bestScore = -Infinity;
  let bestShooter = aiUnits[0];
  let bestAngle = Math.PI / 2;
  let bestPower = 0.65;

  const checkObstacles = Math.random() < personality.obstacleAwareness;

  for (const shooter of aiUnits) {
    for (const target of p1Units) {
      const dx = target.x - shooter.x;
      const dy = target.y - shooter.y;
      const dist = Math.hypot(dx, dy);
      const baseAngle = Math.atan2(dy, dx);

      // Estimate power needed based on distance across page (~150..620px)
      const estPower = Math.max(0.2, Math.min(0.96, (dist + 35) / 620));

      const angleOffsets = checkObstacles ? [0, -0.14, 0.14, -0.26, 0.26] : [0];
      const powerOffsets = checkObstacles ? [0, 0.08, -0.06] : [0];

      for (const aOff of angleOffsets) {
        for (const pOff of powerOffsets) {
          const candAngle = baseAngle + aOff;
          const candPower = Math.max(0.18, Math.min(0.98, estPower + pOff));
          const sim = previewShotHitsTarget(
            shooter,
            target,
            candAngle,
            candPower,
            units,
            checkObstacles ? obstacles : []
          );

          let score = 0;
          if (sim.hitTarget) score += 120;
          score -= sim.minDistToTarget * 0.45;
          if (sim.hitHeavy) score -= 90;
          // Prefer low-HP targets or radars slightly
          if (target.hp === 1) score += 12;
          // Slight preference for direct angles when tied
          score -= Math.abs(aOff) * 18;
          // Small random tie-breaker so AI varies units
          score += Math.random() * 14;

          if (score > bestScore) {
            bestScore = score;
            bestShooter = shooter;
            bestAngle = candAngle;
            bestPower = candPower;
          }
        }
      }
    }
  }

  // Apply personality-specific human error margin
  const angleErr = (Math.random() - 0.5) * 2 * personality.angleErrorRad;
  const powerErr = (Math.random() - 0.5) * 2 * personality.powerErrorRatio;

  const finalAngle = bestAngle + angleErr;
  const finalPower = Math.max(0.16, Math.min(0.98, bestPower + powerErr));
  const quip = personality.quips[Math.floor(Math.random() * personality.quips.length)];

  return {
    unitId: bestShooter.id,
    angle: finalAngle,
    power: finalPower,
    quip
  };
}
