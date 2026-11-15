import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_PROFILES, CAMPAIGN_LEVELS, generateSkirmishLevel } from '../src/lib/data/levels.ts';
import { DECAL_STYLES, THEMES } from '../src/lib/data/themes.ts';
import { chooseAIShot } from '../src/lib/engine/AIController.ts';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  createProjectile,
  previewShotHitsTarget,
  stepProjectile
} from '../src/lib/engine/Physics.ts';
import type { Obstacle, Unit } from '../src/lib/engine/types.ts';

function buildLevelEntities(lvl: (typeof CAMPAIGN_LEVELS)[number]): {
  units: Unit[];
  obstacles: Obstacle[];
} {
  const units: Unit[] = [
    ...lvl.p1Units.map((u, i) => ({
      id: `p1-${i}`,
      team: 'p1' as const,
      kind: u.kind,
      x: u.x,
      y: u.y,
      radius: u.kind === 'bunker' ? 20 : u.kind === 'radar' ? 16 : 18,
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
      radius: u.kind === 'bunker' ? 20 : u.kind === 'radar' ? 16 : 18,
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
  return { units, obstacles };
}

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

test('all 10 campaign stages have valid AI shots and reachable enemy targets', () => {
  for (const lvl of CAMPAIGN_LEVELS) {
    const { units, obstacles } = buildLevelEntities(lvl);
    const shot = chooseAIShot(units, obstacles, lvl.opponent);
    assert.ok(shot !== null, `Stage ${lvl.id} AI failed to choose shot`);

    const p1Units = units.filter((u) => u.team === 'p1');
    const p2Units = units.filter((u) => u.team === 'p2');

    // Confirm at least one clean shot from p1 can hit at least one p2 unit
    let anyReachable = false;
    for (const s of p1Units) {
      for (const t of p2Units) {
        const baseAngle = Math.atan2(t.y - s.y, t.x - s.x);
        const dist = Math.hypot(t.x - s.x, t.y - s.y);
        const basePower = Math.max(0.25, Math.min(0.98, (dist + 35) / 620));
        for (const aOff of [0, -0.14, 0.14, -0.25, 0.25]) {
          for (const pOff of [0, 0.08, 0.16]) {
            const sim = previewShotHitsTarget(
              s,
              t,
              baseAngle + aOff,
              Math.min(0.98, basePower + pOff),
              units,
              obstacles
            );
            if (sim.hitTarget) {
              anyReachable = true;
              break;
            }
          }
          if (anyReachable) break;
        }
        if (anyReachable) break;
      }
      if (anyReachable) break;
    }
    assert.equal(anyReachable, true, `Stage ${lvl.id} (${lvl.name}) had no reachable p2 target`);
  }
});

test('skirmish Easy, Medium, and Hard difficulties scale AI accuracy and awareness', () => {
  const easy = generateSkirmishLevel('easy', 4);
  const medium = generateSkirmishLevel('medium', 4);
  const hard = generateSkirmishLevel('hard', 4);

  assert.equal(easy.opponent.name, AI_PROFILES.doodler.name);
  assert.equal(medium.opponent.name, AI_PROFILES.geometryNerd.name);
  assert.equal(hard.opponent.name, AI_PROFILES.principal.name);

  assert.ok(easy.opponent.angleErrorRad > medium.opponent.angleErrorRad);
  assert.ok(medium.opponent.angleErrorRad > hard.opponent.angleErrorRad);
  assert.ok(easy.opponent.obstacleAwareness < medium.opponent.obstacleAwareness);
  assert.ok(medium.opponent.obstacleAwareness < hard.opponent.obstacleAwareness);
});

test('all 4 themes and 5 decal sets are defined and free', () => {
  const themeIds = Object.keys(THEMES);
  assert.deepEqual(themeIds.sort(), ['classic', 'graph', 'terminal', 'trapper']);
  for (const t of Object.values(THEMES)) {
    assert.equal(t.supporterOnly, false);
    assert.ok(t.paperBg.length > 0);
    assert.ok(t.p1Ink.length > 0);
    assert.ok(t.p2Ink.length > 0);
    assert.ok(t.cardBg.length > 0);
  }

  assert.equal(DECAL_STYLES.length, 5);
  assert.deepEqual(
    DECAL_STYLES.map((d) => d.id),
    ['standard', 'starfighter', 'ufo', 'mech', 'battleship']
  );
  for (const d of DECAL_STYLES) {
    assert.equal(d.supporterOnly, false);
  }
});

test('gameStore handles 1P campaign progression, 2P pass-and-play, skirmish, themes, and decals', async () => {
  const storeMap = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => storeMap.get(k) ?? null,
    setItem: (k: string, v: string) => {
      storeMap.set(k, v);
    },
    removeItem: (k: string) => {
      storeMap.delete(k);
    }
  };

  const { gameStore } = await import('../src/lib/stores/gameStore.ts');
  const { get } = await import('svelte/store');

  // Campaign progression 1 -> 10
  for (let lvl = 1; lvl <= 10; lvl++) {
    gameStore.startCampaignLevel(lvl);
    assert.equal(get(gameStore).activeMode, 'campaign');
    assert.equal(get(gameStore).activeLevelId, lvl);

    gameStore.recordMatchEnd({
      winner: 'p1',
      mode: 'campaign',
      levelId: lvl,
      levelName: CAMPAIGN_LEVELS[lvl - 1].name,
      p1Shots: 4,
      p1Hits: 3,
      p2Shots: 2,
      p2Hits: 0,
      p1Remaining: CAMPAIGN_LEVELS[lvl - 1].p1Units.length,
      p1Total: CAMPAIGN_LEVELS[lvl - 1].p1Units.length,
      p2Remaining: 0,
      grade: 'A+',
      teacherNote: 'GOLD STAR!'
    });

    const s = get(gameStore);
    assert.equal(s.levelGrades[lvl], 'A+');
    assert.equal(s.highestLevelUnlocked, Math.min(10, lvl + 1));
  }

  // 2P pass and play
  gameStore.startPassAndPlay();
  assert.equal(get(gameStore).activeMode, 'pass_and_play');
  assert.equal(get(gameStore).screen, 'playing');

  // Skirmish Easy & Hard
  gameStore.startSkirmish('easy');
  assert.equal(get(gameStore).skirmishDifficulty, 'easy');
  gameStore.startSkirmish('hard');
  assert.equal(get(gameStore).skirmishDifficulty, 'hard');

  // Themes & Decals
  for (const tid of ['classic', 'graph', 'trapper', 'terminal'] as const) {
    gameStore.setTheme(tid);
    assert.equal(get(gameStore).themeId, tid);
  }
  for (const did of ['standard', 'starfighter', 'ufo', 'mech', 'battleship'] as const) {
    gameStore.setDecal(did);
    assert.equal(get(gameStore).decalStyle, did);
  }
});
