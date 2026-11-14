import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_LEVELS, generateSkirmishLevel } from '../src/lib/data/levels.ts';
import { chooseAIShot } from '../src/lib/engine/AIController.ts';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  createProjectile,
  stepProjectile
} from '../src/lib/engine/Physics.ts';
import type { Obstacle, Unit } from '../src/lib/engine/types.ts';

test('all 10 campaign levels are valid and within arena bounds', () => {
  assert.equal(CAMPAIGN_LEVELS.length, 10);
  for (const level of CAMPAIGN_LEVELS) {
    assert.ok(level.p1Units.length >= 3 && level.p1Units.length <= 5);
    assert.ok(level.p2Units.length >= 3 && level.p2Units.length <= 5);
    for (const u of level.p1Units) {
      assert.ok(u.x > 40 && u.x < ARENA_WIDTH - 20);
      assert.ok(u.y > ARENA_HEIGHT / 2 && u.y < ARENA_HEIGHT - 30);
    }
    for (const u of level.p2Units) {
      assert.ok(u.x > 40 && u.x < ARENA_WIDTH - 20);
      assert.ok(u.y > 30 && u.y < ARENA_HEIGHT / 2);
    }
  }
});

test('skirmish generator creates valid balanced squads', () => {
  for (const diff of ['easy', 'medium', 'hard'] as const) {
    const sk = generateSkirmishLevel(diff, 4);
    assert.equal(sk.p1Units.length, 4);
    assert.equal(sk.p2Units.length, 4);
    assert.ok(sk.obstacles.length >= 3);
  }
});

test('projectile travels across fold crease and hits enemy unit', () => {
  const shooter: Unit = {
    id: 'p1-0',
    team: 'p1',
    kind: 'tank',
    x: 200,
    y: 580,
    radius: 18,
    hp: 1,
    maxHp: 1,
    destroyed: false,
    aimAngle: -Math.PI / 2,
    seed: 1,
    hitFlash: 0
  };
  const target: Unit = {
    id: 'p2-0',
    team: 'p2',
    kind: 'tank',
    x: 200,
    y: 140,
    radius: 18,
    hp: 1,
    maxHp: 1,
    destroyed: false,
    aimAngle: Math.PI / 2,
    seed: 2,
    hitFlash: 0
  };

  const proj = createProjectile('p1', shooter, -Math.PI / 2, 0.85);
  let hitTarget = false;
  let crossedCrease = false;

  for (let i = 0; i < 120 && proj.active; i++) {
    const events = stepProjectile(proj, 1 / 60, [shooter, target], [], false);
    for (const ev of events) {
      if (ev.type === 'crease') crossedCrease = true;
      if (ev.type === 'unit_hit' && ev.unit?.id === target.id) hitTarget = true;
    }
  }

  assert.equal(crossedCrease, true);
  assert.equal(hitTarget, true);
});

test('heavy eraser obstacle stops graphite streak dead', () => {
  const shooter: Unit = {
    id: 'p1-0',
    team: 'p1',
    kind: 'tank',
    x: 200,
    y: 580,
    radius: 18,
    hp: 1,
    maxHp: 1,
    destroyed: false,
    aimAngle: -Math.PI / 2,
    seed: 1,
    hitFlash: 0
  };
  const eraser: Obstacle = {
    id: 'obs-0',
    kind: 'eraser',
    weight: 'heavy',
    shape: 'rect',
    x: 200,
    y: 360,
    width: 90,
    height: 34,
    rotation: 0,
    seed: 10
  };

  const proj = createProjectile('p1', shooter, -Math.PI / 2, 0.85);
  let stoppedByHeavy = false;
  for (let i = 0; i < 120 && proj.active; i++) {
    const events = stepProjectile(proj, 1 / 60, [shooter], [eraser], false);
    if (events.some((e) => e.type === 'obstacle_heavy')) stoppedByHeavy = true;
  }

  assert.equal(stoppedByHeavy, true);
  assert.equal(proj.active, false);
  assert.ok(proj.y >= 335);
});

test('AIController chooses a valid living shooter and bounded power', () => {
  const lvl = CAMPAIGN_LEVELS[5];
  const units: Unit[] = [
    ...lvl.p1Units.map((u, i) => ({
      id: `p1-${i}`,
      team: 'p1' as const,
      kind: u.kind,
      x: u.x,
      y: u.y,
      radius: 18,
      hp: u.kind === 'bunker' ? 2 : 1,
      maxHp: u.kind === 'bunker' ? 2 : 1,
      destroyed: false,
      aimAngle: -Math.PI / 2,
      seed: i,
      hitFlash: 0
    })),
    ...lvl.p2Units.map((u, i) => ({
      id: `p2-${i}`,
      team: 'p2' as const,
      kind: u.kind,
      x: u.x,
      y: u.y,
      radius: 18,
      hp: u.kind === 'bunker' ? 2 : 1,
      maxHp: u.kind === 'bunker' ? 2 : 1,
      destroyed: false,
      aimAngle: Math.PI / 2,
      seed: i + 100,
      hitFlash: 0
    }))
  ];
  const obstacles: Obstacle[] = lvl.obstacles.map((o, i) => ({
    id: `obs-${i}`,
    kind: o.kind,
    weight: o.kind === 'eraser' || o.kind === 'ruler' || o.kind === 'spiral_wire' ? 'heavy' : 'light',
    shape: o.kind === 'coffee_ring' || o.kind === 'doodle_star' || o.kind === 'eraser_shavings' ? 'circle' : 'rect',
    x: o.x,
    y: o.y,
    radius: o.radius,
    width: o.width,
    height: o.height,
    rotation: o.rotation ?? 0,
    seed: i + 200
  }));

  const shot = chooseAIShot(units, obstacles, lvl.opponent);
  assert.ok(shot !== null);
  assert.ok(shot.unitId.startsWith('p2-'));
  assert.ok(shot.power >= 0.15 && shot.power <= 1);
  assert.ok(shot.quip.length > 0);
});
